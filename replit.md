# SocialFlow Automation

## Overview

SocialFlow is a social media automation platform that converts RSS feed content into AI-generated social media posts. The system fetches articles from configured RSS feeds, uses AI to generate captions and content, applies safety checks, and schedules posts for publishing. It features a React dashboard for managing campaigns, reviewing generated content, monitoring the automation pipeline, and viewing audit logs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables for a clinical teal/slate color scheme
- **Animations**: Framer Motion for pipeline visualization animations

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Build System**: esbuild for server bundling, Vite for client bundling
- **Development**: tsx for TypeScript execution, hot module replacement via Vite

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Storage Pattern**: Repository pattern via `server/storage.ts` abstracting database operations

### Core Data Models
- **Campaigns**: Configuration for automation workflows (RSS URLs, AI prompts, scheduling, target platforms)
- **Posts**: Content items with status tracking (draft → approved → scheduled → posted/failed)
- **Logs**: Audit trail for all system events with severity levels
- **Users**: Replit Auth-based user accounts (id, email, name, profile image)
- **UserSettings**: Per-user API key storage (AI, Postly, Unsplash, Pexels)
- **Sessions**: PostgreSQL-backed session storage for authentication

### Authentication & Multi-Tenancy
- **Replit Auth**: OpenID Connect integration via `server/replit_integrations/auth/`
- **Per-user API keys**: Each user provides their own API keys stored in `user_settings` table
- **Protected routes**: Use `isAuthenticated` middleware for authenticated endpoints
- **Session management**: PostgreSQL session store with 7-day TTL

### Background Processing
- **RSS Service**: `server/services/rss.ts` handles feed fetching with rss-parser, deduplication via source GUID
- **AI Service**: `server/services/ai.ts` integrates with OpenAI-compatible APIs (Novita AI, DeepSeek) for caption generation
- **Image Service**: `server/services/images.ts` searches Unsplash, Pexels, Wikimedia for stock images
- **Pipeline**: `server/services/pipeline.ts` orchestrates content generation with 3-retry logic and safety validation
- **Postly Service**: `server/services/postly.ts` publishes to social media platforms
- **Smart Scheduler**: `server/services/scheduler.ts` runs efficient background jobs:
  - Single check cycle every 5 minutes
  - RSS fetch only once per hour per campaign
  - Prepares only posts scheduled within next 30 minutes
  - Maximum 2 posts prepared per cycle for scalability

### Key Design Decisions
1. **Shared Schema**: TypeScript types are derived from Drizzle schema, ensuring type safety between frontend and backend
2. **Zod Validation**: Insert schemas auto-generated from Drizzle for API request validation
3. **Static Serving**: Production builds serve frontend from `dist/public`, development uses Vite middleware
4. **Path Aliases**: `@/` maps to client src, `@shared/` to shared code for clean imports

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Third-Party Services (Planned/Configured)
- **Novita AI**: OpenAI-compatible API for content generation (integration pending)
- **Image Providers**: Configurable per campaign for sourcing post images
- **Social Media Platforms**: Target platforms configurable per campaign (Instagram, etc.)

### Key NPM Packages
- **rss-parser**: RSS/Atom feed parsing
- **express-session + connect-pg-simple**: Session management with PostgreSQL storage
- **date-fns**: Date manipulation
- **zod**: Runtime validation
- **framer-motion**: UI animations