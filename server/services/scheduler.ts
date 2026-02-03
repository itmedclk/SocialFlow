import { storage } from "../storage";
import { processCampaignFeeds, processAllActiveCampaigns } from "./rss";
import {
  processDraftPosts,
  publishScheduledPosts,
  processNextPosts,
  processNewPost,
} from "./pipeline";
import {
  campaigns,
  posts,
  logs,
  userSettings,
  type Campaign,
  type InsertCampaign,
  type Post,
  type InsertPost,
  type Log,
  type InsertLog,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { CronExpressionParser } from "cron-parser";

let mainLoopId: NodeJS.Timeout | null = null;
let lastCleanupDate: string | null = null;

const MAIN_LOOP_INTERVAL = 5 * 60 * 1000;
const PREPARATION_WINDOW_MINUTES = 120; // Prepare posts 2 hours before scheduled time
const MAX_POSTS_TO_PREPARE = 2;
const OLD_POST_DAYS = 30; // Delete published posts older than 30 days

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
    const nextDate = next.toDate();
    
    // LOG: Always log the next scheduled time for debugging
    console.log(`[Scheduler] Campaign ${campaign.id} ("${campaign.name}") next scheduled for: ${nextDate.toISOString()} (TZ: ${timezone})`);
    
    return nextDate;
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

  // Run daily cleanup of old published posts
  try {
    await runDailyCleanup();
  } catch (error) {
    console.error("[Scheduler] Cleanup error:", error);
  }
}

async function runDailyCleanup(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  
  // Only run once per day
  if (lastCleanupDate === today) {
    return;
  }
  
  console.log("[Scheduler] Running daily cleanup of old published posts...");
  const deleted = await storage.deleteOldPublishedPosts(OLD_POST_DAYS);
  
  if (deleted > 0) {
    console.log(`[Scheduler] Deleted ${deleted} posts published more than ${OLD_POST_DAYS} days ago`);
  }
  
  lastCleanupDate = today;
}

// Check if the next scheduled slot has a post, if not, fetch RSS and process one
async function checkAndScheduleNextPost(campaign: Campaign): Promise<boolean> {
  const nextScheduledTime = getNextScheduledTime(campaign);
  if (!nextScheduledTime) return false;

  const now = new Date();
  const timeUntilNext = (nextScheduledTime.getTime() - now.getTime()) / (1000 * 60); // in minutes

  // Only prepare posts within the 2-hour window
  // If we are very close to the time (e.g. within 5 mins) or slightly past it (within 5 mins)
  // we should still try to schedule if nothing is there.
  if (timeUntilNext > PREPARATION_WINDOW_MINUTES || timeUntilNext < -30) {
    return false;
  }

  // Check if there's already a post scheduled for this time slot
  const posts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId);
  const hasScheduledPost = posts.some((post) => {
    if (post.status !== "scheduled" || !post.scheduledFor) return false;
    const postTime = new Date(post.scheduledFor);
    // Check if a post is scheduled within 5 minutes of the next slot
    const timeDiff = Math.abs(postTime.getTime() - nextScheduledTime.getTime()) / (1000 * 60);
    return timeDiff < 10; // Increased tolerance to 10 minutes
  });

  if (hasScheduledPost) {
    // console.log(`[Scheduler] Post already scheduled for ${nextScheduledTime.toISOString()}`);
    return false; // Already have a post scheduled for this slot
  }

  // No post scheduled for this time slot - find a draft to schedule
  console.log(`[Scheduler] No post scheduled for ${nextScheduledTime.toISOString()}, looking for drafts...`);
  
  try {
    // Step 1: Check for existing drafts WITH captions first (manually prepared)
    const currentPosts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId);
    const draftsWithCaption = currentPosts
      .filter((post) => post.status === "draft" && post.generatedCaption)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (draftsWithCaption.length > 0) {
      // Use existing draft with caption - schedule it for this time slot
      const oldestDraft = draftsWithCaption[0];
      await storage.updatePost(oldestDraft.id, {
        status: "scheduled",
        scheduledFor: nextScheduledTime,
      }, campaign.userId);
      await storage.createLog({
        campaignId: campaign.id,
        postId: oldestDraft.id,
        userId: campaign.userId,
        level: "info",
        message: `Draft scheduled for ${nextScheduledTime.toISOString()}`,
      });
      console.log(`[Scheduler] Scheduled existing draft ${oldestDraft.id} for ${nextScheduledTime.toISOString()}`);
      return true;
    }
    
    // Step 2: No drafts with captions - check for unprocessed drafts
    const unprocessedDrafts = currentPosts
      .filter((post) => post.status === "draft" && !post.generatedCaption)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (unprocessedDrafts.length > 0) {
      const oldestUnprocessed = unprocessedDrafts[0];
      console.log(`[Scheduler] Processing draft ${oldestUnprocessed.id} for ${nextScheduledTime.toISOString()}...`);
      await processNewPost(oldestUnprocessed, campaign, undefined, nextScheduledTime);
      console.log(`[Scheduler] Processed and scheduled draft ${oldestUnprocessed.id}`);
      return true;
    }
    
    // Step 3: No drafts at all - fetch RSS to get new articles
    console.log(`[Scheduler] No drafts found, fetching RSS for campaign ${campaign.id}...`);
    try {
      const rssResult = await processCampaignFeeds(campaign.id, campaign.userId, nextScheduledTime);
      if (rssResult.new > 0) {
        console.log(`[Scheduler] Found ${rssResult.new} new articles from RSS`);
        
        // Refresh posts list to get newly created drafts
        const refreshedPosts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId);
        const newDrafts = refreshedPosts
          .filter((post) => post.status === "draft" && !post.generatedCaption)
          .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
        
        if (newDrafts.length > 0) {
          const newestDraft = newDrafts[0];
          console.log(`[Scheduler] Processing new draft ${newestDraft.id} for ${nextScheduledTime.toISOString()}...`);
          await processNewPost(newestDraft, campaign, undefined, nextScheduledTime);
          console.log(`[Scheduler] Processed and scheduled new draft ${newestDraft.id}`);
          return true;
        }
      }
    } catch (error) {
      console.error(`[Scheduler] RSS fetch error for campaign ${campaign.id}:`, error);
    }
    
    console.log(`[Scheduler] No content available for scheduling`);
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
        return await processDraftPosts(campaignId, userId || undefined);
      } else {
        const campaigns = await storage.getActiveCampaigns(userId || undefined);
        const results = [];
        for (const campaign of campaigns) {
          const result = await processDraftPosts(campaign.id, campaign.userId);
          results.push({
            campaignId: campaign.id,
            result,
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
