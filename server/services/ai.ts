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
  const baseUrlEnv =
    process.env.AI_BASE_URL || "https://api.novita.ai/openai";
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

export async function generateCaption(
  post: Post,
  campaign: Campaign,
  overridePrompt?: string,
): Promise<string> {
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
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();
    let caption = data.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error("AI returned empty response");
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
      metadata: { model: config.model, captionLength: caption.length },
    });

    return caption;
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
    prompt += `\n\nIMPORTANT: Keep the post under ${campaign.safetyMaxLength} characters.`;
  }

  if (campaign.targetPlatforms && campaign.targetPlatforms.length > 0) {
    prompt += `\n\nTarget platforms: ${campaign.targetPlatforms.join(", ")}. Optimize the content for these platforms.`;
  }

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
