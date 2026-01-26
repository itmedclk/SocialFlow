import { storage } from "../storage";
import type { Post, Campaign } from "@shared/schema";

interface PostlyConfig {
  apiKey: string;
  baseUrl: string;
  workspaceId: string;
}

interface PostlyPublishPayload {
  text: string;
  media?: Array<{
    url: string;
    type: string;
  }>;
  target_platforms?: string;
  workspace?: string;
  one_off_schedule?: {
    one_off_date: string;
    time: string;
    timezone: string;
  };
}

interface PostlyResponse {
  success: boolean;
  post_id?: string;
  message?: string;
  error?: string;
}

function getPostlyConfig(): PostlyConfig {
  const apiKey = process.env.POSTLY_API_KEY || "";
  const baseUrl = process.env.POSTLY_BASE_URL || "https://openapi.postly.ai/v1";
  const workspaceId = process.env.POSTLY_WORKSPACE_ID || "";

  return { apiKey, baseUrl, workspaceId };
}

export async function publishToPostly(
  post: Post,
  campaign: Campaign,
  userApiKey?: string | null,
  userWorkspaceId?: string | null,
  captionOverride?: string | null
): Promise<{ success: boolean; error?: string }> {
  const config = getPostlyConfig();
  const apiKey = userApiKey || config.apiKey;
  const workspaceId = userWorkspaceId || config.workspaceId;

  if (!apiKey) {
    throw new Error("Postly API key not configured. Please set it in settings.");
  }

  const platforms = campaign.targetPlatforms || [];
  
  const payload: PostlyPublishPayload = {
    text: captionOverride || post.generatedCaption || "",
    target_platforms: platforms.join(","),
    workspace: workspaceId || undefined,
  };

  if (post.imageUrl) {
    let mimeType = "image/jpeg"; // Default
    const lowerUrl = post.imageUrl.toLowerCase();
    
    if (lowerUrl.endsWith(".png")) mimeType = "image/png";
    else if (lowerUrl.endsWith(".gif")) mimeType = "image/gif";
    else if (lowerUrl.endsWith(".webp")) mimeType = "image/webp";
    else if (lowerUrl.includes("pexels.com")) mimeType = "image/jpeg";
    else if (lowerUrl.includes("wikimedia.org")) mimeType = "image/jpeg";

    payload.media = [
      {
        url: post.imageUrl,
        type: mimeType
      }
    ];
  }

  try {
    const response = await fetch(`${config.baseUrl}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Postly API error: ${response.status} - ${errorText}`);
    }

    const data: PostlyResponse = await response.json();

    // The API might return success in a different format, checking based on common patterns
    if (data.error) {
      throw new Error(data.error || "Postly returned unsuccessful response");
    }

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      level: "info",
      message: `Post published successfully to ${platforms.join(", ")}`,
      metadata: { postlyId: data.post_id, platforms },
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      level: "error",
      message: `Failed to publish to Postly: ${errorMessage}`,
      metadata: { platforms },
    });

    return { success: false, error: errorMessage };
  }
}

export async function getSocialAccounts(): Promise<Array<{ id: string; platform: string; name: string }>> {
  const config = getPostlyConfig();

  if (!config.apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${config.baseUrl}/accounts`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error("Failed to fetch Postly accounts:", error);
    return [];
  }
}
