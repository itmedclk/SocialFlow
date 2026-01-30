import { campaigns, posts, logs, userSettings, type Campaign, type InsertCampaign, type Post, type InsertPost, type Log, type InsertLog, type UserSettings, type InsertUserSettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // Campaign methods (with userId filtering)
  getCampaign(id: number, userId?: string): Promise<Campaign | undefined>;
  getAllCampaigns(userId?: string): Promise<Campaign[]>;
  getActiveCampaigns(userId?: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId?: string): Promise<Campaign | undefined>;
  deleteCampaign(id: number, userId?: string): Promise<boolean>;
  
  // Post methods (with userId filtering)
  getPost(id: number, userId?: string): Promise<Post | undefined>;
  getPostsByCampaign(campaignId: number, limit?: number, userId?: string): Promise<Post[]>;
  getPostByGuid(guid: string, campaignId?: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>, userId?: string): Promise<Post | undefined>;
  getScheduledPosts(userId?: string): Promise<Post[]>;
  getDraftPosts(campaignId?: number, userId?: string): Promise<Post[]>;
  deleteDraftPostsByCampaign(campaignId: number, userId?: string): Promise<number>;
  deleteOldPublishedPosts(daysOld: number): Promise<number>;
  
  // Log methods (with userId filtering)
  createLog(log: InsertLog): Promise<Log>;
  getLogsByCampaign(campaignId: number, limit?: number, userId?: string): Promise<Log[]>;
  getAllLogs(limit?: number, userId?: string): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // User Settings Methods
  // ============================================
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    console.log(`[Storage] Fetching settings for userId: "${userId}"`);
    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    console.log(`[Storage] Found ${settings.length} records for userId: "${userId}"`);
    return settings[0] || undefined;
  }

  async upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [result] = await db
      .insert(userSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          aiApiKey: settings.aiApiKey,
          aiBaseUrl: settings.aiBaseUrl,
          aiModel: settings.aiModel,
          globalAiPrompt: settings.globalAiPrompt,
          postlyApiKey: settings.postlyApiKey,
          unsplashAccessKey: settings.unsplashAccessKey,
          pexelsApiKey: settings.pexelsApiKey,
          postlyWorkspaceId: settings.postlyWorkspaceId,
          aiImageModel: settings.aiImageModel,
          novitaApiKey: settings.novitaApiKey,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // ============================================
  // Campaign Methods
  // ============================================
  async getCampaign(id: number, userId?: string): Promise<Campaign | undefined> {
    if (userId) {
      const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
      return campaign || undefined;
    }
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getAllCampaigns(userId?: string): Promise<Campaign[]> {
    if (userId) {
      return await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
    }
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getActiveCampaigns(userId?: string): Promise<Campaign[]> {
    if (userId) {
      return await db.select().from(campaigns).where(and(eq(campaigns.isActive, true), eq(campaigns.userId, userId)));
    }
    return await db.select().from(campaigns).where(eq(campaigns.isActive, true));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updateData: Partial<InsertCampaign>, userId?: string): Promise<Campaign | undefined> {
    if (userId) {
      const [campaign] = await db
        .update(campaigns)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
        .returning();
      return campaign || undefined;
    }
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async deleteCampaign(id: number, userId?: string): Promise<boolean> {
    if (userId) {
      const result = await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    }
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================
  // Post Methods
  // ============================================
  async getPost(id: number, userId?: string): Promise<Post | undefined> {
    if (userId) {
      const [post] = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));
      return post || undefined;
    }
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostsByCampaign(campaignId: number, limit: number = 50, userId?: string): Promise<Post[]> {
    if (userId) {
      return await db
        .select()
        .from(posts)
        .where(and(eq(posts.campaignId, campaignId), eq(posts.userId, userId)))
        .orderBy(desc(posts.createdAt))
        .limit(limit);
    }
    return await db
      .select()
      .from(posts)
      .where(eq(posts.campaignId, campaignId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPostByGuid(guid: string, campaignId?: number): Promise<Post | undefined> {
    if (campaignId) {
      // Deduplication should be per-campaign: same article shouldn't appear twice in the same campaign
      const [post] = await db.select().from(posts).where(and(eq(posts.sourceGuid, guid), eq(posts.campaignId, campaignId)));
      return post || undefined;
    }
    const [post] = await db.select().from(posts).where(eq(posts.sourceGuid, guid));
    return post || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost as any)
      .returning();
    return post;
  }

  async updatePost(id: number, updateData: Partial<InsertPost>, userId?: string): Promise<Post | undefined> {
    if (userId) {
      const [post] = await db
        .update(posts)
        .set({ ...updateData, updatedAt: new Date() } as any)
        .where(and(eq(posts.id, id), eq(posts.userId, userId)))
        .returning();
      return post || undefined;
    }
    const [post] = await db
      .update(posts)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async getScheduledPosts(userId?: string): Promise<Post[]> {
    if (userId) {
      return await db
        .select()
        .from(posts)
        .where(and(eq(posts.status, 'scheduled' as any), eq(posts.userId, userId)))
        .orderBy(posts.scheduledFor);
    }
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'scheduled' as any))
      .orderBy(posts.scheduledFor);
  }

  async getDraftPosts(campaignId?: number, userId?: string): Promise<Post[]> {
    const draftStatus = "draft" as const;
    if (userId) {
      if (campaignId !== undefined) {
        return await db
          .select()
          .from(posts)
          .where(and(eq(posts.campaignId, campaignId), eq(posts.status, draftStatus), eq(posts.userId, userId)))
          .orderBy(desc(posts.pubDate), desc(posts.createdAt));
      }
      return await db
        .select()
        .from(posts)
        .where(and(eq(posts.status, draftStatus), eq(posts.userId, userId)))
        .orderBy(desc(posts.pubDate), desc(posts.createdAt));
    }
    if (campaignId !== undefined) {
      return await db
        .select()
        .from(posts)
        .where(and(eq(posts.campaignId, campaignId), eq(posts.status, draftStatus)))
        .orderBy(desc(posts.pubDate), desc(posts.createdAt));
    }
    
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, draftStatus))
      .orderBy(desc(posts.pubDate), desc(posts.createdAt));
  }

  async deleteDraftPostsByCampaign(campaignId: number, userId?: string): Promise<number> {
    const draftStatus = "draft" as const;
    const drafts = userId
      ? await db
          .select({ id: posts.id })
          .from(posts)
          .where(and(eq(posts.campaignId, campaignId), eq(posts.status, draftStatus), eq(posts.userId, userId)))
      : await db
          .select({ id: posts.id })
          .from(posts)
          .where(and(eq(posts.campaignId, campaignId), eq(posts.status, draftStatus)));

    if (drafts.length === 0) {
      return 0;
    }

    for (const draft of drafts) {
      await db.delete(posts).where(eq(posts.id, draft.id));
    }

    return drafts.length;
  }

  async deleteOldPublishedPosts(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const postedStatus = "posted" as const;
    const oldPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.status, postedStatus), lt(posts.postedAt, cutoffDate)));
    
    if (oldPosts.length === 0) {
      return 0;
    }
    
    for (const post of oldPosts) {
      await db.delete(posts).where(eq(posts.id, post.id));
    }
    
    return oldPosts.length;
  }

  // ============================================
  // Log Methods
  // ============================================
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db
      .insert(logs)
      .values(insertLog as any)
      .returning();
    return log;
  }

  async getLogsByCampaign(campaignId: number, limit: number = 100, userId?: string): Promise<Log[]> {
    if (userId) {
      return await db
        .select()
        .from(logs)
        .where(and(eq(logs.campaignId, campaignId), eq(logs.userId, userId)))
        .orderBy(desc(logs.createdAt))
        .limit(limit);
    }
    return await db
      .select()
      .from(logs)
      .where(eq(logs.campaignId, campaignId))
      .orderBy(desc(logs.createdAt))
      .limit(limit);
  }

  async getAllLogs(limit: number = 100, userId?: string): Promise<Log[]> {
    if (userId) {
      return await db
        .select()
        .from(logs)
        .where(eq(logs.userId, userId))
        .orderBy(desc(logs.createdAt))
        .limit(limit);
    }
    return await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
