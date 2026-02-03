# Changelog

All notable changes to SocialFlow Automation are documented in this file.

## [2026-01-23] - Multi-Tenant Auth & Prompt Hierarchy

### Problems Fixed
1. **Prompt hierarchy was missing** - Prompts were only loaded from campaigns, with no global fallback
2. **Image search not working** - Images couldn't be searched because:
   - Campaign had no image providers configured
   - No manual image search option in review page
3. **API keys consumed from owner** - Single API keys meant anyone could use the owner's credits

### Changes Made

#### Authentication & Multi-Tenancy
- Added Replit Auth integration for user login
- Created `user_settings` table for per-user API key storage
- Users now provide their own API keys for:
  - AI provider (base URL, model, API key)
  - Postly publishing
  - Unsplash image search
  - Pexels image search
- Protected settings routes with authentication middleware

#### Prompt Hierarchy (Review → Campaign → Global Settings)
- Added `globalAiPrompt` field to user settings
- Review page now loads prompt in strict order:
  1. **If specific campaign selected**: Campaign AI prompt → Global AI prompt → Default prompt
  2. **If "All Campaigns" selected**: Global AI prompt → Default prompt
- Added "Save to Campaign" button in review page (only shows when prompt is modified and a specific campaign is selected)
- When prompt is edited and saved, it syncs back to the campaign

#### Image Search Improvements
- Added "Search Image" button to review page Image tab
- Added `/api/posts/:id/search-image` endpoint
- Image search now:
  1. First tries to extract OG image from source article
  2. Falls back to configured image providers (Wikimedia, Unsplash, Pexels)
  3. Uses Wikimedia as default if no providers configured (no API key needed)
- Added image error handling for broken image URLs

#### Settings Page Updates
- New settings fields:
  - Global AI Prompt textarea
- Clear explanation that API keys are per-user and encrypted
- Better default values for AI base URL and model name

### Database Changes
- Added `user_settings.global_ai_prompt` column
- Updated campaign #1 with default Wikimedia image provider

### Files Modified
- `shared/schema.ts` - Added globalAiPrompt to userSettings
- `server/storage.ts` - Updated upsertUserSettings
- `server/routes.ts` - Added prompt sync and image search endpoints
- `client/src/pages/settings.tsx` - Added global AI prompt field
- `client/src/pages/review.tsx` - Implemented prompt hierarchy and image search

## [2026-02-03] - Scheduler Reliability & RSS Gating Improvements

### Problems Addressed
1. Scheduler depended on fragile log parsing for RSS gating
2. Auto-publish scheduler chose oldest drafts (not newest)
3. Scheduled posts could not be returned to draft pool
4. Missing `/health` endpoint and Replit dirty files cluttered repo

### Changes Made

#### Scheduler & RSS Fetching
- Added `campaigns.last_rss_fetch_at` to track reliable RSS fetch timestamps
- Scheduler now fetches RSS if last fetch >= 3 hours **or** post pool is empty
- Scheduler selects **newest** drafts for scheduling
- Scheduler updates `lastRssFetchAt` after fetch
- RSS manual fetch also updates `lastRssFetchAt`

#### Post Workflow
- Scheduled posts can be moved back to `draft` (unschedule)

#### Ops/Infrastructure
- Added `/health` endpoint for keepalive
- Updated `.gitignore` with standard Replit dirty files
- Standardized log timestamps to America/Los_Angeles (PST/PDT)
- Google Sheets export timestamps now use America/Los_Angeles (PST/PDT)

#### Scheduler Timezone Consistency Fixes
- Added a shared timezone formatter (`server/services/time.ts`) for scheduler/log timestamps
- Scheduler/pipeline/routes now log scheduled times using the campaign timezone (default America/Los_Angeles)
- Review scheduling logs/toasts and scheduled badges now display times in the campaign timezone
- Log Viewer + Audit Log UI now render timestamps in America/Los_Angeles to match server output

#### RSS Deduplication Improvements
- RSS ingestion now de-dupes per campaign by GUID, source URL, or title (for feeds missing GUIDs)

#### UI Updates
- Replaced Pipeline Status with Post History (campaign + status filters)
- Added pagination to Post History table
- Renamed route to `/post-history` and updated sidebar label
- Removed per-campaign Posts button from campaign cards
- Audit Logs and Log Viewer now show campaign names instead of IDs

#### Timezone + Pipeline Page Fixes
- Added timezone normalization helper to prevent invalid schedule timezones from skewing log messages
- Scheduler, pipeline, and approval routes now resolve timezones before cron parsing/log formatting
- Review page message scheduling now validates timezone and falls back to America/Los_Angeles
- Pipeline Status mock page now delegates to the Post History view so UI reflects real schedule times

#### Campaigns + Post History Fixes
- Added auth credentials to campaign detail and pipeline visualizer fetches so campaigns load consistently
- Updated post history API to return all posts across the user's campaigns (not just drafts)

#### RSS Fetch Reliability
- Updated RSS fetching to follow redirects, apply stronger headers, and parse XML responses directly
- Added content-type validation so non-XML responses are surfaced as feed errors

#### Review Page Fetch Consistency
- Added auth credentials to AI image generation and article clear actions
- Surface RSS fetch errors in the review toast to highlight blocked feeds

#### Image Search Deduping
- Retry multiple image offsets before returning no image when a duplicate URL is encountered

#### AI Image Prompt Tuning
- Default AI image prompts now explicitly avoid human subjects to reduce unwanted people in generated images
- Updated imagePrompt guidance to emphasize object-only still life and nature-only landscapes

#### Navigation Fixes
- Sidebar Post History tab now links to `/post-history` instead of the deprecated `/pipeline`

#### Static Asset Serving Fix
- Production static assets now serve from `dist/public` to prevent 500s on `/` and `/favicon.ico`
