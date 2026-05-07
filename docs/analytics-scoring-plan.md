# Analytics And Scoring Plan

## Goal

Turn transcript analysis into a durable scoring and routing system aligned to the hackathon partner-conversion problem.

## Core Tables

- `analysis_system_contexts`
- `lead_scores`
- `rm_tasks`
- `follow_ups`

## Runtime Flow

1. Transcript completes from chat or call.
2. Active scoring context is loaded from DB.
3. LLM returns structured scoring output.
4. Score is inserted into `lead_scores`.
5. `leads` is updated with latest cached fields.
6. Routing happens:
   - Hot -> RM task
   - Warm -> WhatsApp follow-up record
   - Cold -> no action beyond logging

## Analytics Sources

- Funnel: `leads`, `rm_tasks`, `follow_ups`
- Classification: `lead_scores`
- Language: `lead_scores.detected_language`
- Objections: `lead_scores.objections`
- RM performance: `rm_tasks` plus assigned lead state
