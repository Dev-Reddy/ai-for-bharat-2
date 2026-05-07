# Hackathon Gap Analysis

## Already Implemented Before This Slice

- Lead creation.
- Public chat thread flow.
- Outbound call scheduling and Vapi webhook ingestion.
- Transcript storage.
- Basic transcript analysis path.
- Admin and RM portal scaffolding.

## Added In This Slice

- DB-backed scoring system contexts.
- Single active scoring context selection.
- Persistent `lead_scores`.
- Persistent `rm_tasks`.
- Persistent `follow_ups`.
- Analytics endpoints and portal wiring for the hackathon scoring/routing flow.
- Real knowledge document APIs for chat/scoring knowledge ingestion.

## Still Manual / Deferred

- Vapi source-file upload remains manual.
- WhatsApp follow-up remains a deep-link action, not API delivery.
- Lead memory across calls is intentionally deferred.
