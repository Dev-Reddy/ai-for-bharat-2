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

## Manual / Deferred

- Vapi document sync
- WhatsApp API sending
- lead memory across sessions
