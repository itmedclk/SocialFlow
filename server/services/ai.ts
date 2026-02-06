import { storage } from "../storage";
import { db } from "../db";
import { userSettings } from "../../shared/schema";
import type { Post, Campaign } from "../../shared/schema";
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

export interface RelevanceCheckResult {
  isRelevant: boolean;
  reason: string;
}

export async function checkArticleRelevance(
  post: Post,
  campaign: Campaign,
): Promise<RelevanceCheckResult> {
  const config = await getAIConfig(campaign.userId);

  const prompt = `You are a content relevance evaluator. Your job is to determine if an article is suitable for creating an educational social media post about the topic: "${campaign.topic}".

Article Title: ${post.sourceTitle}
Article Snippet: ${post.sourceSnippet || "N/A"}
Article URL: ${post.sourceUrl}

Evaluate whether this article is:
1. Related to the campaign topic "${campaign.topic}"
2. Suitable for educational or informational social media content
3. Not purely promotional, clickbait, or irrelevant

Respond with ONLY valid JSON (no markdown, no code blocks):
{"isRelevant": true/false, "reason": "brief explanation"}`;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "You are a content relevance evaluator. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error(`[AI] Relevance check API error: ${response.status}`);
      return { isRelevant: true, reason: "Relevance check skipped due to API error" };
    }

    const data: ChatCompletionResponse = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { isRelevant: true, reason: "Relevance check skipped: empty AI response" };
    }

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      isRelevant: !!parsed.isRelevant,
      reason: parsed.reason || "No reason provided",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[AI] Relevance check failed: ${errorMessage}`);
    return { isRelevant: true, reason: `Relevance check skipped due to error: ${errorMessage}` };
  }
}

export interface CaptionResult {
  caption: string;
  imageSearchPhrase: string;
  imageFallbackConcepts: string[];
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
  const estimatedTokens = Math.max(300, Math.ceil(maxLength / 2) + 150);
  const maxTokens = maxLength < 500 ? estimatedTokens : 2048;

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
    let imageFallbackConcepts: string[] = [];
    let imagePrompt: string = "";

    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        caption = parsed.caption || rawContent;
        imageSearchPhrase = parsed.imageSearchPhrase || "";
        imageFallbackConcepts = parsed.imageFallbackConcepts || [];
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
        imageFallbackConcepts,
        imagePrompt: imagePrompt.substring(0, 100),
      },
    });

    return { caption, imageSearchPhrase, imageFallbackConcepts, imagePrompt };
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
The post should be compelling and encourage engagement.NEVER decide hashtag language yourself — follow the campaign prompt exactly.
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
  "imageFallbackConcepts": ["1–2 broad concepts"],
  "imagePrompt": "Detailed AI image generation prompt"
}

The imageSearchPhrase should be a short, descriptive phrase (2-4 words) that would work well for searching stock photos. Focus on the main visual concept or subject of the article. Examples: "healthy smoothie bowl", "nature meditation", "fresh vegetables", "yoga sunrise". Do NOT include the imageSearchPhrase text in the caption itself.

Rules for imageSearchPhrase:
- MUST be specific and concrete
- 2–4 words
- Describes a visible object, food, plant, tool, or scenery
- Example: "herbal tea cup", "fresh blueberries bowl", "sunlit forest path"

Rules for imageFallbackConcepts:
- 1–2 GENERAL concepts only
- Used ONLY as a backup if imageSearchPhrase fails
- Can be abstract or broad
- Example values: ["health"], ["nutrition"], ["wellness"], ["eye health"]

CRITICAL:
- Do NOT put general concepts into imageSearchPhrase
- If no specific visual can be inferred, still attempt a best-guess imageSearchPhrase,
  and place general concepts ONLY in imageFallbackConcepts

The imagePrompt should be a detailed prompt for AI image generation. CRITICAL RULES for imagePrompt:
- Create a clean, positive, healthy, bright, and natural image
- Focus on object-only still life or nature-only landscapes
- Images should feature objects, food, plants, products, tools, or scenery (no people)
- Do NOT include people or human figures; avoid faces, bodies, hands, silhouettes, or crowds
- NO organs, NO anatomy, NO medical scenes, NO surgery, NO blood
- NO disgusting or scary content
- NO logos, NO app icons, NO any icons, NO symbols
- NO text, NO words, NO letters, NO writing, NO watermarks
- NO mention of Instagram, Facebook, Twitter, TikTok, or any social media platform
- The mood should be light, friendly, and have gentle wellness-style humor

- Examples: "Fresh colorful fruits and vegetables on a wooden table with morning sunlight", "Peaceful forest landscape with soft morning mist and sun rays", "Cozy cup of herbal tea with honey and lemon on a rustic table", "Minimalist still life of wellness items on a clean countertop"`;

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
