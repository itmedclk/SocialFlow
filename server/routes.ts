import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCampaignSchema,
  insertPostSchema,
  insertLogSchema,
  insertUserSettingsSchema,
} from "@shared/schema";
import { z } from "zod";
import {
  processCampaignFeeds,
  processAllActiveCampaigns,
} from "./services/rss";
import {
  processNewPost,
  publishPost,
  processDraftPosts,
} from "./services/pipeline";
import { runNow } from "./services/scheduler";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ============================================
  // Campaign Routes (authenticated)
  // ============================================

  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getAllCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCampaignSchema.parse({ ...req.body, userId });
      const campaign = await storage.createCampaign(validatedData);

      await storage.createLog({
        campaignId: campaign.id,
        userId,
        level: "info",
        message: `Campaign "${campaign.name}" created`,
        metadata: { campaignId: campaign.id },
      });

      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const partialSchema = insertCampaignSchema.partial();
      const validatedData = partialSchema.parse(req.body);

      const campaign = await storage.updateCampaign(id, validatedData, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      await storage.createLog({
        campaignId: campaign.id,
        userId,
        level: "info",
        message: `Campaign "${campaign.name}" updated`,
        metadata: {
          campaignId: campaign.id,
          updates: Object.keys(validatedData),
        },
      });

      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const deleted = await storage.deleteCampaign(id, userId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete campaign" });
      }

      await storage.createLog({
        userId,
        level: "warning",
        message: `Campaign "${campaign.name}" deleted`,
        metadata: { campaignId: id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // ============================================
  // Post Routes (authenticated)
  // ============================================

  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.query.campaignId
        ? parseInt(req.query.campaignId as string)
        : undefined;
      const status = req.query.status as string | undefined;
      const includePostId = req.query.includePostId
        ? parseInt(req.query.includePostId as string)
        : undefined;

      let posts;

      if (status === "draft") {
        posts = await storage.getDraftPosts(campaignId, userId);
        if (includePostId && !posts.find((p) => p.id === includePostId)) {
          const extraPost = await storage.getPost(includePostId, userId);
          if (extraPost) posts.push(extraPost);
        }
      } else if (status === "scheduled") {
        posts = await storage.getScheduledPosts(userId);
      } else if (campaignId) {
        posts = await storage.getPostsByCampaign(campaignId, 50, userId);
      } else {
        posts = await storage.getDraftPosts(undefined, userId);
      }

      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const post = await storage.getPost(id, userId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPostSchema.parse({ ...req.body, userId });
      const post = await storage.createPost(validatedData);

      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        userId,
        level: "info",
        message: `Post created: "${post.sourceTitle}"`,
        metadata: { postId: post.id },
      });

      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid post data", details: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const partialSchema = insertPostSchema.partial();
      const rawData = req.body;

      // Convert ISO string to Date object for Zod if present
      if (rawData.scheduledFor && typeof rawData.scheduledFor === "string") {
        rawData.scheduledFor = new Date(rawData.scheduledFor);
      }
      if (rawData.pubDate && typeof rawData.pubDate === "string") {
        rawData.pubDate = new Date(rawData.pubDate);
      }

      const validatedData = partialSchema.parse(rawData);

      const post = await storage.updatePost(id, validatedData, userId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        userId,
        level: "info",
        message: `Post updated: "${post.sourceTitle}"`,
        metadata: { postId: post.id, updates: Object.keys(validatedData) },
      });

      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid post data", details: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // ============================================
  // Log Routes (authenticated)
  // ============================================

  app.get("/api/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.query.campaignId
        ? parseInt(req.query.campaignId as string)
        : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      let logs;
      if (campaignId) {
        logs = await storage.getLogsByCampaign(campaignId, limit, userId);
      } else {
        logs = await storage.getAllLogs(limit, userId);
      }

      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLogSchema.parse({ ...req.body, userId });
      const log = await storage.createLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid log data", details: error.errors });
      }
      console.error("Error creating log:", error);
      res.status(500).json({ error: "Failed to create log" });
    }
  });

  // ============================================
  // RSS Routes (authenticated)
  // ============================================

  app.post(
    "/api/campaigns/:id/fetch",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid campaign ID" });
        }

        const campaign = await storage.getCampaign(id, userId);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }

        const result = await processCampaignFeeds(id, userId);
        res.json({
          success: true,
          message: `Fetched ${result.new} new articles from ${result.fetched} total`,
          ...result,
        });
      } catch (error) {
        console.error("Error fetching RSS feeds:", error);
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch RSS feeds",
        });
      }
    },
  );

  app.post("/api/fetch-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await processAllActiveCampaigns(userId);
      res.json({
        success: true,
        message: "Started fetching all active campaigns",
      });
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // ============================================
  // Pipeline Routes (AI Generation & Publishing) - authenticated
  // ============================================

  app.post(
    "/api/campaigns/:id/process",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid campaign ID" });
        }

        const campaign = await storage.getCampaign(id, userId);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }

        const result = await processDraftPosts(id);
        res.json({
          ok: true,
          message: `Processed ${result.processed} drafts: ${result.success} succeeded, ${result.failed} failed`,
          ...result,
        });
      } catch (error) {
        console.error("Error processing drafts:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to process drafts",
        });
      }
    },
  );

  app.post(
    "/api/posts/:id/generate",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid post ID" });
        }

        const post = await storage.getPost(id, userId);
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        const campaign = await storage.getCampaign(post.campaignId, userId);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }

        await processNewPost(post, campaign);
        const updatedPost = await storage.getPost(id, userId);

        res.json({
          success: true,
          message: "Content generated successfully",
          post: updatedPost,
        });
      } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate content",
        });
      }
    },
  );

  app.post("/api/posts/:id/publish", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const post = await storage.getPost(id, userId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const campaign = await storage.getCampaign(post.campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const captionOverride = req.body.generatedCaption;

      await publishPost(post, campaign, captionOverride);
      const updatedPost = await storage.getPost(id, userId);

      res.json({
        success: true,
        message: "Post published successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Error publishing post:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to publish post",
      });
    }
  });

  app.post("/api/posts/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const scheduledFor = req.body.scheduledFor
        ? new Date(req.body.scheduledFor)
        : null;

      const post = await storage.updatePost(
        id,
        {
          status: scheduledFor ? "scheduled" : "approved",
          scheduledFor,
        },
        userId,
      );

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        userId,
        level: "info",
        message: scheduledFor
          ? `Post approved and scheduled for ${scheduledFor.toISOString()}`
          : "Post approved",
      });

      res.json({ success: true, post });
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({ error: "Failed to approve post" });
    }
  });

  app.post("/api/posts/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const reason = req.body.reason || "Rejected by user";

      const post = await storage.updatePost(
        id,
        {
          status: "failed",
          failureReason: reason,
        },
        userId,
      );

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        userId,
        level: "info",
        message: `Post rejected: ${reason}`,
      });

      res.json({ success: true, post });
    } catch (error) {
      console.error("Error rejecting post:", error);
      res.status(500).json({ error: "Failed to reject post" });
    }
  });

  app.post("/api/run", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { action, campaignId } = req.body;

      if (!action || !["fetch", "process", "publish"].includes(action)) {
        return res
          .status(400)
          .json({
            error: "Invalid action. Must be: fetch, process, or publish",
          });
      }

      const result = await runNow(action, campaignId, userId);
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error running action:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to run action",
      });
    }
  });

  // ============================================
  // Dashboard Stats (authenticated)
  // ============================================

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getAllCampaigns(userId);
      const activeCampaigns = campaigns.filter((c) => c.isActive);

      const allPosts: any[] = [];
      for (const campaign of campaigns) {
        const posts = await storage.getPostsByCampaign(
          campaign.id,
          1000,
          userId,
        );
        allPosts.push(...posts);
      }

      const drafts = allPosts.filter((p) => p.status === "draft");
      const scheduled = allPosts.filter((p) => p.status === "scheduled");
      const posted = allPosts.filter((p) => p.status === "posted");
      const failed = allPosts.filter((p) => p.status === "failed");

      const recentLogs = await storage.getAllLogs(50, userId);

      res.json({
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalPosts: allPosts.length,
        drafts: drafts.length,
        scheduled: scheduled.length,
        posted: posted.length,
        failed: failed.length,
        pendingReview: drafts.length,
        recentActivity: recentLogs.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ============================================
  // User Settings Routes (requires authentication)
  // ============================================

  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);

      if (!settings) {
        return res.json({
          userId,
          aiApiKey: null,
          aiBaseUrl: null,
          aiModel: null,
          globalAiPrompt: null,
          postlyApiKey: null,
          unsplashAccessKey: null,
          pexelsApiKey: null,
        });
      }

      res.json({
        ...settings,
        aiApiKey: settings.aiApiKey ? "••••••••" : null,
        postlyApiKey: settings.postlyApiKey ? "••••••••" : null,
        postlyWorkspaceId: settings.postlyWorkspaceId || null,
        unsplashAccessKey: settings.unsplashAccessKey ? "••••••••" : null,
        pexelsApiKey: settings.pexelsApiKey ? "••••••••" : null,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingSettings = await storage.getUserSettings(userId);

      const updateData: any = { userId };

      if (req.body.aiApiKey !== undefined && req.body.aiApiKey !== "••••••••") {
        updateData.aiApiKey = req.body.aiApiKey || null;
      } else if (existingSettings) {
        updateData.aiApiKey = existingSettings.aiApiKey;
      }

      if (req.body.aiBaseUrl !== undefined) {
        updateData.aiBaseUrl = req.body.aiBaseUrl || null;
      } else if (existingSettings) {
        updateData.aiBaseUrl = existingSettings.aiBaseUrl;
      }

      if (req.body.aiModel !== undefined) {
        updateData.aiModel = req.body.aiModel || null;
      } else if (existingSettings) {
        updateData.aiModel = existingSettings.aiModel;
      }

      if (req.body.globalAiPrompt !== undefined) {
        updateData.globalAiPrompt = req.body.globalAiPrompt || null;
      } else if (existingSettings) {
        updateData.globalAiPrompt = existingSettings.globalAiPrompt;
      }

      if (
        req.body.postlyApiKey !== undefined &&
        req.body.postlyApiKey !== "••••••••"
      ) {
        updateData.postlyApiKey = req.body.postlyApiKey || null;
      } else if (existingSettings) {
        updateData.postlyApiKey = existingSettings.postlyApiKey;
      }

      if (
        req.body.unsplashAccessKey !== undefined &&
        req.body.unsplashAccessKey !== "••••••••"
      ) {
        updateData.unsplashAccessKey = req.body.unsplashAccessKey || null;
      } else if (existingSettings) {
        updateData.unsplashAccessKey = existingSettings.unsplashAccessKey;
      }

      if (
        req.body.pexelsApiKey !== undefined &&
        req.body.pexelsApiKey !== "••••••••"
      ) {
        updateData.pexelsApiKey = req.body.pexelsApiKey || null;
      } else if (existingSettings) {
        updateData.pexelsApiKey = existingSettings.pexelsApiKey;
      }

      if (req.body.postlyWorkspaceId !== undefined) {
        updateData.postlyWorkspaceId = req.body.postlyWorkspaceId || null;
      } else if (existingSettings) {
        updateData.postlyWorkspaceId = existingSettings.postlyWorkspaceId;
      }

      const settings = await storage.upsertUserSettings(updateData);

      res.json({
        ...settings,
        aiApiKey: settings.aiApiKey ? "••••••••" : null,
        postlyApiKey: settings.postlyApiKey ? "••••••••" : null,
        postlyWorkspaceId: settings.postlyWorkspaceId || null,
        unsplashAccessKey: settings.unsplashAccessKey ? "••••••••" : null,
        pexelsApiKey: settings.pexelsApiKey ? "••••••••" : null,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Endpoint to search for images (authenticated)
  app.post(
    "/api/posts/:id/search-image",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid post ID" });
        }

        const post = await storage.getPost(id, userId);
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        const campaign = await storage.getCampaign(post.campaignId, userId);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }

        const { searchImage, extractOgImage, getImageKeywordsFromCampaign } =
          await import("./services/images");

        // Handle cyclic search
        const currentOffset = parseInt(req.query.offset as string) || 0;

        let imageUrl: string | null = null;
        let imageCredit: string | null = null;

        // Only extract OG image on the first search (offset 0)
        if (currentOffset === 0) {
          const ogImage = await extractOgImage(post.sourceUrl);
          if (ogImage) {
            imageUrl = ogImage;
            imageCredit = "Source article";
          }
        }

        if (!imageUrl) {
          const providers = campaign.imageProviders?.length
            ? campaign.imageProviders.filter(
                (p: any) => p.type.toLowerCase() !== "wikimedia",
              )
            : [
                { type: "pexels", value: "" },
                { type: "unsplash", value: "" },
              ];

          const keywords = getImageKeywordsFromCampaign(
            campaign,
            post.sourceTitle,
          );
          // Pass offset to searchImage
          const userSettings = await storage.getUserSettings(userId);
          const imageResult = await searchImage(
            keywords,
            providers,
            campaign.id,
            currentOffset,
            userSettings,
          );

          if (imageResult) {
            imageUrl = imageResult.url;
            imageCredit = imageResult.credit;
          }
        }

        if (imageUrl) {
          console.log(
            `[ImageSearch] Found image for post ${id} (offset ${currentOffset}): ${imageUrl}`,
          );
          await storage.updatePost(id, { imageUrl, imageCredit }, userId);
          const updatedPost = await storage.getPost(id, userId);
          res.json({ success: true, post: updatedPost });
        } else {
          console.log(
            `[ImageSearch] No image found for post ${id} (offset ${currentOffset})`,
          );
          res.json({ success: false, message: "No image found" });
        }
      } catch (error) {
        console.error("Error searching for image:", error);
        res.status(500).json({ error: "Failed to search for image" });
      }
    },
  );

  // Endpoint to sync review prompt to campaign (authenticated)
  app.put(
    "/api/campaigns/:id/prompt",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid campaign ID" });
        }

        const { aiPrompt } = req.body;
        const campaign = await storage.updateCampaign(id, { aiPrompt }, userId);

        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }

        res.json({ success: true, campaign });
      } catch (error) {
        console.error("Error updating campaign prompt:", error);
        res.status(500).json({ error: "Failed to update campaign prompt" });
      }
    },
  );

  return httpServer;
}
