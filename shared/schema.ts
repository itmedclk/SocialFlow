import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// ============================================
// Campaigns Table
// ============================================
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  topic: text("topic").notNull(),
  scheduleCron: text("schedule_cron"),
  scheduleTimezone: text("schedule_timezone").default("America/Los_Angeles"),
  rssUrls: jsonb("rss_urls").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  aiPrompt: text("ai_prompt"),
  imageKeywords: jsonb("image_keywords").$type<string[]>().default(sql`'[]'::jsonb`),
  imageProviders: jsonb("image_providers").$type<Array<{type: string, value: string}>>().default(sql`'[]'::jsonb`),
  targetPlatforms: jsonb("target_platforms").$type<string[]>().default(sql`'[]'::jsonb`),
  useSpecificAccount: boolean("use_specific_account").default(false),
  specificAccountId: text("specific_account_id"),
  autoPublish: boolean("auto_publish").default(false),
  useAiImage: boolean("use_ai_image").default(false),
  userId: text("user_id"),
  safetyForbiddenTerms: text("safety_forbidden_terms"),
  safetyMaxLength: integer("safety_max_length").default(2000),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// ============================================
// Posts Table
// ============================================
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: text("user_id"),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceGuid: text("source_guid").notNull(),
  sourceSnippet: text("source_snippet"),
  pubDate: timestamp("pub_date"),
  generatedCaption: text("generated_caption"),
  imageUrl: text("image_url"),
  imageCredit: text("image_credit"),
  imageSearchPhrase: text("image_search_phrase"),
  status: text("status").$type<'draft' | 'approved' | 'scheduled' | 'posted' | 'failed' | 'cancelled'>().notNull().default('draft'),
  scheduledFor: timestamp("scheduled_for"),
  postedAt: timestamp("posted_at"),
  retryCount: integer("retry_count").default(0),
  failureReason: text("failure_reason"),
  aiModel: text("ai_model"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// ============================================
// Logs Table
// ============================================
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: 'set null' }),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'set null' }),
  userId: text("user_id"),
  level: text("level").$type<'info' | 'warning' | 'error'>().notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// ============================================
// User Settings Table (per-user API keys)
// ============================================
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  aiApiKey: text("ai_api_key"),
  aiBaseUrl: text("ai_base_url"),
  aiModel: text("ai_model"),
  globalAiPrompt: text("global_ai_prompt"),
  postlyApiKey: text("postly_api_key"),
  unsplashAccessKey: text("unsplash_access_key"),
  pexelsApiKey: text("pexels_api_key"),
  postlyWorkspaceId: text("postly_workspace_id"),
  aiImageModel: text("ai_image_model"),
  novitaApiKey: text("novita_api_key"),
  googleClientId: text("google_client_id"),
  googleClientSecret: text("google_client_secret"),
  googleSpreadsheetId: text("google_spreadsheet_id"),
  googleRefreshToken: text("google_refresh_token"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
