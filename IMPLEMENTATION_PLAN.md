# SocialFlow Automation - Implementation Plan

This document serves as the technical roadmap for building SocialFlow. If development pauses, use this guide to resume progress.

## 🏗 Architecture Overview

**Stack:**
- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (via Drizzle ORM)
- **Queues:** BullMQ or simple `setTimeout` loops for MVP

## 📅 Phased Implementation Roadmap

### ✅ Phase 0: Prototype (Completed)
- [x] UI/UX Design (Dashboard, Campaigns, Review, Logs)
- [x] Frontend State Management
- [x] Mock Data Structure

---

###  Phase 1: The Foundation (RSS & Database)
**Goal:** Server can store campaigns and fetch raw articles.

1.  **Database Setup**
    - Initialize PostgreSQL.
    - Create schemas: `users`, `campaigns`, `posts`, `logs`.
2.  **Campaign CRUD**
    - Create API endpoints to Save/Load campaigns from the DB (replacing local state).
3.  **RSS Engine**
    - Implement `rss-parser` service.
    - Create a background job to fetch feeds every N minutes.
    - **Deduplication Logic:** Check `guid` or `link` against `posts` table before inserting.

**Key Files to Create:**
- `server/db.ts` (Database connection)
- `shared/schema.ts` (Drizzle definitions)
- `server/services/rss.ts` (Fetching logic)

---

### Phase 2: The Brain (AI Generation)
**Goal:** Convert raw articles into social media drafts.

1.  **AI Service**
    - Integrate Novita AI (OpenAI-compatible).
    - Create `server/services/ai.ts`.
    - Implement the "Prompt Builder" using campaign configuration.
2.  **Image Sourcing**
    - Implement `server/services/images.ts`.
    - Connect Unsplash/Pexels APIs.
    - Fallback logic: If no image found -> Use article OG image -> Use placeholder.
3.  **Draft Generation Loop**
    - When RSS finds new item -> Trigger AI generation -> Save as `status: 'draft'` in DB.

---

### Phase 3: The Hands (Posting & Scheduling)
**Goal:** Publish approved content to social platforms.

1.  **Postly Integration**
    - Implement `server/services/postly.ts`.
    - Map internal platforms (IG, LinkedIn) to Postly Account IDs.
2.  **Scheduler**
    - Implement a "Runner" that checks for posts with `status: 'scheduled'` and `publish_date <= now()`.
    - Push to Postly API.
3.  **Audit Logging**
    - Record every success/failure in the `logs` table.
    - Update `posts` table status.

---

### Phase 4: Safety & Polish
1.  **Safety Checks**
    - Implement "Forbidden Terms" filter before saving drafts.
    - Enforce character limits.
2.  **Retries**
    - If Postly fails, increment `retry_count` and reschedule for +5 mins.
3.  **Frontend Wiring**
    - Connect "Run Now", "Approve", and "Save" buttons to real backend API endpoints.

## 🗄 Database Schema (Draft)

```typescript
// Campaigns Table
id: serial primary key
name: text
topic: text
schedule_cron: text
rss_urls: text[]
ai_prompt: text
is_active: boolean

// Posts Table
id: serial primary key
campaign_id: integer (fk)
source_title: text
source_url: text
generated_caption: text
image_url: text
status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed'
scheduled_for: timestamp
created_at: timestamp
```

## 🔑 Environment Variables Required
Save these in your Secrets/Environment variables:

```
DATABASE_URL=postgresql://...
NOVITA_API_KEY=...
UNSPLASH_ACCESS_KEY=...
POSTLY_API_KEY=...
```
