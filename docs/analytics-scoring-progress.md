# Analytics And Scoring Progress

## Completed

- Added schema for scoring contexts, lead scores, RM tasks, and follow-ups.
- Added RLS and admin/RM visibility policies.
- Refactored transcript analysis to use active scoring context.
- Persisted scoring output into `lead_scores`.
- Added routing for Hot and Warm leads.
- Added backend endpoints for:
  - scoring contexts
  - manual rerun
  - analytics
  - follow-ups
  - RM tasks
  - knowledge docs
- Wired admin analytics, settings, lead detail, and knowledge base to real APIs.
- Wired RM lead detail to real analysis and follow-up data.
- Moved analysis context and knowledge context management out of Settings into dedicated admin navigation pages.
- Reworked `api/index.ts` to lazy-load lead and analysis route modules so auth and preflight requests stay healthy even if AI/knowledge modules regress.

## Manual / Deferred

- Vapi document sync
- WhatsApp API sending
- lead memory across sessions

## Incident Notes

### 2026-05-07: `auth-me` preflight failing with `WORKER_ERROR`

- Observed behavior:
  - `POST /auth/v1/token?grant_type=password` succeeded.
  - `OPTIONS /functions/v1/api/auth-me` returned `500`.
  - Browser surfaced this as a CORS error on portal login.
- Actual cause:
  - The `api` function was loading the full lead-analysis dependency graph at startup.
  - A failure in the new Mem0/analysis module chain caused the worker to crash before route handling.
- Resolution:
  - Lazy-import route modules from `api/index.ts` instead of statically importing them at top level.
- Prevention:
  - Keep auth routes and preflight path independent from AI, Mem0, LangGraph, and transcript-analysis modules.
