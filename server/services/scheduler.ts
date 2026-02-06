import { storage } from "../storage";
import { processCampaignFeeds, processAllActiveCampaigns } from "./rss";
import {
  processDraftPosts,
  publishScheduledPosts,
  processNextPosts,
  processNewPost,
} from "./pipeline";
import type { Campaign } from "../../shared/schema";
import { CronExpressionParser } from "cron-parser";
import { formatInTimeZone, DEFAULT_TIMEZONE, resolveTimeZone } from "./time";

let mainLoopId: NodeJS.Timeout | null = null;
let lastCleanupDate: string | null = null;
let schedulerStartTime: Date | null = null;
let lastSchedulerCycleTime: Date | null = null;

const MAIN_LOOP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STARTUP_DELAY = 60 * 1000; // Wait 60 seconds after startup before first cycle
const MINIMUM_CYCLE_GAP = 4 * 60 * 1000; // Minimum 4 minutes between cycles (prevents rapid fire on restart)
const PREPARATION_WINDOW_MINUTES = 120; // Prepare posts 2 hours before scheduled time
const MAX_POSTS_TO_PREPARE = 2;
const OLD_POST_DAYS = 30; // Delete published posts older than 30 days
const RSS_FETCH_INTERVAL_MINUTES = 180; // Fetch RSS at least every 3 hours
const formatLogTime = (date: Date) => formatInTimeZone(date, DEFAULT_TIMEZONE);

export function startScheduler(): void {
  schedulerStartTime = new Date();
  const isProduction = process.env.REPLIT_DEPLOYMENT === "production";
  const mode = isProduction ? "PRODUCTION" : "DEVELOPMENT";
  
  console.log(`[Scheduler] Starting smart scheduler in ${mode} mode...`);

  mainLoopId = setInterval(async () => {
    try {
      await runSchedulerCycle();
    } catch (error) {
      console.error("[Scheduler] Cycle error:", error);
    }
  }, MAIN_LOOP_INTERVAL);

  // Delay first cycle to prevent immediate action on cold start/restart
  console.log(`[Scheduler] Waiting ${STARTUP_DELAY / 1000} seconds before first cycle (cold start protection)...`);
  setTimeout(() => runSchedulerCycle(), STARTUP_DELAY);

  console.log("[Scheduler] Smart scheduler started");
  console.log(`  - Mode: ${mode}`);
  console.log(`  - Check interval: every ${MAIN_LOOP_INTERVAL / 60000} minutes`);
  console.log(`  - Startup delay: ${STARTUP_DELAY / 1000} seconds`);
  console.log(`  - Preparation window: ${PREPARATION_WINDOW_MINUTES} minutes before scheduled time`);
  console.log(`  - Max posts to prepare per cycle: ${MAX_POSTS_TO_PREPARE}`);
}

function getNextScheduledTime(campaign: Campaign): Date | null {
  if (!campaign.scheduleCron) return null;

  try {
    const timezone = resolveTimeZone(campaign.scheduleTimezone);
    const expression = CronExpressionParser.parse(campaign.scheduleCron, { tz: timezone });
    const next = expression.next();
    const nextDate = next.toDate();
    
    // LOG: Always log the next scheduled time for debugging
    console.log(
      `[Scheduler] Campaign ${campaign.id} ("${campaign.name}") next scheduled for: ${formatInTimeZone(nextDate, timezone)} (TZ: ${timezone})`,
    );
    
    return nextDate;
  } catch (error) {
    console.error(`[Scheduler] Failed to parse cron expression: ${campaign.scheduleCron}`, error);
    return null;
  }
}

async function runSchedulerCycle(): Promise<void> {
  const now = new Date();
  
  // Prevent running too soon after last cycle (handles rapid restarts)
  if (lastSchedulerCycleTime) {
    const timeSinceLastCycle = now.getTime() - lastSchedulerCycleTime.getTime();
    if (timeSinceLastCycle < MINIMUM_CYCLE_GAP) {
      console.log(`[Scheduler] Skipping cycle - only ${Math.round(timeSinceLastCycle / 1000)}s since last cycle (minimum: ${MINIMUM_CYCLE_GAP / 1000}s)`);
      return;
    }
  }
  
  lastSchedulerCycleTime = now;
  console.log(`[Scheduler] Running cycle at ${formatLogTime(now)}`);
  
  // Use a transaction or explicit locking if possible, but at least handle user isolation correctly
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
          await processCampaignFeeds(campaign.id, campaign.userId ?? undefined);
          await storage.updateCampaign(
            campaign.id,
            { lastRssFetchAt: new Date() },
            campaign.userId ?? undefined,
          );
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
    // Also clean up unused drafts (drafts older than 7 days that aren't used)
    await storage.deleteOldDrafts(7);
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
  // If we are very close to the time (e.g. within 30 mins) or slightly past it (within 30 mins)
  // we should still try to schedule if nothing is there.
  if (timeUntilNext > PREPARATION_WINDOW_MINUTES || timeUntilNext < -60) {
    return false;
  }

  // Check if there's already a post scheduled OR recently published for this time slot
  const allPosts = await storage.getPostsByCampaign(campaign.id, 100, campaign.userId ?? undefined);
  
  // Check for scheduled posts
  const hasScheduledPost = allPosts.some((post) => {
    if (post.status !== "scheduled" || !post.scheduledFor) return false;
    const postTime = new Date(post.scheduledFor);
    const timeDiff = Math.abs(postTime.getTime() - nextScheduledTime.getTime()) / (1000 * 60);
    return timeDiff < 30;
  });

  if (hasScheduledPost) {
    return false; // Already have a post scheduled for this slot
  }
  
  // Check for recently published posts (prevents double-posting on wake)
  const hasRecentlyPublished = allPosts.some((post) => {
    if (post.status !== "posted" || !post.postedAt) return false;
    const postedTime = new Date(post.postedAt);
    // If a post was published within 30 minutes of the target slot, skip
    const timeDiff = Math.abs(postedTime.getTime() - nextScheduledTime.getTime()) / (1000 * 60);
    return timeDiff < 30;
  });

  if (hasRecentlyPublished) {
    console.log(
      `[Scheduler] Post already published for slot near ${formatInTimeZone(nextScheduledTime, campaign.scheduleTimezone)}, skipping`,
    );
    return false; // Already published a post for this slot
  }

  // No post scheduled for this time slot - find a draft to schedule
  console.log(
    `[Scheduler] No post scheduled for ${formatInTimeZone(nextScheduledTime, campaign.scheduleTimezone)}, looking for drafts...`,
  );
  
  try {
    // Step 1: Check for existing drafts WITH captions first (manually prepared)
    const currentPosts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId ?? undefined);
    const draftsWithCaption = currentPosts
      .filter((post) => post.status === "draft" && post.generatedCaption)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    if (draftsWithCaption.length > 0) {
      // Use existing draft with caption - schedule it for this time slot
      const newestDraft = draftsWithCaption[0];
      await storage.updatePost(newestDraft.id, {
        status: "scheduled",
        scheduledFor: nextScheduledTime,
      }, campaign.userId ?? undefined);
      const formattedSchedule = formatInTimeZone(
        nextScheduledTime,
        campaign.scheduleTimezone,
      );
      await storage.createLog({
        campaignId: campaign.id,
        postId: newestDraft.id,
        userId: campaign.userId,
        level: "info",
        message: `Draft scheduled for ${formattedSchedule}`,
      });
      console.log(
        `[Scheduler] Scheduled existing draft ${newestDraft.id} for ${formattedSchedule}`,
      );
      return true;
    }
    
    // Step 2: No drafts with captions - check for unprocessed drafts
    const unprocessedDrafts = currentPosts
      .filter((post) => post.status === "draft" && !post.generatedCaption)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    if (unprocessedDrafts.length > 0) {
      const newestUnprocessed = unprocessedDrafts[0];
      console.log(
        `[Scheduler] Processing draft ${newestUnprocessed.id} for ${formatInTimeZone(nextScheduledTime, campaign.scheduleTimezone)}...`,
      );
      await processNewPost(newestUnprocessed, campaign, undefined, nextScheduledTime);
      console.log(`[Scheduler] Processed and scheduled draft ${newestUnprocessed.id}`);
      return true;
    }
    
    // Step 3: No drafts at all - fetch RSS to get new articles
    console.log(`[Scheduler] No drafts found, fetching RSS for campaign ${campaign.id}...`);
    try {
      const rssResult = await processCampaignFeeds(campaign.id, campaign.userId ?? undefined, nextScheduledTime);
      
      if (rssResult.new > 0 && rssResult.articles && rssResult.articles.length > 0) {
        console.log(`[Scheduler] Found ${rssResult.new} new articles from RSS`);
        
        const newestArticle = rssResult.articles[0];
        
        // Create the post directly with scheduled status instead of draft
        const postData = {
          campaignId: campaign.id,
          userId: campaign.userId,
          sourceTitle: newestArticle.title,
          sourceUrl: newestArticle.link,
          sourceGuid: newestArticle.guid,
          sourceSnippet: newestArticle.snippet,
          pubDate: newestArticle.pubDate,
          imageUrl: newestArticle.imageUrl,
          status: "scheduled",
          scheduledFor: nextScheduledTime,
        };

        const post = await storage.createPost(postData as any);
        
        console.log(
          `[Scheduler] Processing new article ${post.id} for ${formatInTimeZone(nextScheduledTime, campaign.scheduleTimezone)}...`,
        );
        
        await processNewPost(post, campaign, undefined, nextScheduledTime);
        console.log(`[Scheduler] Processed and scheduled new post ${post.id}`);
        return true;
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

async function shouldRunRSSFetch(campaign: Campaign): Promise<boolean> {
  const now = new Date();
  const lastFetch = campaign.lastRssFetchAt
    ? new Date(campaign.lastRssFetchAt)
    : null;

  const minutesSinceLastFetch = lastFetch
    ? (now.getTime() - lastFetch.getTime()) / (1000 * 60)
    : Infinity;

  if (minutesSinceLastFetch >= RSS_FETCH_INTERVAL_MINUTES) {
    return true;
  }

  // If no drafts are available, allow an early fetch even if interval hasn't elapsed
  const posts = await storage.getPostsByCampaign(campaign.id, 50, campaign.userId ?? undefined);
  const hasAvailableDraft = posts.some((post) => post.status === "draft");
  if (!hasAvailableDraft) {
    return true;
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
        const allCampaigns = await storage.getActiveCampaigns(userId || undefined);
        const results: Array<{ campaignId: number; result: { processed: number; success: number; failed: number } }> = [];
        for (const campaign of allCampaigns) {
          const result = await processDraftPosts(campaign.id, campaign.userId ?? undefined);
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
