import { storage } from "../storage";
import { generateCaption, validateContent, getSafetyConfigFromCampaign } from "./ai";
import { searchImage, extractOgImage, getImageKeywordsFromCampaign } from "./images";
import { generateAiImage } from "./ai-image";
import { publishToPostly } from "./postly";
import { CronExpressionParser } from "cron-parser";
import type { Post, Campaign } from "@shared/schema";
import { appendPostToSheet } from "./google-sheets";

const MAX_RETRIES = 3;

function getNextScheduledTime(campaign: Campaign): Date | null {
  if (!campaign.scheduleCron) return null;

  try {
    const timezone = campaign.scheduleTimezone || "America/Los_Angeles";
    const expression = CronExpressionParser.parse(campaign.scheduleCron, { tz: timezone });
    const next = expression.next();
    return next.toDate();
  } catch (error) {
    console.error(`[Pipeline] Failed to parse cron expression: ${campaign.scheduleCron}`, error);
    return null;
  }
}

export async function processNewPost(post: Post, campaign: Campaign, overridePrompt?: string, targetScheduledTime?: Date): Promise<void> {
  try {
    const safetyConfig = getSafetyConfigFromCampaign(campaign);
    let caption: string | null = null;
    let imageSearchPhrase: string = "";
    let imagePrompt: string = "";
    let safetyResult: { isValid: boolean; issues: string[] } = { isValid: false, issues: [] };
    
    const settings = campaign.userId ? await storage.getUserSettings(campaign.userId) : undefined;
    const modelName = settings?.aiModel || process.env.AI_MODEL || "deepseek/deepseek-v3.2";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await generateCaption(post, campaign, overridePrompt);
      caption = result.caption;
      imageSearchPhrase = result.imageSearchPhrase;
      imagePrompt = result.imagePrompt;
      safetyResult = validateContent(caption, safetyConfig);
      
      if (safetyResult.isValid) {
        break;
      }
      
      if (attempt < MAX_RETRIES) {
        await storage.createLog({
          campaignId: campaign.id,
          postId: post.id,
          userId: campaign.userId,
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
    let aiImageAttempted = false;

    // Check if campaign uses AI image generation
    if (campaign.useAiImage && caption && settings?.novitaApiKey) {
      aiImageAttempted = true;
      // Use AI-generated image prompt from caption generation
      try {
        // Use the imagePrompt from AI caption generation, fallback to a simple prompt if not provided
        const finalImagePrompt = imagePrompt || `Healthy, happy, bright wellness lifestyle image related to ${campaign.topic || 'wellness'}`;
        const aiImageResult = await generateAiImage(
          finalImagePrompt,
          settings.aiImageModel || "flux-1-schnell",
          settings.novitaApiKey,
          campaign.id,
        );
        
        if (aiImageResult) {
          imageUrl = aiImageResult.url;
          imageCredit = aiImageResult.credit;
          
          await storage.createLog({
            campaignId: campaign.id,
            postId: post.id,
            userId: campaign.userId,
            level: "info",
            message: "AI image generated successfully",
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await storage.createLog({
          campaignId: campaign.id,
          postId: post.id,
          userId: campaign.userId,
          level: "warning",
          message: `AI image generation failed, falling back to stock images: ${errorMessage}`,
        });
        // Fall through to stock image search
      }
    } else if (campaign.useAiImage && !settings?.novitaApiKey) {
      // AI image enabled but no API key configured - log and fall back to stock
      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        userId: campaign.userId,
        level: "warning",
        message: "AI image generation enabled but Novita API key not configured, falling back to stock images",
      });
    }

    // If no AI image, try extracting OG image from source
    if (!imageUrl) {
      const ogImage = await extractOgImage(post.sourceUrl);
      if (ogImage) {
        const duplicateOg = await storage.getPostByImageUrlInCampaign(campaign.id, ogImage);
        if (!duplicateOg || duplicateOg.id === post.id) {
          imageUrl = ogImage;
          imageCredit = "Source article";
        }
      }
    }

    // If still no image, search stock photos (always fall back regardless of AI image setting)
    if (!imageUrl) {
      // Use campaign image providers, or fall back to default providers
      const providers = campaign.imageProviders && campaign.imageProviders.length > 0
        ? campaign.imageProviders
        : [{ type: "pexels", value: "" }, { type: "unsplash", value: "" }];
      
      // Use AI-generated image search phrase if available, otherwise fall back to campaign keywords + title
      const keywords = imageSearchPhrase 
        ? [imageSearchPhrase, ...(campaign.imageKeywords || [])]
        : getImageKeywordsFromCampaign(campaign, post.sourceTitle);
      
      let imageAttempts = 0;
      while (!imageUrl && imageAttempts < MAX_RETRIES) {
        imageAttempts++;
        const imageResult = await searchImage(keywords, providers, campaign.id, imageAttempts - 1, settings);
        
        if (imageResult) {
          const duplicateImage = await storage.getPostByImageUrlInCampaign(campaign.id, imageResult.url);
          if (!duplicateImage || duplicateImage.id === post.id) {
            imageUrl = imageResult.url;
            imageCredit = imageResult.credit;
          }
        } else if (imageAttempts < MAX_RETRIES) {
          await storage.createLog({
            campaignId: campaign.id,
            postId: post.id,
            userId: campaign.userId,
            level: "warning",
            message: `Image search failed, retrying (attempt ${imageAttempts}/${MAX_RETRIES})`,
          });
        }
      }
    }

    // Only auto-schedule if:
    // 1. Campaign is active
    // 2. Auto-publish is enabled
    // 3. A target scheduled time was explicitly passed (meaning this is from the scheduler, not manual)
    // Manual generation from review page should NOT auto-schedule - leave as draft
    let newStatus: "draft" | "scheduled" = "draft";
    let scheduledFor: Date | null = null;

    if (campaign.isActive && campaign.autoPublish && targetScheduledTime) {
      // Only use explicitly passed target time from scheduler
      scheduledFor = targetScheduledTime;
      newStatus = "scheduled";
    }

    await storage.updatePost(post.id, {
      generatedCaption: caption,
      imageUrl: imageUrl || null,
      imageCredit: imageCredit || null,
      imageSearchPhrase: imageSearchPhrase || null,
      status: newStatus,
      scheduledFor,
      aiModel: modelName,
    }, campaign.userId);

    if (scheduledFor) {
      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        userId: campaign.userId,
        level: "info",
        message: `Post auto-approved and scheduled for ${scheduledFor.toISOString()}`,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await storage.updatePost(post.id, {
      status: "failed",
      failureReason: errorMessage,
      retryCount: (post.retryCount || 0) + 1,
    }, campaign.userId);

    await storage.createLog({
      campaignId: campaign.id,
      postId: post.id,
      userId: campaign.userId,
      level: "error",
      message: `Content generation failed: ${errorMessage}`,
    });

    throw error;
  }
}

export async function publishPost(post: Post, campaign: Campaign, captionOverride?: string | null): Promise<void> {
  if (!post.generatedCaption && !captionOverride) {
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

    const result = await publishToPostly(post, campaign, postlyApiKey, postlyWorkspaceId, captionOverride);

    if (result.success) {
      await storage.updatePost(post.id, {
        status: "posted",
        postedAt: new Date(),
      }, campaign.userId);

      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        userId: campaign.userId,
        level: "info",
        message: `Post published successfully on attempt ${attempts}`,
      });

      try {
        await appendPostToSheet(post, campaign, captionOverride);
        await storage.createLog({
          campaignId: campaign.id,
          postId: post.id,
          userId: campaign.userId,
          level: "info",
          message: "Google Sheets log entry created",
        });
      } catch (sheetError) {
        const sheetMessage = sheetError instanceof Error ? sheetError.message : String(sheetError);
        await storage.createLog({
          campaignId: campaign.id,
          postId: post.id,
          userId: campaign.userId,
          level: "warning",
          message: `Google Sheets logging failed: ${sheetMessage}`,
        });
      }

      return;
    }

    lastError = result.error;

    if (attempts < MAX_RETRIES) {
      await storage.createLog({
        campaignId: campaign.id,
        postId: post.id,
        userId: campaign.userId,
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
  }, campaign.userId);

  await storage.createLog({
    campaignId: campaign.id,
    postId: post.id,
    userId: campaign.userId,
    level: "error",
    message: `Post failed after ${MAX_RETRIES} attempts: ${lastError}`,
  });

  throw new Error(`Publishing failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

export async function processDraftPosts(campaignId: number, userId?: string): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  const campaign = await storage.getCampaign(campaignId, userId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const drafts = await storage.getPostsByCampaign(campaignId, 50, campaign.userId);
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
  
  // Track post IDs that have already been published in this cycle to prevent duplicates
  const publishedPostIds = new Set<number>();

  for (const campaign of allCampaigns) {
    const posts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId);
    const scheduledPosts = posts.filter(
      (p) =>
        p.status === "scheduled" &&
        p.scheduledFor &&
        new Date(p.scheduledFor) <= now
    );

    for (const post of scheduledPosts) {
      // Skip if this post was already published in this cycle
      if (publishedPostIds.has(post.id)) {
        console.log(`[Scheduler] Skipping post ${post.id} - already published this cycle`);
        continue;
      }
      
      // Double-check the post hasn't been published already (race condition protection)
      const currentPost = await storage.getPost(post.id);
      if (currentPost?.status !== "scheduled") {
        console.log(`[Scheduler] Skipping post ${post.id} - status changed to ${currentPost?.status}`);
        continue;
      }
      
      try {
        await publishPost(post, campaign);
        result.published++;
        
        // Mark this post as published to prevent duplicate publishing
        publishedPostIds.add(post.id);
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
    
    // Skip auto-publish campaigns - they're handled by checkAndScheduleNextPost
    if (campaign.autoPublish) continue;

    const posts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId);
    
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
