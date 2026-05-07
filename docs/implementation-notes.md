# Implementation Notes

## Important Implementation Decisions

- No multi-turn lead memory is stored or retrieved in the current implementation.
- Full transcript plus generated summaries are treated as sufficient for this phase.
- Warm follow-up is a WhatsApp deep-link action visible to admin and RM users.
- Vapi knowledge uploads are manual in this MVP.
- Broader LeadOS docs in this repo remain reference material only; this slice follows the narrower hackathon problem path.

## Knowledge Base Notes

- Admin knowledge documents are stored in `knowledge_documents`.
- Chunked retrieval content is stored in `knowledge_chunks`.
- The admin UI currently expects pasted text content for reliable ingestion.
- File attachment in the UI is only a filename hint right now.

## Operator Notes

- Use the Settings page to manage scoring contexts.
- Only one scoring context can be active globally.
- Use `Rerun Analysis` on a lead when you want to re-score the latest transcript.
- Use `Schedule Call` when chat should be followed by an RM/AI call.
