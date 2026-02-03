import { storage } from "../storage";
import { db } from "../db";
import { userSettings } from "@shared/schema";
import type { Post, Campaign } from "@shared/schema";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function getAIConfig(userId?: string | null): Promise<AIConfig> {
  const baseUrlEnv = process.env.AI_BASE_URL || "https://api.novita.ai/openai";
  const apiKeyEnv = process.env.AI_API_KEY || "";
  const modelEnv = process.env.AI_MODEL || "openai/gpt-oss-20b";

  console.log(`[AI] Getting config for user identifier: "${userId}"`);

  let targetUserId = userId;

  if (!targetUserId) {
    const allSettings = await db.select().from(userSettings).limit(1);
    if (allSettings.length > 0) {
      targetUserId = allSettings[0].userId;
      console.log(
        `[AI] No userId provided, using first found user: "${targetUserId}"`,
      );
    }
  }

  if (targetUserId) {
    try {
      const settings = await storage.getUserSettings(targetUserId.toString());
      console.log(
        `[AI] Found settings for user ${targetUserId}:`,
        settings ? "Yes" : "No",
      );
      if (settings && settings.aiApiKey) {
        return {
          baseUrl: settings.aiBaseUrl || baseUrlEnv,
          apiKey: settings.aiApiKey,
          model: settings.aiModel || modelEnv,
        };
      }
    } catch (error) {
      console.error(
        `[AI] Error fetching settings for user ${targetUserId}:`,
        error,
      );
    }
  }

  return { baseUrl: baseUrlEnv, apiKey: apiKeyEnv, model: modelEnv };
}

async function fetchFullContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return article?.textContent
      ? article.textContent.trim().substring(0, 10000)
      : null;
  } catch (error) {
    console.error(`[AI] Error fetching full content from ${url}:`, error);
    return null;
  }
}

export interface CaptionResult {
  caption: string;
  imageSearchPhrase: string;
  imagePrompt: string;
}

export async function generateCaption(
  post: Post,
  campaign: Campaign,
  overridePrompt?: string,
): Promise<CaptionResult> {
  const config = await getAIConfig(campaign.userId);

  if (!config.apiKey) {
    throw new Error(
      "No AI API key found. Please enter your API key in the Settings page.",
    );
  }

  // Fetch full content if possible
  const fullContent = await fetchFullContent(post.sourceUrl);

  const systemPrompt = buildSystemPrompt(campaign, overridePrompt);
  const userPrompt = buildUserPrompt(post, fullContent);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Reduce max_tokens for short content limits to bias shorter outputs
  // Rough estimate: 1 token ≈ 4 characters, plus buffer for JSON formatting
  const maxLength = campaign.safetyMaxLength || 2000;
  const estimatedTokens = Math.max(200, Math.ceil(maxLength / 3) + 100);
  const maxTokens = maxLength < 500 ? estimatedTokens : 2000;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();
    const rawContent = data.choices[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error("AI returned empty response");
    }

    // Parse JSON response
    let caption: string;
    let imageSearchPhrase: string = "";
    let imagePrompt: string = "";

    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        caption = parsed.caption || rawContent;
        imageSearchPhrase = parsed.imageSearchPhrase || "";
        imagePrompt = parsed.imagePrompt || "";
      } else {
        // Fallback: treat entire response as caption
        caption = rawContent;
      }
    } catch (parseError) {
      // If JSON parsing fails, use raw content as caption
      console.warn(
        "[AI] Failed to parse JSON response, using raw content as caption",
      );
      caption = rawContent;
    }

    // Append article link at the end of the post if not already present
    if (post.sourceUrl && !caption.includes(post.sourceUrl)) {
      caption += `\n\nRead more: ${post.sourceUrl}`;
    }

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      userId: campaign.userId,
      level: "info",
      message: `Caption generated successfully`,
      metadata: {
        model: config.model,
        captionLength: caption.length,
        imageSearchPhrase,
        imagePrompt: imagePrompt.substring(0, 100),
      },
    });

    return { caption, imageSearchPhrase, imagePrompt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      userId: campaign.userId,
      level: "error",
      message: `Caption generation failed: ${errorMessage}`,
      metadata: { model: config.model },
    });

    throw error;
  }
}

function buildSystemPrompt(
  campaign: Campaign,
  overridePrompt?: string,
): string {
  const defaultPrompt = `You are a social media content creator. Create engaging, concise social media posts based on the article provided. 
Keep the tone professional yet approachable. Include relevant hashtags. 
The post should be compelling and encourage engagement.
IMPORTANT: Never use "Thread x/x" or numbered thread formats in the output. Create a single cohesive post.`;

  const customPrompt = overridePrompt?.trim() || campaign.aiPrompt?.trim();

  let prompt = customPrompt || defaultPrompt;

  if (!prompt.toLowerCase().includes("thread")) {
    prompt += `\n\nIMPORTANT: Do not use "Thread x/x" or any numbered thread format. Provide the caption as a single block of text.`;
  }

  if (campaign.safetyMaxLength) {
    prompt += `\n\n*** CRITICAL LENGTH REQUIREMENT ***\nThe caption MUST be ${campaign.safetyMaxLength} characters or less. This is a hard limit - count your characters carefully. If the limit is very short (under 200 characters), write a brief, punchy caption with only 1-2 sentences and fewer hashtags.`;
  }

  if (campaign.targetPlatforms && campaign.targetPlatforms.length > 0) {
    prompt += `\n\nTarget platforms: ${campaign.targetPlatforms.join(", ")}. Optimize the content for these platforms.`;
  }

  // Add instruction for image search phrase and image prompt
  prompt += `\n\nIMPORTANT: You must respond in the following JSON format:
{
  "caption": "Your social media caption here",
  "imageSearchPhrase": "2-4 word phrase for stock photo search",
  "imagePrompt": "Detailed AI image generation prompt"
}

The imageSearchPhrase should be a short, descriptive phrase (2-4 words) that would work well for searching stock photos. Focus on the main visual concept or subject of the article. Examples: "healthy smoothie bowl", "nature meditation", "fresh vegetables", "yoga sunrise". Do NOT include the imageSearchPhrase text in the caption itself.

The imagePrompt should be a detailed prompt for AI image generation. CRITICAL RULES for imagePrompt:
- Create a clean, positive, healthy, happy, bright, and natural image
- Focus on wellness, nature, food, lifestyle, or abstract concepts
- Images can be ANYTHING healthy and positive - not limited to people (plants, food, nature, objects, abstract art, etc.)
- If including people, do NOT specify race, ethnicity, or skin color - keep descriptions generic like "person" or "people"
- NO organs, NO anatomy, NO medical scenes, NO surgery, NO blood
- NO disgusting or scary content
- NO logos, NO app icons, NO any icons, NO symbols
- NO text, NO words, NO letters, NO writing, NO watermarks
- NO mention of Instagram, Facebook, Twitter, TikTok, or any social media platform
- The mood should be light, friendly, and have gentle wellness-style humor

- Examples: "Fresh colorful fruits and vegetables on a wooden table with morning sunlight", "Peaceful zen garden with smooth stones and bamboo", "Cozy cup of herbal tea with honey and lemon on a rustic table", "Abstract watercolor of flowing energy in soft pastel colors"`;

  return prompt;
}

function buildUserPrompt(post: Post, fullContent: string | null): string {
  let prompt = `Create a social media post based on this article:\n\n`;
  prompt += `Title: ${post.sourceTitle}\n`;

  if (fullContent) {
    prompt += `\nFull Article Content:\n${fullContent}\n`;
  } else if (post.sourceSnippet) {
    prompt += `\nContent Summary:\n${post.sourceSnippet}\n`;
  }

  prompt += `\nSource URL: ${post.sourceUrl}`;

  return prompt;
}

export interface SafetyConfig {
  forbiddenTerms: string[];
  maxLength: number;
}

export interface SafetyResult {
  isValid: boolean;
  issues: string[];
}

export function validateContent(
  caption: string,
  config: SafetyConfig,
): SafetyResult {
  const issues: string[] = [];

  if (caption.length > config.maxLength) {
    issues.push(
      `Caption exceeds maximum length (${caption.length}/${config.maxLength} characters)`,
    );
  }

  for (const term of config.forbiddenTerms) {
    if (term && term.length > 2) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(caption)) {
        issues.push(`Contains forbidden term: "${term}"`);
      }
    } else if (term && caption.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`Contains forbidden term: "${term}"`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function getSafetyConfigFromCampaign(campaign: Campaign): SafetyConfig {
  const forbiddenTerms = campaign.safetyForbiddenTerms
    ? campaign.safetyForbiddenTerms
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    forbiddenTerms,
    maxLength: campaign.safetyMaxLength || 2000,
  };
}
