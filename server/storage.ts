import { campaigns, posts, logs, userSettings, type Campaign, type InsertCampaign, type Post, type InsertPost, type Log, type InsertLog, type UserSettings, type InsertUserSettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // Campaign methods
  getCampaign(id: number): Promise<Campaign | undefined>;
  getAllCampaigns(): Promise<Campaign[]>;
  getActiveCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  
  // Post methods
  getPost(id: number): Promise<Post | undefined>;
  getPostsByCampaign(campaignId: number, limit?: number): Promise<Post[]>;
  getPostByGuid(guid: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  getScheduledPosts(): Promise<Post[]>;
  getDraftPosts(campaignId?: number): Promise<Post[]>;
  
  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogsByCampaign(campaignId: number, limit?: number): Promise<Log[]>;
  getAllLogs(limit?: number): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // User Settings Methods
  // ============================================
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
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
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // ============================================
  // Campaign Methods
  // ============================================
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.isActive, true));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updateData: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================
  // Post Methods
  // ============================================
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostsByCampaign(campaignId: number, limit: number = 50): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.campaignId, campaignId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPostByGuid(guid: string): Promise<Post | undefined> {
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

  async updatePost(id: number, updateData: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async getScheduledPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'scheduled' as any))
      .orderBy(posts.scheduledFor);
  }

  async getDraftPosts(campaignId?: number): Promise<Post[]> {
    const draftStatus = "draft" as const;
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

  async getLogsByCampaign(campaignId: number, limit: number = 100): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .where(eq(logs.campaignId, campaignId))
      .orderBy(desc(logs.createdAt))
      .limit(limit);
  }

  async getAllLogs(limit: number = 100): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
