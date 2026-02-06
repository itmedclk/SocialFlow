import { storage } from "./storage";
import { processCampaignFeeds } from "./services/rss";
import { processNewPost, publishPost } from "./services/pipeline";
import { format } from "date-fns";

const TEST_USER_ID = "53597623";

async function testFullPipeline(campaignId: number, shouldPublish: boolean = false) {
  console.log(`\n🚀 Starting Full Pipeline Test for Campaign ID: ${campaignId}`);
  console.log(`👤 Using user ID: ${TEST_USER_ID}`);
  
  try {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      console.error(`❌ Campaign ${campaignId} not found.`);
      return;
    }

    const settings = await storage.getUserSettings(TEST_USER_ID);
    if (!settings) {
      console.error(`❌ No settings found for user ${TEST_USER_ID}`);
      return;
    }

    console.log(`📂 Campaign: ${campaign.name}`);
    console.log(`🔗 RSS Feeds: ${campaign.rssUrls?.join(", ")}`);
    console.log(`🔑 API Keys: Pexels=${settings.pexelsApiKey ? "✅" : "❌"}, Unsplash=${settings.unsplashAccessKey ? "✅" : "❌"}, AI=${settings.aiApiKey ? "✅" : "❌"}, Postly=${settings.postlyApiKey ? "✅" : "❌"}`);

    // Override campaign userId for this test
    const testCampaign = { ...campaign, userId: TEST_USER_ID };

    // 1. Fetch RSS Articles
    console.log("\n📡 Step 1: Fetching RSS articles...");
    let rssResult = { articles: [] as any[], new: 0, fetched: 0 };
    
    if (process.argv.includes("--force")) {
      console.log("⚠️  Forcing processing of a test article...");
      rssResult = {
        articles: [{
          title: "Exploring the Benefits of Integrative Health and Wellness",
          link: "https://example.com/test-article",
          pubDate: new Date().toISOString(),
          content: "This is a test article for pipeline verification.",
          snippet: "This is a test article for pipeline verification.",
          guid: "test-guid-" + Date.now()
        }],
        new: 1,
        fetched: 1
      };
    } else {
      const feedResult = await processCampaignFeeds(campaignId, TEST_USER_ID);
      rssResult = { articles: feedResult.articles || [], new: feedResult.new, fetched: feedResult.fetched };
    }
    
    if (!rssResult.articles || rssResult.articles.length === 0) {
      console.log("ℹ️ No new articles found to process.");
      return;
    }

    console.log(`✅ Found ${rssResult.new} new articles. Total fetched: ${rssResult.fetched}`);
    const newestArticle = rssResult.articles[0];
    console.log(`📝 Selected Article: ${newestArticle.title}`);

    // 2. Create Post directly with 'scheduled' status
    console.log("\n💾 Step 2: Creating post in database...");
    const nextScheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const postData = {
      campaignId: testCampaign.id,
      userId: TEST_USER_ID,
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
    console.log(`✅ Post created with ID: ${post.id}, Status: ${post.status}`);

    // 3. Process the Post (Generate Caption + Image Search)
    console.log("\n🤖 Step 3: Running pipeline (AI Generation + Image Search)...");
    await processNewPost(post, testCampaign, undefined, nextScheduledTime);
    
    // Fetch updated post to see results
    const updatedPost = await storage.getPost(post.id);
    if (!updatedPost) throw new Error("Could not fetch updated post");

    console.log(`✅ Pipeline Complete!`);
    console.log(`📝 Generated Caption: ${updatedPost.generatedCaption?.substring(0, 100)}...`);
    console.log(`🖼️ Final Image URL: ${updatedPost.imageUrl}`);
    console.log(`🏷️ Image Search Phrase: ${updatedPost.imageSearchPhrase}`);

    // 4. Publish to Postly (if requested)
    if (shouldPublish) {
      console.log("\n📤 Step 4: Publishing to Postly...");
      await publishPost(updatedPost, testCampaign, undefined);
      console.log(`✅ Published successfully!`);
    } else {
      console.log("\nℹ️ Skipping publish step. Run with --publish to post to Postly.");
    }

  } catch (error) {
    console.error("❌ Pipeline Test Failed:", error);
  }
}

// Get campaign ID and flags from command line arguments
const campaignId = parseInt(process.argv[2]);
const shouldPublish = process.argv.includes("--publish");

if (isNaN(campaignId)) {
  console.log("Please provide a valid campaign ID: npx tsx server/test-pipeline.ts <campaign_id> [--publish] [--force]");
  process.exit(1);
}

testFullPipeline(campaignId, shouldPublish).then(() => {
  console.log("\n✨ Test finished.");
  process.exit(0);
});
