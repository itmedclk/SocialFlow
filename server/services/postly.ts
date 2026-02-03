import { storage } from "../storage";
import type { Post, Campaign } from "@shared/schema";

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

export async function publishToPostly(
  post: Post,
  campaign: Campaign,
  userApiKey?: string | null,
  userWorkspaceId?: string | null,
  captionOverride?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = userApiKey;
  const workspaceId = userWorkspaceId;

  if (!apiKey) {
    throw new Error(
      "Postly API key not configured for this user. Please set it in settings.",
    );
  }

  const baseUrl = "https://openapi.postly.ai/v1";
  const platforms = campaign.targetPlatforms || [];

  let targetPlatforms: string | undefined;

  // if accountid is set, use it
  if (campaign.useSpecificAccount && campaign.specificAccountId) {
    targetPlatforms = campaign.specificAccountId;
    console.warn(
      "useSpecificAccount is true but specificAccountId" +
        campaign.specificAccountId,
    );
  } else {
    targetPlatforms = platforms.join(",");
  }

  const payload: PostlyPublishPayload = {
    text: captionOverride || post.generatedCaption || "",
    //target_platforms: platforms.join(","),
    target_platforms: targetPlatforms,
    workspace: workspaceId || undefined,
  };

  if (post.imageUrl) {
    let mimeType = "image/jpeg";
    const lowerUrl = post.imageUrl.toLowerCase();

    if (lowerUrl.endsWith(".png")) mimeType = "image/png";
    else if (lowerUrl.endsWith(".gif")) mimeType = "image/gif";
    else if (lowerUrl.endsWith(".webp")) mimeType = "image/webp";
    else if (lowerUrl.includes("pexels.com")) mimeType = "image/jpeg";
    else if (lowerUrl.includes("wikimedia.org")) mimeType = "image/jpeg";

    payload.media = [
      {
        url: post.imageUrl,
        type: mimeType,
      },
    ];
  }

  try {
    const response = await fetch(`${baseUrl}/posts`, {
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

    if (data.error) {
      throw new Error(data.error || "Postly returned unsuccessful response");
    }

    const publishTarget = campaign.useSpecificAccount && campaign.specificAccountId 
      ? `account(s): ${campaign.specificAccountId}`
      : platforms.join(", ");

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      userId: campaign.userId,
      level: "info",
      message: `Post published successfully to ${publishTarget}`,
      metadata: { postlyId: data.post_id, platforms, accountIds: targetPlatforms },
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      userId: campaign.userId,
      level: "error",
      message: `Failed to publish to Postly: ${errorMessage}`,
      metadata: { platforms },
    });

    return { success: false, error: errorMessage };
  }
}

export async function getSocialAccounts(
  apiKey: string,
): Promise<Array<{ id: string; platform: string; name: string }>> {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch("https://openapi.postly.ai/v1/accounts", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
