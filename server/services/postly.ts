import { storage } from "../storage";
import type { Post, Campaign } from "@shared/schema";

interface PostlyConfig {
  apiKey: string;
  baseUrl: string;
}

interface PostlyPublishPayload {
  message: string;
  media_urls?: string[];
  platforms: string[];
  scheduled_time?: string;
}

interface PostlyResponse {
  success: boolean;
  post_id?: string;
  error?: string;
}

function getPostlyConfig(): PostlyConfig {
  const apiKey = process.env.POSTLY_API_KEY || "";
  const baseUrl = process.env.POSTLY_BASE_URL || "https://api.postly.ai/v1";

  return { apiKey, baseUrl };
}

export async function publishToPostly(
  post: Post,
  campaign: Campaign
): Promise<{ success: boolean; error?: string }> {
  const config = getPostlyConfig();

  if (!config.apiKey) {
    throw new Error("POSTLY_API_KEY environment variable is not set");
  }

  const platforms = campaign.targetPlatforms || [];
  
  if (platforms.length === 0) {
    throw new Error("No target platforms configured for this campaign");
  }

  const payload: PostlyPublishPayload = {
    message: post.generatedCaption || "",
    platforms: platforms,
  };

  if (post.imageUrl) {
    payload.media_urls = [post.imageUrl];
  }

  try {
    const response = await fetch(`${config.baseUrl}/posts/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Postly API error: ${response.status} - ${errorText}`);
    }

    const data: PostlyResponse = await response.json();

    if (!data.success) {
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
