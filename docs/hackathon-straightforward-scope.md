# Hackathon Straightforward Scope

This repo is following the narrow hackathon implementation path, not the broader exhaustive LeadOS MVP docs.

## In Scope

- Lead enters system and chooses chat or call.
- Chat transcript or Vapi call transcript is analyzed after conversation completion.
- Lead is scored on:
  - interest level
  - readiness to sign up
  - network size
- Lead is classified as `hot`, `warm`, or `cold`.
- Hot leads get RM handoff context.
- Warm leads get a WhatsApp deep-link follow-up action.
- Cold leads remain logged for analytics and later review.
- Admin and RM dashboards show funnel, transcript summary, objections, and next action.

## Explicitly Out of Scope For This Slice

- No multi-turn lead memory storage or retrieval.
- No Mem0 use for lead history.
- No automatic WhatsApp API sending.
- No automatic Vapi knowledge-file syncing.
- No tenant/client complexity.
- No broad CRM expansion beyond scoring, routing, analytics, and knowledge docs.

## Channel Rules

- `lead -> call` does not require chat.
- `lead -> chat` does not automatically require call.
- After chat, call can be:
  - manually triggered by admin or RM
  - auto-triggered only when the lead is `hot`
- No blanket chat-to-call duplication.
