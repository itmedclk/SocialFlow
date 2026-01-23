import Parser from "rss-parser";
import { storage } from "../storage";
import type { InsertPost } from "@shared/schema";

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'SocialFlow/1.0 RSS Reader',
  },
});

export interface ParsedArticle {
  title: string;
  link: string;
  guid: string;
  snippet: string;
  pubDate: Date | null;
  imageUrl: string | null;
}

export async function fetchFeed(url: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(url);
    
    return feed.items.map(item => parseArticle(item));
  } catch (error) {
    console.error(`Failed to fetch feed: ${url}`, error);
    throw new Error(`Failed to fetch RSS feed: ${url}`);
  }
}

function parseArticle(item: Parser.Item): ParsedArticle {
  const snippet = extractSnippet(item.contentSnippet || item.content || item.summary || "");
  const imageUrl = extractImageFromContent(item.content || "") || 
                   (item as any).enclosure?.url || 
                   (item as any)["media:content"]?.$.url ||
                   null;

  return {
    title: item.title || "Untitled",
    link: item.link || "",
    guid: item.guid || item.link || item.title || "",
    snippet,
    pubDate: item.pubDate ? new Date(item.pubDate) : null,
    imageUrl,
  };
}

function extractSnippet(content: string, maxLength: number = 500): string {
  const stripped = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (stripped.length <= maxLength) return stripped;
  
  return stripped.substring(0, maxLength).trim() + "...";
}

function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

export async function isNewArticle(guid: string): Promise<boolean> {
  const existingPost = await storage.getPostByGuid(guid);
  return !existingPost;
}

export async function processCampaignFeeds(campaignId: number): Promise<{
  fetched: number;
  new: number;
  errors: string[];
}> {
  const campaign = await storage.getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const result = {
    fetched: 0,
    new: 0,
    errors: [] as string[],
  };

  const rssUrls = campaign.rssUrls || [];
  
  for (const url of rssUrls) {
    if (!url.trim()) continue;
    
    try {
      const articles = await fetchFeed(url);
      result.fetched += articles.length;

      for (const article of articles) {
        const isNew = await isNewArticle(article.guid);
        
        if (isNew) {
          const postData: InsertPost = {
            campaignId,
            sourceTitle: article.title,
            sourceUrl: article.link,
            sourceGuid: article.guid,
            sourceSnippet: article.snippet,
            imageUrl: article.imageUrl,
            status: "draft",
          };

          await storage.createPost(postData);
          result.new++;

          await storage.createLog({
            campaignId,
            level: "info",
            message: `New article found: "${article.title}"`,
            metadata: { url: article.link, guid: article.guid },
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Feed ${url}: ${errorMessage}`);
      
      await storage.createLog({
        campaignId,
        level: "error",
        message: `Failed to fetch RSS feed`,
        metadata: { url, error: errorMessage },
      });
    }
  }

  await storage.createLog({
    campaignId,
    level: "info",
    message: `RSS fetch completed: ${result.new} new articles from ${result.fetched} total`,
    metadata: result,
  });

  return result;
}

export async function processAllActiveCampaigns(): Promise<void> {
  const campaigns = await storage.getActiveCampaigns();
  
  for (const campaign of campaigns) {
    try {
      await processCampaignFeeds(campaign.id);
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error);
    }
  }
}
