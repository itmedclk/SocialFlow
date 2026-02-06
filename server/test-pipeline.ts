import { storage } from "./storage";
import { processCampaignFeeds } from "./services/rss";
import { processNewPost } from "./services/pipeline";
import { format } from "date-fns";

async function testFullPipeline(campaignId: number) {
  console.log(`\n🚀 Starting Full Pipeline Test for Campaign ID: ${campaignId}`);
  
  try {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      console.error(`❌ Campaign ${campaignId} not found.`);
      return;
    }

    console.log(`📂 Campaign: ${campaign.name}`);
    console.log(`🔗 RSS Feeds: ${campaign.rssUrls?.join(", ")}`);

    // 1. Fetch RSS Articles
    console.log("\n📡 Step 1: Fetching RSS articles...");
    const rssResult = await processCampaignFeeds(campaignId, campaign.userId || undefined);
    
    if (!rssResult.articles || rssResult.articles.length === 0) {
      console.log("ℹ️ No new articles found to process.");
      return;
    }

    console.log(`✅ Found ${rssResult.new} new articles. Total fetched: ${rssResult.fetched}`);
    const newestArticle = rssResult.articles[0];
    console.log(`📝 Selected Article: ${newestArticle.title}`);

    // 2. Create Post directly with 'scheduled' status (as per current logic)
    console.log("\n💾 Step 2: Creating post in database...");
    const nextScheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
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
    console.log(`✅ Post created with ID: ${post.id}, Status: ${post.status}`);

    // 3. Process the Post (Generate Caption + Image Search)
    console.log("\n🤖 Step 3: Running pipeline (AI Generation + Image Search)...");
    await processNewPost(post, campaign, undefined, nextScheduledTime);
    
    // Fetch updated post to see results
    const updatedPost = await storage.getPost(post.id);
    console.log(`✅ Pipeline Complete!`);
    console.log(`📝 Generated Caption: ${updatedPost?.generatedCaption?.substring(0, 100)}...`);
    console.log(`🖼️ Final Image URL: ${updatedPost?.imageUrl}`);
    console.log(`🏷️ Image Prompt: ${updatedPost?.imagePrompt}`);

  } catch (error) {
    console.error("❌ Pipeline Test Failed:", error);
  }
}

// Get campaign ID from command line arguments
const campaignId = parseInt(process.argv[2]);

if (isNaN(campaignId)) {
  console.log("Please provide a valid campaign ID: npx tsx server/test-pipeline.ts <campaign_id>");
  process.exit(1);
}

testFullPipeline(campaignId).then(() => {
  console.log("\n✨ Test finished.");
  process.exit(0);
});
