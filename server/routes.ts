import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertPostSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import { processCampaignFeeds, processAllActiveCampaigns } from "./services/rss";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================
  // Campaign Routes
  // ============================================
  
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      
      await storage.createLog({
        campaignId: campaign.id,
        level: "info",
        message: `Campaign "${campaign.name}" created`,
        metadata: { campaignId: campaign.id }
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const partialSchema = insertCampaignSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      
      const campaign = await storage.updateCampaign(id, validatedData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      await storage.createLog({
        campaignId: campaign.id,
        level: "info",
        message: `Campaign "${campaign.name}" updated`,
        metadata: { campaignId: campaign.id, updates: Object.keys(validatedData) }
      });
      
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      const deleted = await storage.deleteCampaign(id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete campaign" });
      }
      
      await storage.createLog({
        level: "warning",
        message: `Campaign "${campaign.name}" deleted`,
        metadata: { campaignId: id }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // ============================================
  // Post Routes
  // ============================================
  
  app.get("/api/posts", async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let posts;
      
      if (status === 'draft') {
        posts = await storage.getDraftPosts(campaignId);
      } else if (status === 'scheduled') {
        posts = await storage.getScheduledPosts();
      } else if (campaignId) {
        posts = await storage.getPostsByCampaign(campaignId);
      } else {
        posts = await storage.getDraftPosts();
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      
      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        level: "info",
        message: `Post created: "${post.sourceTitle}"`,
        metadata: { postId: post.id }
      });
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const partialSchema = insertPostSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      
      const post = await storage.updatePost(id, validatedData);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      await storage.createLog({
        campaignId: post.campaignId,
        postId: post.id,
        level: "info",
        message: `Post updated: "${post.sourceTitle}"`,
        metadata: { postId: post.id, updates: Object.keys(validatedData) }
      });
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // ============================================
  // Log Routes
  // ============================================
  
  app.get("/api/logs", async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      let logs;
      if (campaignId) {
        logs = await storage.getLogsByCampaign(campaignId, limit);
      } else {
        logs = await storage.getAllLogs(limit);
      }
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const validatedData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid log data", details: error.errors });
      }
      console.error("Error creating log:", error);
      res.status(500).json({ error: "Failed to create log" });
    }
  });

  // ============================================
  // RSS Routes
  // ============================================
  
  app.post("/api/campaigns/:id/fetch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const result = await processCampaignFeeds(id);
      res.json({
        success: true,
        message: `Fetched ${result.new} new articles from ${result.fetched} total`,
        ...result
      });
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch RSS feeds" 
      });
    }
  });

  app.post("/api/fetch-all", async (req, res) => {
    try {
      await processAllActiveCampaigns();
      res.json({ success: true, message: "Started fetching all active campaigns" });
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // ============================================
  // Dashboard Stats
  // ============================================
  
  app.get("/api/stats", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      const activeCampaigns = campaigns.filter(c => c.isActive);
      
      const allPosts: any[] = [];
      for (const campaign of campaigns) {
        const posts = await storage.getPostsByCampaign(campaign.id, 1000);
        allPosts.push(...posts);
      }
      
      const drafts = allPosts.filter(p => p.status === 'draft');
      const scheduled = allPosts.filter(p => p.status === 'scheduled');
      const posted = allPosts.filter(p => p.status === 'posted');
      const failed = allPosts.filter(p => p.status === 'failed');
      
      const recentLogs = await storage.getAllLogs(50);
      
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

  return httpServer;
}
