# FundFlow AI

## Overview

FundFlow AI is an institutional-grade mutual fund research and simulation platform. It provides fund discovery, portfolio simulation, and AI-powered advisory features for serious investors. The platform combines a React frontend with an Express backend, using PostgreSQL for data persistence and OpenAI for AI chat/advisory capabilities.

Key features:
- **Fund Explorer**: Browse and search mutual funds with filtering by category, risk level, and ratings
- **Portfolio Simulator**: Build simulated portfolios, adjust allocations, and project future returns
- **AI Advisor**: Chat-based AI financial advisor with streaming responses (SSE)
- **Voice Chat**: Audio recording and streaming playback integration for voice-based AI interaction

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming, custom fintech color palette (blue primary, green accent). Two custom fonts: "Outfit" for display and "DM Sans" for body text
- **Charts**: Recharts for financial data visualization (NAV history, portfolio projections, pie charts)
- **Animations**: Framer Motion for page transitions and interactive elements
- **Layout**: Sidebar-based layout with responsive mobile support (hamburger menu via Sheet component)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Pages
- `/` — Home (Fund Explorer with search, category/risk filters, fund cards grid)
- `/funds/:id` — Fund Detail (NAV chart, metrics, risk analysis, add-to-portfolio)
- `/simulator` — Portfolio Simulator (allocation sliders, projection charts, pie chart breakdown)
- `/advisor` — AI Chat Advisor (conversation sidebar, streaming chat interface)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Build**: Custom build script using Vite for client and esbuild for server, outputting to `dist/`
- **Development**: Vite dev server with HMR proxied through Express middleware
- **Static serving**: In production, Express serves the built client from `dist/public/`

### API Endpoints
- `GET /api/funds` — List funds with optional search/category/risk/rating filters
- `GET /api/funds/:id` — Get single fund details
- `GET /api/portfolios/:id` — Get portfolio with items (auto-creates portfolio 1 for MVP)
- `POST /api/portfolios/:id/items` — Add fund to portfolio
- `PUT /api/portfolios/:id/items/:itemId` — Update portfolio item allocation
- `DELETE /api/portfolios/:id/items/:itemId` — Remove portfolio item
- `POST /api/portfolios/:id/simulate` — Run portfolio projection simulation
- `GET /api/conversations` — List AI chat conversations
- `GET /api/conversations/:id` — Get conversation with messages
- `POST /api/conversations` — Create new conversation
- `DELETE /api/conversations/:id` — Delete conversation
- `POST /api/conversations/:id/messages` — Send message with SSE streaming response

### Shared Layer (`shared/`)
- **Schema** (`shared/schema.ts`): Drizzle ORM table definitions for funds, portfolios, portfolio_items, conversations, and messages
- **Routes** (`shared/routes.ts`): API contract definitions with Zod schemas for input validation and response types, shared between client and server
- **Models** (`shared/models/chat.ts`): Chat-specific table definitions and types

### Database
- **Database**: PostgreSQL via `node-postgres` (pg) pool
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Schema location**: `shared/schema.ts`
- **Connection**: Via `DATABASE_URL` environment variable (required)
- **Session storage**: `connect-pg-simple` available for session management

### AI Integration (Replit Integrations)
- **Chat**: OpenAI-compatible API via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Streaming**: Server-Sent Events (SSE) for real-time chat responses
- **Voice**: Audio recording (WebM/Opus), transcription (speech-to-text), and text-to-speech with AudioWorklet playback
- **Image**: Image generation via `gpt-image-1` model
- **Batch**: Utility for rate-limited batch processing with retries

### Data Seeding
- Fund data is seeded on server startup via `storage.seedFunds()` to populate the funds table with sample mutual fund data

## External Dependencies

### Required Services
- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **OpenAI API** (via Replit AI Integrations): Powers the AI Advisor chat. Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables

### Key NPM Packages
- **Frontend**: react, wouter, @tanstack/react-query, recharts, framer-motion, shadcn/ui (Radix UI primitives), tailwindcss, embla-carousel-react, date-fns, react-hook-form, zod
- **Backend**: express, drizzle-orm, drizzle-kit, pg, openai, connect-pg-simple, express-session, nanoid, zod
- **Build tools**: vite, esbuild, tsx, typescript, @vitejs/plugin-react
- **Replit-specific**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner