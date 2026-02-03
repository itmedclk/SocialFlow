# Scheduler, RSS Fetch, and Publishing Logic

This document summarizes the current **fetch → schedule → publish** lifecycle and the main decision points.

## 1) RSS Fetch Intake (Draft Pool)
**Source:** `server/services/rss.ts`

- RSS feeds are fetched via `processCampaignFeeds(campaignId, userId)`.
- Each new RSS article is stored as a **post with `status = "draft"`**.
- Duplicate protection is per-campaign and checks **GUID, source URL, or title** (feeds without GUIDs).
- After fetching (if any items fetched), the campaign updates:
  - `lastRssFetchAt = now`

## 2) Scheduler Cycle
**Source:** `server/services/scheduler.ts`

Runs every 5 minutes with a 60s startup delay. Safety:
- minimum 4 minute gap between cycles
- 2 hour scheduling window
- 60 minute grace for late slots

### 2.1 Auto‑Publish Campaigns
If `campaign.autoPublish` is true, the scheduler:
1. Calculates **next cron slot** using `scheduleCron` + `scheduleTimezone`.
2. If the slot is within the 2‑hour window (or <60 min past), it attempts to schedule a post.
3. It **skips** if a post is already scheduled or was recently published near the same slot.

### Draft selection order (newest first)
Scheduler always picks the **newest draft**:
- With generated captions first
- Then newest unprocessed draft

If no drafts exist, the scheduler **fetches RSS** (updating `lastRssFetchAt` when the fetch returns any items) and attempts to schedule the newest new draft.

### 2.2 Manual Campaigns
Manual campaigns do not auto‑schedule; scheduler only fetches RSS using gating rules.

### 2.3 RSS Gating Rules (Option A)
Scheduler will fetch RSS when:
- `lastRssFetchAt` is **>= 3 hours** ago, **OR**
- There are **no draft posts** available in the campaign pool

This prevents idle starvation while avoiding excessive fetching.

## 3) Draft Processing
**Source:** `server/services/pipeline.ts`

Drafts are processed into captions/images when:
- Scheduler calls `processNewPost` (for auto‑publish scheduling)
- User runs manual processing

Auto‑publish scheduling only happens if **`targetScheduledTime`** is passed in.
Otherwise, drafts remain drafts for review.

## 4) Publishing
**Source:** `server/services/pipeline.ts`

- Scheduler runs `publishScheduledPosts()` each cycle.
- Posts with `status = "scheduled"` and `scheduledFor <= now` are published.
- Additional protection:
  - post is re‑loaded to ensure status is still `scheduled`
  - de‑duped per cycle to avoid double publish

## 5) Cancel / Unschedule Behavior
**Source:** `server/routes.ts`

- If a scheduled post is updated to `status = "draft"`, the system **clears `scheduledFor`** and returns it to the draft pool.
- No forced `cancelled` status.

## 6) Cleanup
- Daily cleanup deletes posts with status `posted` older than 30 days.

---

## Known Design Choices
- `America/Los_Angeles` is the default timezone (DST aware) for scheduler/log display.
- Shared formatter lives in `server/services/time.ts` and is used by scheduler, pipeline, routes,
  and Google Sheets logging to ensure consistent timestamps.
- Client log surfaces (Audit Log + Log Viewer) render timestamps in America/Los_Angeles to match
  server logs, while schedule-specific messages are formatted in the campaign timezone.
- Scheduler allows up to **60 minutes late** scheduling before skipping.
- Draft pool is the main “review” pool — no separate save draft flow is required.

If you want this adjusted (e.g., use RSS `pubDate` ordering, fixed PST, or different fetch intervals), note it here.