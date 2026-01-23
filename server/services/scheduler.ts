import { storage } from "../storage";
import { processCampaignFeeds, processAllActiveCampaigns } from "./rss";
import { processDraftPosts, publishScheduledPosts } from "./pipeline";

let rssIntervalId: NodeJS.Timeout | null = null;
let publishIntervalId: NodeJS.Timeout | null = null;
let processingIntervalId: NodeJS.Timeout | null = null;

const RSS_FETCH_INTERVAL = 15 * 60 * 1000;
const PUBLISH_CHECK_INTERVAL = 60 * 1000;
const PROCESSING_INTERVAL = 5 * 60 * 1000;

export function startScheduler(): void {
  console.log("[Scheduler] Starting background jobs...");

  rssIntervalId = setInterval(async () => {
    try {
      console.log("[Scheduler] Running RSS fetch for all active campaigns...");
      await processAllActiveCampaigns();
    } catch (error) {
      console.error("[Scheduler] RSS fetch error:", error);
    }
  }, RSS_FETCH_INTERVAL);

  processingIntervalId = setInterval(async () => {
    try {
      console.log("[Scheduler] Processing draft posts...");
      const campaigns = await storage.getActiveCampaigns();
      
      for (const campaign of campaigns) {
        try {
          await processDraftPosts(campaign.id);
        } catch (error) {
          console.error(`[Scheduler] Processing error for campaign ${campaign.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Processing error:", error);
    }
  }, PROCESSING_INTERVAL);

  publishIntervalId = setInterval(async () => {
    try {
      const result = await publishScheduledPosts();
      if (result.published > 0 || result.failed > 0) {
        console.log(`[Scheduler] Published: ${result.published}, Failed: ${result.failed}`);
      }
    } catch (error) {
      console.error("[Scheduler] Publish check error:", error);
    }
  }, PUBLISH_CHECK_INTERVAL);

  console.log("[Scheduler] Background jobs started successfully");
  console.log(`  - RSS fetch: every ${RSS_FETCH_INTERVAL / 60000} minutes`);
  console.log(`  - Draft processing: every ${PROCESSING_INTERVAL / 60000} minutes`);
  console.log(`  - Publish check: every ${PUBLISH_CHECK_INTERVAL / 1000} seconds`);
}

export function stopScheduler(): void {
  if (rssIntervalId) {
    clearInterval(rssIntervalId);
    rssIntervalId = null;
  }
  if (publishIntervalId) {
    clearInterval(publishIntervalId);
    publishIntervalId = null;
  }
  if (processingIntervalId) {
    clearInterval(processingIntervalId);
    processingIntervalId = null;
  }
  console.log("[Scheduler] Background jobs stopped");
}

export async function runNow(action: "fetch" | "process" | "publish", campaignId?: number): Promise<any> {
  switch (action) {
    case "fetch":
      if (campaignId) {
        return await processCampaignFeeds(campaignId);
      } else {
        await processAllActiveCampaigns();
        return { message: "Fetched all active campaigns" };
      }
    
    case "process":
      if (campaignId) {
        return await processDraftPosts(campaignId);
      } else {
        const campaigns = await storage.getActiveCampaigns();
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
