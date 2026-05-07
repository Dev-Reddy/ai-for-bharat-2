# LeadOS

LeadOS is a white-label AI lead qualification and conversion system built for financial-services partner acquisition teams. It combines public lead capture, AI chat, AI voice calling, transcript analysis, RM handoff, and admin analytics while keeping client data and company knowledge scoped inside the tenant-controlled stack.

This repo contains:

- `apps/client-website`: public-facing lead capture and self-serve AI chat
- `apps/admin-portal`: admin operations, analytics, knowledge management, contexts, and user/RM management
- `apps/rm-portal`: relationship manager workspace for assigned leads and follow-ups
- `backend/supabase`: database, migrations, and edge functions for chat, calls, scoring, routing, and auth
- `apps/leados-website`: marketing/demo website for the product itself

## Demo Credentials

Use these test accounts for the hosted demo environment:

- Admin
  - Email: `devreddy4444@gmail.com`
  - Password: `Test@123`
- RM
  - Email: `thedevreddy@gmail.com`
  - Password: `Test@123`

## What The Product Does

LeadOS supports two entry points for a lead:

- `Chat now`: a lead submits details, is placed into a public chat thread, and starts talking to the AI immediately
- `Call under 5 min`: a lead submits details, a call thread is queued, and Vapi places an outbound AI call

After chat or call:

- the transcript is analyzed
- the lead is scored on interest, readiness, and network fit
- the lead is classified as `hot`, `warm`, or `cold`
- RM tasks and follow-up suggestions are generated
- admins can review funnel and conversation analytics

Knowledge is admin-controlled:

- admins upload approved business content into the Knowledge Base
- content is synced into Mem0 as reusable memories
- chat and analysis use that approved knowledge during retrieval
- knowledge extraction behavior and analysis behavior are both controlled through active prompt contexts in the admin portal

## Architecture Summary

Core stack:

- Frontend: Next.js (`client-website`, `leados-website`), React + Vite (`admin-portal`, `rm-portal`)
- Backend: Supabase Postgres, Auth, Realtime, Edge Functions
- LLM: Gemini via AI SDK
- Knowledge retrieval: Mem0 shared memory store
- Voice: Vapi outbound calls + webhook events
- Orchestration: application logic inside Supabase edge functions, with LangGraph used inside the lead system module

Key backend functions:

- `functions/v1/api`: public and protected HTTP API
- `functions/v1/call-dispatcher`: picks queued call jobs and initiates Vapi calls
- `functions/v1/vapi-webhook`: receives call status and transcript events from Vapi

Important data tables:

- `users`, `admin_users`, `rm_users`
- `leads`
- `chat_threads`, `messages`
- `call_threads`
- `lead_scores`
- `rm_tasks`
- `follow_ups`
- `knowledge_documents`
- `analysis_system_contexts`
- `knowledge_system_contexts`

## App URLs

Hosted deployments:

- `apps/admin-portal`: `https://aifb-admin-portal.vercel.app/`
- `apps/client-website`: `https://aifb-client-website.vercel.app/`
- `apps/leados-website`: `https://leados-website.vercel.app/`
- `apps/rm-portal`: `https://rm-portal-xi.vercel.app/rm/login`

Default local ports:

- `apps/admin-portal`: `http://localhost:3000`
- `apps/client-website`: `http://localhost:3001`
- `apps/leados-website`: `http://localhost:3002`
- `apps/rm-portal`: Vite default unless overridden, typically `http://localhost:5173`
- Supabase API: `http://127.0.0.1:54321`
- Supabase Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

## Prerequisites

- Node.js 20+
- npm
- Supabase CLI
- A Supabase project
- Gemini API key
- Mem0 API key
- Vapi account with assistant, phone number, credential, and webhook secret

Optional but recommended:

- LangSmith API key for tracing

## Environment Variables

## Frontend Supabase URL/Key (hardcoded vs env)

The frontend apps keep **hardcoded Supabase URL + publishable key** in their `supabase.ts` files because Vercel env injection is known to issues in some deploy flows.

For local development (especially for new devs), you must switch the frontends to **prefer env variables**. 

Run once from repo root:

```bash
npm run use:supabase-env
```

This rewrites:

- `apps/admin-portal/src/lib/supabase.ts` to use `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- `apps/rm-portal/src/lib/supabase.ts` to use `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- `apps/client-website/lib/supabase.ts` to use `process.env.NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 1. Backend

Create `backend/supabase/.env` from [backend/supabase/.env.example](/Users/dev/Desktop/AIFB/backend/supabase/.env.example).

Required variables:

- `PROJECT_SUPABASE_URL`
- `PROJECT_SUPABASE_SECRET_KEY`
- `PROJECT_SUPABASE_PUBLISHABLE_KEY`
- `APP_BASE_URL_ADMIN`
- `APP_BASE_URL_RM`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `MEM0_API_KEY`
- `MEM0_BASE_URL`
- `MEM0_KNOWLEDGE_APP_ID`
- `MEM0_KNOWLEDGE_AGENT_ID`
- `VAPI_API_KEY`
- `VAPI_ASSISTANT_ID`
- `VAPI_PHONE_NUMBER_ID`
- `VAPI_CREDENTIAL_ID`
- `VAPI_WEBHOOK_SECRET`

Tracing variables:

- `LANGSMITH_TRACING`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`
- `LANGSMITH_ENDPOINT`
- `LANGCHAIN_CALLBACKS_BACKGROUND`

### 2. Client Website

Create `apps/client-website/.env.local` from [apps/client-website/.env.example](/Users/dev/Desktop/AIFB/apps/client-website/.env.example).

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 3. Admin Portal

Create `apps/admin-portal/.env.local` or `.env` from [apps/admin-portal/.env.example](/Users/dev/Desktop/AIFB/apps/admin-portal/.env.example).

Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. RM Portal

Create `apps/rm-portal/.env.local` or `.env` from [apps/rm-portal/.env.example](/Users/dev/Desktop/AIFB/apps/rm-portal/.env.example).

Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Setup

### Option A: Run Against A Hosted Supabase Project

Use this if your remote project already contains real auth users and working secrets.

1. Install dependencies in each app:
   - `cd apps/client-website && npm install`
   - `cd apps/admin-portal && npm install`
   - `cd apps/rm-portal && npm install`
   - `cd apps/leados-website && npm install`
2. Fill the frontend env files with the hosted Supabase URL and publishable key.
3. Fill `backend/supabase/.env` with the hosted project URL, service role key, publishable key, Gemini, Mem0, and Vapi credentials.
4. Deploy Supabase migrations and edge functions to that hosted project.
5. Start the frontends locally.

### Option B: Full Local Supabase Development

Use this for backend iteration, but note that local auth users are not seeded automatically in this repo.

1. Start Supabase:

```bash
cd backend/supabase
supabase start
```

2. Apply migrations and seed:

```bash
supabase db reset
```

3. Run `supabase status` and copy the local values for:
   - API URL
   - anon/publishable key
   - service role key

4. Put those local values into:
   - `backend/supabase/.env`
   - `apps/client-website/.env.local`
   - `apps/admin-portal/.env.local`
   - `apps/rm-portal/.env.local`

5. Update backend base URLs in `backend/supabase/.env`:
   - `APP_BASE_URL_ADMIN=https://aifb-admin-portal.vercel.app/`
   - `APP_BASE_URL_RM=https://rm-portal-xi.vercel.app/rm/login`

6. Serve edge functions locally:

```bash
cd backend/supabase
supabase functions serve --env-file .env
```

7. Create at least one admin user and one RM user manually.

Because `seed.sql` is only a placeholder, local auth bootstrap is manual. The simplest flow is:

- create the auth users in Supabase Studio or through the admin auth API
- insert matching rows into `public.users`
- ensure the user has `user_role = 'admin'` or `user_role = 'rm'`
- add the user to `public.admin_users` or `public.rm_users`

The custom access token hook in [backend/supabase/migrations/20260506193000_auth_foundation.sql](/Users/dev/Desktop/AIFB/backend/supabase/migrations/20260506193000_auth_foundation.sql) attaches `user_role` into JWT claims for app authorization.

## Running The Apps

### Admin Portal

```bash
cd apps/admin-portal
npm install
npm run dev
```

### Client Website

```bash
cd apps/client-website
npm install
npm run dev
```

### RM Portal

```bash
cd apps/rm-portal
npm install
npm run dev
```

### Product Marketing Site

```bash
cd apps/leados-website
npm install
npm run dev
```

## Build Commands

### Admin Portal

```bash
cd apps/admin-portal
npm run build
```

### Client Website

```bash
cd apps/client-website
npm run build
```

### RM Portal

```bash
cd apps/rm-portal
npm run build
```

### Product Marketing Site

```bash
cd apps/leados-website
npm run build
```

## Main User Flows

### 1. Public Lead Intake

Entry point: [apps/client-website/components/sections/LeadFormSection.tsx](/Users/dev/Desktop/AIFB/apps/client-website/components/sections/LeadFormSection.tsx)

- lead submits name, phone, language, and preferred contact mode
- system creates a `leads` row
- if `chat_now`, system creates a `chat_threads` row and first assistant greeting
- if `call_under_5_min`, system creates a queued `call_threads` row and starts call dispatch

### 2. Public Chat Flow

Primary files:

- [apps/client-website/components/chat/ChatWindow.tsx](/Users/dev/Desktop/AIFB/apps/client-website/components/chat/ChatWindow.tsx)
- [apps/client-website/services/publicApi.ts](/Users/dev/Desktop/AIFB/apps/client-website/services/publicApi.ts)
- [backend/supabase/functions/_shared/lead-system.ts](/Users/dev/Desktop/AIFB/backend/supabase/functions/_shared/lead-system.ts)

Flow:

- lead is signed in anonymously to Supabase for protected public chat access
- chat history loads from the public API
- messages stream into the UI through Supabase Realtime plus polling fallback
- each lead message is stored
- conversation context is built using retrieved knowledge snippets
- Gemini generates the assistant reply
- transcript is analyzed continuously
- when the conversation is complete, the thread is marked completed and the lead is scored

### 3. Outbound AI Call Flow

Primary files:

- [backend/supabase/functions/call-dispatcher/index.ts](/Users/dev/Desktop/AIFB/backend/supabase/functions/call-dispatcher/index.ts)
- [backend/supabase/functions/vapi-webhook/index.ts](/Users/dev/Desktop/AIFB/backend/supabase/functions/vapi-webhook/index.ts)
- [docs/voice-call-flow.md](/Users/dev/Desktop/AIFB/docs/voice-call-flow.md)

Flow:

- a lead chooses callback or a staff user schedules a call
- a `call_threads` row is queued
- `call-dispatcher` claims due rows and initiates Vapi outbound calls
- Vapi sends status and final transcript events to `vapi-webhook`
- final transcript is stored on `call_threads`
- analysis writes `lead_scores`, updates lead summary fields, and can create RM tasks and follow-ups

### 4. Admin Flow

Primary functions:

- lead management
- conversation review
- analytics dashboard
- knowledge document upload and sync
- analysis context management
- knowledge context management
- admin/RM user management

### 5. RM Flow

Primary functions:

- see assigned leads and hot leads
- review transcript, objections, and scorecard
- use suggested opening line and next action
- open WhatsApp follow-up links
- trigger `Call now`
- rerun analysis when context changes

## Knowledge, Mem0, And Retrieval

Knowledge pipeline:

1. admin uploads approved content into `knowledge_documents`
2. the active knowledge context defines how that content is distilled
3. document content is chunked and synced into Mem0
4. for each lead message, the system rewrites the message into retrieval-focused queries
5. relevant Mem0 memories are fetched
6. those snippets are injected into the assistant/scoring context

Current implementation note:

- Mem0 is used for shared approved business knowledge
- it is not currently used as a long-term per-lead memory store
- lead-level continuity comes from the current thread transcript and generated summaries

## Security And Privacy Model

LeadOS is intended to be sold as a white-label solution, so privacy boundaries matter.

Design choices in this MVP:

- public chat uses anonymous Supabase auth rather than exposing unrestricted write access
- public routes are separated from protected staff routes inside the API function
- admin and RM access is role-based through JWT claims and `public.users`
- company-approved knowledge is centrally managed by admins before being used in retrieval
- lead conversation data, scores, RM tasks, and follow-ups stay inside the project database
- chat and call processing use approved context rather than cross-client shared knowledge

White-label positioning:

- each client can define their own branding
- each client can define their own uploaded knowledge base
- each client can define their own analysis prompt and qualification logic
- the system can preserve user privacy and company privacy by keeping data scoped to that client deployment

## Important Supabase Config Detail

[backend/supabase/config.toml](/Users/dev/Desktop/AIFB/backend/supabase/config.toml) intentionally sets:

- `[functions.api] verify_jwt = false`

Why:

- the `api` function contains both public and protected routes
- public routes such as `/functions/v1/api/public/client-leads` must work without a Supabase user JWT
- protected routes still enforce auth inside handlers via `getAuthContext()`

Do not turn gateway JWT verification back on for `api` unless you redesign the public route strategy.

## Deployment Notes

For hosted Supabase:

1. link the project with Supabase CLI
2. deploy migrations
3. set edge function secrets from `backend/supabase/.env`
4. deploy functions:
   - `api`
   - `call-dispatcher`
   - `vapi-webhook`
5. point frontends to the hosted Supabase URL and publishable key

Typical commands:

```bash
cd backend/supabase
supabase link --project-ref <your-project-ref>
supabase db push
supabase secrets set --env-file .env
supabase functions deploy api
supabase functions deploy call-dispatcher
supabase functions deploy vapi-webhook
```

## Known MVP Constraints

- local `seed.sql` does not bootstrap ready-to-use admin and RM accounts
- Vapi knowledge uploads are still manual in this MVP
- WhatsApp follow-up is a deep-link action, not direct API delivery
- long-term per-lead memory is intentionally deferred
- the admin knowledge UI currently expects pasted document content for reliable ingestion

## Suggested Demo Accounts

For a clean demo environment, prepare:

- `1 admin user`
- `1 rm user`
- `1-2 knowledge documents`
- `1 active analysis context`
- `1 active knowledge context`
- `2-3 sample leads` across hot/warm/cold states

## Useful Reference Docs

- [docs/voice-call-flow.md](/Users/dev/Desktop/AIFB/docs/voice-call-flow.md)
- [docs/analytics-scoring-plan.md](/Users/dev/Desktop/AIFB/docs/analytics-scoring-plan.md)
