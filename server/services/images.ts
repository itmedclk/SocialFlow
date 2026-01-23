import { storage } from "../storage";
import type { Campaign } from "@shared/schema";

export interface ImageResult {
  url: string;
  credit: string;
  provider: string;
}

interface UnsplashResult {
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
  links: { html: string };
}

interface PexelsResult {
  src: { large: string; medium: string };
  photographer: string;
  photographer_url: string;
  url: string;
}

interface WikimediaResult {
  title: string;
  source: string;
  descriptionurl: string;
}

export async function searchImage(
  keywords: string[],
  providers: Array<{ type: string; value: string }>,
  campaignId?: number
): Promise<ImageResult | null> {
  const query = keywords.join(" ");

  for (const provider of providers) {
    try {
      let result: ImageResult | null = null;

      switch (provider.type.toLowerCase()) {
        case "unsplash":
          result = await searchUnsplash(query);
          break;
        case "pexels":
          result = await searchPexels(query);
          break;
        case "wikimedia":
          result = await searchWikimedia(query);
          break;
        default:
          console.warn(`Unknown image provider: ${provider.type}`);
      }

      if (result) {
        if (campaignId) {
          await storage.createLog({
            campaignId,
            level: "info",
            message: `Image found from ${provider.type}`,
            metadata: { query, url: result.url },
          });
        }
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Image search failed for ${provider.type}:`, errorMessage);
      
      if (campaignId) {
        await storage.createLog({
          campaignId,
          level: "warning",
          message: `Image search failed for ${provider.type}`,
          metadata: { query, error: errorMessage },
        });
      }
    }
  }

  return null;
}

async function searchUnsplash(query: string): Promise<ImageResult | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!apiKey) {
    throw new Error("UNSPLASH_ACCESS_KEY not configured");
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();
  const photo: UnsplashResult = data.results?.[0];

  if (!photo) {
    return null;
  }

  return {
    url: photo.urls.regular,
    credit: `Photo by ${photo.user.name} on Unsplash`,
    provider: "unsplash",
  };
}

async function searchPexels(query: string): Promise<ImageResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY not configured");
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json();
  const photo: PexelsResult = data.photos?.[0];

  if (!photo) {
    return null;
  }

  return {
    url: photo.src.large,
    credit: `Photo by ${photo.photographer} on Pexels`,
    provider: "pexels",
  };
}

async function searchWikimedia(query: string): Promise<ImageResult | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=1&format=json&origin=*`;
  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikimedia API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.query?.search?.[0];

  if (!result) {
    return null;
  }

  const title = result.title;
  const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
  
  const imageInfoResponse = await fetch(imageInfoUrl);
  const imageInfoData = await imageInfoResponse.json();
  const pages = imageInfoData.query?.pages;
  const pageId = Object.keys(pages)[0];
  const imageInfo = pages[pageId]?.imageinfo?.[0];

  if (!imageInfo?.url) {
    return null;
  }

  return {
    url: imageInfo.url,
    credit: `Image from Wikimedia Commons`,
    provider: "wikimedia",
  };
}

export async function extractOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SocialFlow/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    return ogMatch ? ogMatch[1] : null;
  } catch (error) {
    console.error("Failed to extract OG image:", error);
    return null;
  }
}

export function getImageKeywordsFromCampaign(campaign: Campaign, articleTitle: string): string[] {
  const configuredKeywords = campaign.imageKeywords || [];
  
  const titleWords = articleTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 3);

  return [...configuredKeywords, ...titleWords].slice(0, 5);
}
