# Voice Call Flow

This documents the current working voice-call path for outbound Vapi calls in AIFB.

## Flow

1. A lead is created with `preferred_contact_method = call_under_5_min`.
2. Backend creates a `call_threads` row in `queued` state.
3. `call-dispatcher` picks up queued rows and creates the outbound Vapi call.
4. The `call_threads` row is updated with:
   - `status = initiated`
   - `vapi_call_id`
   - initial `provider_payload`
5. Vapi sends webhook events to `functions/v1/vapi-webhook`.
6. Non-terminal webhook events only update `provider_payload` or in-progress status.
7. A terminal webhook event (`end-of-call-report`, `status=ended`, or payload with `endedAt`) marks the call as completed.
8. Final transcript is stored in `call_threads.transcript`.
9. Transcript analysis runs and writes:
   - `lead_scores`
   - lead summary fields on `leads`
   - RM assignment / follow-up state if applicable

## Tables Involved

- `leads`
- `call_threads`
- `lead_scores`
- `rm_tasks`
- `follow_ups`

## Functions Involved

- `api`
  Public lead creation route and staff lead routes.
- `call-dispatcher`
  Dispatches queued calls and reconciles stale Vapi calls.
- `vapi-webhook`
  Receives Vapi events and persists final call outcomes.

## Auth Model

These functions are intended to be public at the Supabase gateway and enforce auth only in app code where needed:

- `api`
- `call-dispatcher`
- `vapi-webhook`

Public routes under `api/public/*` do not require JWT.
`vapi-webhook` uses `VAPI_WEBHOOK_SECRET`, not Supabase user auth.

## Important Runtime Secrets

- `PROJECT_SUPABASE_URL`
- `PROJECT_SUPABASE_SECRET_KEY`
- `PROJECT_SUPABASE_PUBLISHABLE_KEY`
- `APP_BASE_URL_ADMIN`
- `APP_BASE_URL_RM`
- `GEMINI_API_KEY`
- `VAPI_API_KEY`
- `VAPI_ASSISTANT_ID`
- `VAPI_PHONE_NUMBER_ID`
- `VAPI_CREDENTIAL_ID`
- `VAPI_WEBHOOK_SECRET`

## Fixes Applied

- Redeployed `vapi-webhook` so webhook events reach backend correctly.
- Added stale-call reconciliation in `call-dispatcher` so completed Vapi calls can be backfilled if a webhook is missed.
- Changed webhook processing so only terminal call events trigger transcript analysis.
- Added dedupe protection so the same completed call does not create multiple `lead_scores`.
- Allowed completed calls with empty transcript to persist cleanly without crashing analysis flow.
- Preserved transcript persistence even if analysis fails, with the failure stored in `call_threads.last_error`.

## Expected Healthy Outcome

For a successful voice call:

- `call_threads.status = completed`
- `call_threads.transcript` is populated if Vapi produced one
- `lead_scores` gets one final row for that call
- `leads.final_interest_score`, summary, and next action are updated
- hot leads move to assigned RM flow

## Known Edge Cases

- Vapi may end a call without transcript data. In that case the call is still marked `completed`, but analysis is skipped.
- If model secrets such as `GEMINI_API_KEY` are missing, transcript storage still succeeds but scoring will not run.
