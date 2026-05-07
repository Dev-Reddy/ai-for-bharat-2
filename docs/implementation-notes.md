# Implementation Notes

## Important Implementation Decisions

- No multi-turn lead memory is stored or retrieved in the current implementation.
- Full transcript plus generated summaries are treated as sufficient for this phase.
- Warm follow-up is a WhatsApp deep-link action visible to admin and RM users.
- Vapi knowledge uploads are manual in this MVP.
- Broader LeadOS docs in this repo remain reference material only; this slice follows the narrower hackathon problem path.

## Knowledge Base Notes

- Admin knowledge documents are stored in `knowledge_documents`.
- Shared knowledge retrieval now runs through Mem0 Platform using admin-uploaded document content.
- `knowledge_chunks` remains in the database from earlier work, but it is no longer the active retrieval path.
- The admin UI currently expects pasted text content for reliable ingestion.
- File attachment in the UI is only a filename hint right now.
- Mem0 is used for shared knowledge only, not for lead history or multi-turn lead memory.
- Mem0 knowledge extraction instructions are managed through admin settings via active knowledge contexts.
- `MEM0_KNOWLEDGE_INSTRUCTIONS` remains only as a fallback when no DB-backed knowledge context exists.

## Supabase Edge Function Notes

- Keep `backend/supabase/functions/api/index.ts` lightweight at module load time.
- Do not statically import heavy route trees that pull in AI, Mem0, LangGraph, or large lead-analysis modules if those routes are not needed for every request.
- `GET /functions/v1/api/auth-me` and `OPTIONS` preflight must stay isolated from the lead-analysis stack.
- The `api` edge function contains both protected and intentionally public routes. Its deploy config must keep `verify_jwt = false`, and protected routes must enforce auth inside handlers with `getAuthContext()` / `requireRole()`.
- Lead and analytics route modules should be lazy-imported inside route branches so a regression in Mem0 or transcript-analysis code does not break portal login.
- A `500 WORKER_ERROR` on `OPTIONS /functions/v1/api/auth-me` is usually a worker startup/import failure, not a real browser CORS policy problem.

### Incident Reference: 2026-05-07 Public Lead Route Auth

- Symptom:
  - `POST /functions/v1/api/public/client-leads` returned `401`.
  - Without `Authorization`, Supabase returned `UNAUTHORIZED_NO_AUTH_HEADER`.
  - With `Authorization: Bearer <publishable-key>` or a secret key in the auth header, Supabase returned `UNAUTHORIZED_INVALID_JWT_FORMAT`.
- Root cause:
  - `handlePublicClientLeadCreate()` is public in application code and does not call `getAuthContext()`.
  - The rejection happened before the handler ran because the deployed `api` function was still using gateway JWT verification.
  - Supabase publishable/service keys are not JWTs, so putting them in the `Authorization` bearer header can never satisfy gateway JWT validation.
- Fix:
  - Set `[functions.api] verify_jwt = false` in `backend/supabase/config.toml`.
  - Leave protected routes on internal auth checks.

### Incident Reference: 2026-05-07

- Symptom:
  - Supabase Auth password login succeeded.
  - `OPTIONS /functions/v1/api/auth-me` returned `500`.
  - Browser showed a CORS error in RM/admin portals.
- Root cause:
  - `api/index.ts` statically imported route modules that transitively loaded `lead-system.ts`.
  - `lead-system.ts` now depends on the Mem0 provider and other analysis modules.
  - A failure in that deeper module graph caused the whole `api` worker to fail before the `OPTIONS` short-circuit ran.
- Fix:
  - Replace static imports of `lead-routes.ts` and `analysis-routes.ts` in `api/index.ts` with lazy `import()` calls inside matching route branches.
- Rule going forward:
  - Authentication and preflight-safe routes must not depend on optional analytics/AI subsystems at startup.

## Operator Notes

- Use the Analysis Contexts page to manage scoring contexts.
- Use the Knowledge Contexts page to manage Mem0 knowledge instructions.
- Only one scoring context can be active globally.
- Use `Rerun Analysis` on a lead when you want to re-score the latest transcript.
- Use `Schedule Call` when chat should be followed by an RM/AI call.
