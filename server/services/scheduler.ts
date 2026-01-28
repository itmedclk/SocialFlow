import { storage } from "../storage";
import { processCampaignFeeds, processAllActiveCampaigns } from "./rss";
import {
  processDraftPosts,
  publishScheduledPosts,
  processNextPosts,
  processNewPost,
} from "./pipeline";
import type { Campaign} from "@shared/schema"
import { CronExpressionParser } from "cron-parser";

let mainLoopId: NodeJS.Timeout | null = null;

const MAIN_LOOP_INTERVAL = 5 * 60 * 1000;
const PREPARATION_WINDOW_MINUTES = 120; // Prepare posts 2 hours before scheduled time
const MAX_POSTS_TO_PREPARE = 2;

export function startScheduler(): void {
  console.log("[Scheduler] Starting smart scheduler...");

  mainLoopId = setInterval(async () => {
    try {
      await runSchedulerCycle();
    } catch (error) {
      console.error("[Scheduler] Cycle error:", error);
    }
  }, MAIN_LOOP_INTERVAL);

  setTimeout(() => runSchedulerCycle(), 10000);

  console.log("[Scheduler] Smart scheduler started");
  console.log(
    `  - Check interval: every ${MAIN_LOOP_INTERVAL / 60000} minutes`,
  );
  console.log(
    `  - Preparation window: ${PREPARATION_WINDOW_MINUTES} minutes before scheduled time`,
  );
  console.log(`  - Max posts to prepare per cycle: ${MAX_POSTS_TO_PREPARE}`);
}

function getNextScheduledTime(campaign: Campaign): Date | null {
  if (!campaign.scheduleCron) return null;

  try {
    const timezone = campaign.scheduleTimezone || "America/Los_Angeles";
    const expression = CronExpressionParser.parse(campaign.scheduleCron, { tz: timezone });
    const next = expression.next();
    return next.toDate();
  } catch (error) {
    console.error(`[Scheduler] Failed to parse cron expression: ${campaign.scheduleCron}`, error);
    return null;
  }
}

async function runSchedulerCycle(): Promise<void> {
  const now = new Date();
  const campaigns = await storage.getActiveCampaigns();

  for (const campaign of campaigns) {
    // For auto-publish campaigns, check if we need to schedule a post
    if (campaign.autoPublish) {
      const needsScheduling = await checkAndScheduleNextPost(campaign);
      if (needsScheduling) {
        console.log(`[Scheduler] Processing auto-publish for campaign ${campaign.id}...`);
      }
    } else {
      // For manual campaigns, use the old RSS fetch logic
      const shouldFetchRSS = await shouldRunRSSFetch(campaign);
      if (shouldFetchRSS) {
        console.log(`[Scheduler] Fetching RSS for campaign ${campaign.id}...`);
        try {
          await processCampaignFeeds(campaign.id, campaign.userId);
        } catch (error) {
          console.error(
            `[Scheduler] RSS fetch error for campaign ${campaign.id}:`,
            error,
          );
        }
      }
    }
  }

  try {
    const prepared = await processNextPosts(
      MAX_POSTS_TO_PREPARE,
      PREPARATION_WINDOW_MINUTES,
    );
    if (prepared > 0) {
      console.log(
        `[Scheduler] Prepared ${prepared} posts for upcoming publication`,
      );
    }
  } catch (error) {
    console.error("[Scheduler] Preparation error:", error);
  }

  try {
    const result = await publishScheduledPosts();
    if (result.published > 0 || result.failed > 0) {
      console.log(
        `[Scheduler] Published: ${result.published}, Failed: ${result.failed}`,
      );
    }
  } catch (error) {
    console.error("[Scheduler] Publish error:", error);
  }
}

// Check if the next scheduled slot has a post, if not, fetch RSS and process one
async function checkAndScheduleNextPost(campaign: Campaign): Promise<boolean> {
  const nextScheduledTime = getNextScheduledTime(campaign);
  if (!nextScheduledTime) return false;

  const now = new Date();
  const timeUntilNext = (nextScheduledTime.getTime() - now.getTime()) / (1000 * 60); // in minutes

  // Only prepare posts within the 2-hour window
  if (timeUntilNext > PREPARATION_WINDOW_MINUTES || timeUntilNext < 0) {
    return false;
  }

  // Check if there's already a post scheduled for this time slot
  const posts = await storage.getPostsByCampaign(campaign.id);
  const hasScheduledPost = posts.some((post) => {
    if (post.status !== "scheduled" || !post.scheduledFor) return false;
    const postTime = new Date(post.scheduledFor);
    // Check if a post is scheduled within 5 minutes of the next slot
    const timeDiff = Math.abs(postTime.getTime() - nextScheduledTime.getTime()) / (1000 * 60);
    return timeDiff < 5;
  });

  if (hasScheduledPost) {
    return false; // Already have a post scheduled for this slot
  }

  // No post scheduled - fetch RSS to get new articles (creates drafts only)
  console.log(`[Scheduler] No post scheduled for ${nextScheduledTime.toISOString()}, fetching RSS...`);
  
  // Step 1: Fetch RSS - this only creates drafts, does not schedule
  // Wrapped in separate try/catch so RSS errors don't prevent scheduling existing drafts
  try {
    const result = await processCampaignFeeds(campaign.id, campaign.userId, nextScheduledTime);
    if (result.new > 0) {
      console.log(`[Scheduler] Found ${result.new} new articles (saved as drafts)`);
    }
  } catch (error) {
    console.error(`[Scheduler] RSS fetch error for campaign ${campaign.id}:`, error);
    // Continue to try scheduling existing drafts
  }
  
  try {
    // Step 2: Refresh posts list to include newly created drafts
    const updatedPosts = await storage.getPostsByCampaign(campaign.id);
    
    // Step 3: Find ONE draft to schedule for this time slot
    // Priority: drafts with captions first, then unprocessed drafts
    // Sort by oldest first to ensure FIFO processing
    const draftsWithCaption = updatedPosts
      .filter((post) => post.status === "draft" && post.generatedCaption)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (draftsWithCaption.length > 0) {
      const oldestDraft = draftsWithCaption[0];
      // Schedule this existing draft for the target time
      await storage.updatePost(oldestDraft.id, {
        status: "scheduled",
        scheduledFor: nextScheduledTime,
      });
      await storage.createLog({
        campaignId: campaign.id,
        postId: oldestDraft.id,
        userId: campaign.userId,
        level: "info",
        message: `Draft scheduled for ${nextScheduledTime.toISOString()}`,
      });
      console.log(`[Scheduler] Scheduled draft ${oldestDraft.id} for ${nextScheduledTime.toISOString()}`);
      return true;
    }
    
    // No drafts with captions - process an unprocessed draft (oldest first)
    const unprocessedDrafts = updatedPosts
      .filter((post) => post.status === "draft" && !post.generatedCaption)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (unprocessedDrafts.length > 0) {
      const oldestUnprocessed = unprocessedDrafts[0];
      console.log(`[Scheduler] Processing draft ${oldestUnprocessed.id} for ${nextScheduledTime.toISOString()}...`);
      await processNewPost(oldestUnprocessed, campaign, undefined, nextScheduledTime);
      console.log(`[Scheduler] Processed and scheduled draft ${oldestUnprocessed.id}`);
      return true;
    }
    
    console.log(`[Scheduler] No drafts available for scheduling`);
    return false;
  } catch (error) {
    console.error(`[Scheduler] Auto-publish error for campaign ${campaign.id}:`, error);
    return false;
  }
}

async function shouldRunRSSFetch(campaign : Campaign): Promise<boolean> {
  const nextScheduled = getNextScheduledTime(campaign);
  if (!nextScheduled) return false;

  const now = new Date();
  const diffMinutes = (nextScheduled.getTime() - now.getTime()) / (1000 * 60);

  // Fetch RSS only if within preparation window
  if (diffMinutes <= PREPARATION_WINDOW_MINUTES && diffMinutes >= 0) {
    const logs = await storage.getLogsByCampaign(campaign.id, 10);
    const lastFetchLog = logs.find(
      (log) =>
        log.message.includes("RSS fetch completed") ||
        log.message.includes("New article found"),
    );

    // If no recent fetch OR last fetch was more than 3 hours ago
    if (!lastFetchLog) return true;

    const lastFetchTime = new Date(lastFetchLog.createdAt!);
    const timeSinceLastFetch =
      (now.getTime() - lastFetchTime.getTime()) / (1000 * 60); // in minutes

    return timeSinceLastFetch > 60;
  }

  return false;
}

export async function runNow(
  action: "fetch" | "process" | "publish",
  campaignId?: number,
  userId?: string,
): Promise<any> {
  switch (action) {
    case "fetch":
      if (campaignId) {
        return await processCampaignFeeds(campaignId, userId);
      } else {
        await processAllActiveCampaigns(userId);
        return { message: "Fetched all active campaigns" };
      }

    case "process":
      if (campaignId) {
        return await processDraftPosts(campaignId);
      } else {
        const campaigns = await storage.getActiveCampaigns(userId);
        const results = [];
        for (const campaign of campaigns) {
          results.push({
            campaignId: campaign.id,
            result: await processDraftPosts(campaign.id),
          });
        }
        return results;
      }

    case "publish":
      return await publishScheduledPosts();

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
