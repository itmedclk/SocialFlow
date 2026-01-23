import { storage } from "../storage";
import type { Post, Campaign } from "@shared/schema";

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

async function getAIConfig(userId?: string): Promise<AIConfig> {
  let baseUrl = process.env.AI_BASE_URL || "https://api.novita.ai/openai";
  let apiKey = process.env.AI_API_KEY || "";
  let model = "deepseek/deepseek-v3.2";

  if (userId) {
    const settings = await storage.getUserSettings(userId);
    if (settings) {
      if (settings.aiBaseUrl) baseUrl = settings.aiBaseUrl;
      if (settings.aiApiKey) apiKey = settings.aiApiKey;
      if (settings.aiModel) model = settings.aiModel;
    }
  }

  return { baseUrl, apiKey, model };
}

export async function generateCaption(
  post: Post,
  campaign: Campaign,
  overridePrompt?: string
): Promise<string> {
  const config = await getAIConfig(campaign.userId?.toString());

  if (!config.apiKey) {
    throw new Error("AI_API_KEY environment variable is not set");
  }

  const systemPrompt = buildSystemPrompt(campaign);
  const userPrompt = buildUserPrompt(post);

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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();
    const caption = data.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error("AI returned empty response");
    }

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
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
      level: "error",
      message: `Caption generation failed: ${errorMessage}`,
      metadata: { model: config.model },
    });

    throw error;
  }
}

function buildSystemPrompt(campaign: Campaign,
                          overridePrompt?: string
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

function buildUserPrompt(post: Post): string {
  let prompt = `Create a social media post based on this article:\n\n`;
  prompt += `Title: ${post.sourceTitle}\n`;

  if (post.sourceSnippet) {
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
    if (term && term.length > 2) { // Only check terms with more than 2 characters to avoid over-matching
      const regex = new RegExp(`\\b${term}\\b`, 'i');
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
