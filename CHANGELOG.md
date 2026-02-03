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
