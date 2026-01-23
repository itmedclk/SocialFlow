import { storage } from "../storage";
import { generateCaption, validateContent, getSafetyConfigFromCampaign } from "./ai";
import { searchImage, extractOgImage, getImageKeywordsFromCampaign } from "./images";
import { publishToPostly } from "./postly";
import type { Post, Campaign } from "@shared/schema";

const MAX_RETRIES = 3;

export async function processNewPost(post: Post, campaign: Campaign): Promise<void> {
  try {
    const safetyConfig = getSafetyConfigFromCampaign(campaign);
    let caption: string | null = null;
    let safetyResult: { isValid: boolean; issues: string[] } = { isValid: false, issues: [] };
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      caption = await generateCaption(post, campaign);
      safetyResult = validateContent(caption, safetyConfig);
      
      if (safetyResult.isValid) {
        break;
      }
      
      if (attempt < MAX_RETRIES) {
        await storage.createLog({
          campaignId: campaign.id,
          postId: post.id,
          level: "warning",
          message: `Caption failed safety check, regenerating (attempt ${attempt}/${MAX_RETRIES})`,
          metadata: { issues: safetyResult.issues },
        });
      }
    }

    if (!safetyResult.isValid || !caption) {
      throw new Error(`Caption failed safety validation after ${MAX_RETRIES} attempts: ${safetyResult.issues.join(", ")}`);
    }

    let imageUrl = post.imageUrl;
    let imageCredit: string | null = null;

    if (!imageUrl) {
      const ogImage = await extractOgImage(post.sourceUrl);
      if (ogImage) {
        imageUrl = ogImage;
        imageCredit = "Source article";
      }
    }

    if (!imageUrl && campaign.imageProviders && campaign.imageProviders.length > 0) {
      const keywords = getImageKeywordsFromCampaign(campaign, post.sourceTitle);
      
      let imageAttempts = 0;
      while (!imageUrl && imageAttempts < MAX_RETRIES) {
        imageAttempts++;
        const imageResult = await searchImage(keywords, campaign.imageProviders, campaign.id);
        
        if (imageResult) {
          imageUrl = imageResult.url;
          imageCredit = imageResult.credit;
        } else if (imageAttempts < MAX_RETRIES) {
          await storage.createLog({
            campaignId: campaign.id,
            postId: post.id,
            level: "warning",
            message: `Image search failed, retrying (attempt ${imageAttempts}/${MAX_RETRIES})`,
          });
        }
      }
    }

    await storage.updatePost(post.id, {
      generatedCaption: caption,
      imageUrl: imageUrl || null,
      imageCredit: imageCredit || null,
      status: "draft",
      aiModel: "deepseek/deepseek-v3.2",
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await storage.updatePost(post.id, {
      status: "failed",
      failureReason: errorMessage,
      retryCount: (post.retryCount || 0) + 1,
    });

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      level: "error",
      message: `Content generation failed: ${errorMessage}`,
    });

    throw error;
  }
}

export async function publishPost(post: Post, campaign: Campaign): Promise<void> {
  if (!post.generatedCaption) {
    throw new Error("Post has no caption to publish");
  }

  // Get user settings for API key
  const settings = await storage.getUserSettings(campaign.userId?.toString() || "");
  const postlyApiKey = settings?.postlyApiKey;
  const postlyWorkspaceId = settings?.postlyWorkspaceId;

  let attempts = 0;
  let lastError: string | undefined;

  while (attempts < MAX_RETRIES) {
    attempts++;

    const result = await publishToPostly(post, campaign, postlyApiKey, postlyWorkspaceId);

    if (result.success) {
      await storage.updatePost(post.id, {
        status: "posted",
        postedAt: new Date(),
      });

      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        level: "info",
        message: `Post published successfully on attempt ${attempts}`,
      });

      return;
    }

    lastError = result.error;

    if (attempts < MAX_RETRIES) {
      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        level: "warning",
        message: `Publish failed, retrying (attempt ${attempts}/${MAX_RETRIES}): ${lastError}`,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000 * attempts));
    }
  }

  await storage.updatePost(post.id, {
    status: "failed",
    failureReason: lastError || "Max retries exceeded",
    retryCount: attempts,
  });

  await storage.createLog({
    campaignId: campaign.id,
    postId: post.id,
    level: "error",
    message: `Post failed after ${MAX_RETRIES} attempts: ${lastError}`,
  });

  throw new Error(`Publishing failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

export async function processDraftPosts(campaignId: number): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  const campaign = await storage.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const drafts = await storage.getPostsByCampaign(campaignId);
  const unprocessedDrafts = drafts.filter(
    (p) => p.status === "draft" && !p.generatedCaption
  );

  const result = { processed: 0, success: 0, failed: 0 };

  for (const post of unprocessedDrafts) {
    result.processed++;
    try {
      await processNewPost(post, campaign);
      result.success++;
    } catch (error) {
      result.failed++;
    }
  }

  return result;
}

export async function publishScheduledPosts(): Promise<{
  published: number;
  failed: number;
}> {
  const now = new Date();
  const allCampaigns = await storage.getActiveCampaigns();
  
  const result = { published: 0, failed: 0 };

  for (const campaign of allCampaigns) {
    const posts = await storage.getPostsByCampaign(campaign.id);
    const scheduledPosts = posts.filter(
      (p) =>
        p.status === "scheduled" &&
        p.scheduledFor &&
        new Date(p.scheduledFor) <= now
    );

    for (const post of scheduledPosts) {
      try {
        await publishPost(post, campaign);
        result.published++;
      } catch (error) {
        result.failed++;
      }
    }
  }

  return result;
}

export async function processNextPosts(
  maxPosts: number = 2,
  windowMinutes: number = 30
): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);
  const allCampaigns = await storage.getActiveCampaigns();
  
  let prepared = 0;

  for (const campaign of allCampaigns) {
    if (prepared >= maxPosts) break;

    const posts = await storage.getPostsByCampaign(campaign.id);
    
    const postsNeedingPrep = posts.filter((p) => {
      if (p.status !== "approved" && p.status !== "scheduled") return false;
      if (p.generatedCaption) return false;
      
      if (p.status === "scheduled" && p.scheduledFor) {
        const scheduledTime = new Date(p.scheduledFor);
        return scheduledTime <= windowEnd;
      }
      
      return true;
    });

    const toProcess = postsNeedingPrep.slice(0, maxPosts - prepared);

    for (const post of toProcess) {
      try {
        await processNewPost(post, campaign);
        prepared++;
      } catch (error) {
        console.error(`Failed to prepare post ${post.id}:`, error);
      }
    }
  }

  return prepared;
}
