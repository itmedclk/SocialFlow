var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { sql } from "drizzle-orm";
import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export * from "./models/auth";
// ============================================
// Campaigns Table
// ============================================
export var campaigns = pgTable("campaigns", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    topic: text("topic").notNull(),
    scheduleCron: text("schedule_cron"),
    scheduleTimezone: text("schedule_timezone").default("America/Los_Angeles"),
    rssUrls: jsonb("rss_urls").$type().notNull().default(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["'[]'::jsonb"], ["'[]'::jsonb"])))),
    aiPrompt: text("ai_prompt"),
    imageKeywords: jsonb("image_keywords").$type().default(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["'[]'::jsonb"], ["'[]'::jsonb"])))),
    imageProviders: jsonb("image_providers").$type().default(sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["'[]'::jsonb"], ["'[]'::jsonb"])))),
    targetPlatforms: jsonb("target_platforms").$type().default(sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["'[]'::jsonb"], ["'[]'::jsonb"])))),
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
export var insertCampaignSchema = createInsertSchema(campaigns).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// ============================================
// Posts Table
// ============================================
export var posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(function () { return campaigns.id; }, { onDelete: 'cascade' }),
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
    status: text("status").$type().notNull().default('draft'),
    scheduledFor: timestamp("scheduled_for"),
    postedAt: timestamp("posted_at"),
    retryCount: integer("retry_count").default(0),
    failureReason: text("failure_reason"),
    aiModel: text("ai_model"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export var insertPostSchema = createInsertSchema(posts).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// ============================================
// Logs Table
// ============================================
export var logs = pgTable("logs", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(function () { return campaigns.id; }, { onDelete: 'set null' }),
    postId: integer("post_id").references(function () { return posts.id; }, { onDelete: 'set null' }),
    userId: text("user_id"),
    level: text("level").$type().notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});
export var insertLogSchema = createInsertSchema(logs).omit({
    id: true,
    createdAt: true,
});
// ============================================
// User Settings Table (per-user API keys)
// ============================================
export var userSettings = pgTable("user_settings", {
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
export var insertUserSettingsSchema = createInsertSchema(userSettings).omit({
    id: true,
    updatedAt: true,
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
