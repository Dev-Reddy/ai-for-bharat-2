do $$
begin
  if not exists (select 1 from pg_type where typname = 'analysis_source_type_enum') then
    create type public.analysis_source_type_enum as enum ('chat_thread', 'call_thread');
  end if;

  if not exists (select 1 from pg_type where typname = 'rm_task_priority_enum') then
    create type public.rm_task_priority_enum as enum ('high', 'normal', 'low');
  end if;

  if not exists (select 1 from pg_type where typname = 'rm_task_status_enum') then
    create type public.rm_task_status_enum as enum ('pending', 'in_progress', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'follow_up_channel_enum') then
    create type public.follow_up_channel_enum as enum ('whatsapp');
  end if;

  if not exists (select 1 from pg_type where typname = 'follow_up_status_enum') then
    create type public.follow_up_status_enum as enum ('ready', 'opened', 'cancelled');
  end if;
end $$;

alter table public.knowledge_documents
  add column if not exists document_type text not null default 'Guide',
  add column if not exists source_file_name text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.analysis_system_contexts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  prompt_template text not null,
  output_schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists analysis_system_contexts_single_active_idx
  on public.analysis_system_contexts(is_active)
  where is_active = true;

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  source_type public.analysis_source_type_enum not null,
  source_id uuid not null,
  analysis_system_context_id uuid references public.analysis_system_contexts(id) on delete set null,
  classification public.lead_interest_enum not null,
  interest_level_score numeric(5, 2) not null,
  readiness_to_signup_score numeric(5, 2) not null,
  network_size_score numeric(5, 2) not null,
  total_score numeric(5, 2) not null,
  reason text not null,
  detected_language text,
  duration_seconds integer,
  topics_covered jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  recommended_next_action text,
  handoff_summary text,
  overall_summary text,
  suggested_opening_line text,
  raw_model_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_scores_lead_id_created_at_idx
  on public.lead_scores(lead_id, created_at desc);

create table if not exists public.rm_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  lead_score_id uuid not null references public.lead_scores(id) on delete cascade,
  assigned_rm_id uuid references public.users(id) on delete set null,
  priority public.rm_task_priority_enum not null default 'high',
  status public.rm_task_status_enum not null default 'pending',
  recommended_action text not null,
  suggested_opening_line text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rm_tasks_assigned_rm_id_status_idx
  on public.rm_tasks(assigned_rm_id, status, created_at desc);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  lead_score_id uuid not null references public.lead_scores(id) on delete cascade,
  channel public.follow_up_channel_enum not null default 'whatsapp',
  status public.follow_up_status_enum not null default 'ready',
  message text not null,
  wa_me_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists follow_ups_lead_id_status_idx
  on public.follow_ups(lead_id, status, created_at desc);

drop trigger if exists set_analysis_system_contexts_updated_at on public.analysis_system_contexts;
create trigger set_analysis_system_contexts_updated_at
before update on public.analysis_system_contexts
for each row execute function public.set_updated_at();

drop trigger if exists set_rm_tasks_updated_at on public.rm_tasks;
create trigger set_rm_tasks_updated_at
before update on public.rm_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_follow_ups_updated_at on public.follow_ups;
create trigger set_follow_ups_updated_at
before update on public.follow_ups
for each row execute function public.set_updated_at();

alter table public.analysis_system_contexts enable row level security;
alter table public.lead_scores enable row level security;
alter table public.rm_tasks enable row level security;
alter table public.follow_ups enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analysis_system_contexts' and policyname = 'analysis_system_contexts_admin_select'
  ) then
    create policy analysis_system_contexts_admin_select
      on public.analysis_system_contexts
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analysis_system_contexts' and policyname = 'analysis_system_contexts_admin_insert'
  ) then
    create policy analysis_system_contexts_admin_insert
      on public.analysis_system_contexts
      for insert
      to authenticated
      with check (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analysis_system_contexts' and policyname = 'analysis_system_contexts_admin_update'
  ) then
    create policy analysis_system_contexts_admin_update
      on public.analysis_system_contexts
      for update
      to authenticated
      using (public.is_admin_user())
      with check (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lead_scores' and policyname = 'lead_scores_admin_select'
  ) then
    create policy lead_scores_admin_select
      on public.lead_scores
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lead_scores' and policyname = 'lead_scores_rm_select'
  ) then
    create policy lead_scores_rm_select
      on public.lead_scores
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.leads l
          where l.id = lead_id
            and l.assigned_rm_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rm_tasks' and policyname = 'rm_tasks_admin_select'
  ) then
    create policy rm_tasks_admin_select
      on public.rm_tasks
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rm_tasks' and policyname = 'rm_tasks_rm_select'
  ) then
    create policy rm_tasks_rm_select
      on public.rm_tasks
      for select
      to authenticated
      using (assigned_rm_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'follow_ups' and policyname = 'follow_ups_admin_select'
  ) then
    create policy follow_ups_admin_select
      on public.follow_ups
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'follow_ups' and policyname = 'follow_ups_rm_select'
  ) then
    create policy follow_ups_rm_select
      on public.follow_ups
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.leads l
          where l.id = lead_id
            and l.assigned_rm_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_documents' and policyname = 'knowledge_documents_admin_insert'
  ) then
    create policy knowledge_documents_admin_insert
      on public.knowledge_documents
      for insert
      to authenticated
      with check (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_documents' and policyname = 'knowledge_documents_admin_update'
  ) then
    create policy knowledge_documents_admin_update
      on public.knowledge_documents
      for update
      to authenticated
      using (public.is_admin_user())
      with check (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_documents' and policyname = 'knowledge_documents_admin_delete'
  ) then
    create policy knowledge_documents_admin_delete
      on public.knowledge_documents
      for delete
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

insert into public.analysis_system_contexts (
  name,
  description,
  prompt_template,
  output_schema,
  is_active
)
select
  'Default Lead Scoring Context',
  'Straightforward transcript scoring context for AI partner lead conversion.',
  $prompt$
You are the scoring engine for Rupeezy's AI partner lead conversion workflow.

Your job is to evaluate a completed chat or voice transcript and produce a structured lead qualification result.

Business context:
- This is Rupeezy's AP partner program.
- Core approved benefits: zero joining fee, 100 percent brokerage share, daily payouts via RISE Portal, onboarding support, and RM assistance.
- Do not invent unsupported claims.

Score the lead on three dimensions:
1. interest_level_score: 0 to 35
2. readiness_to_signup_score: 0 to 40
3. network_size_score: 0 to 25

Compute total_score as the sum of the three scores.

Classify the lead:
- hot: clear next-step intent and generally total_score >= 70
- warm: interested but needs follow-up, verification, or later callback, generally total_score 40 to 69
- cold: low fit, weak intent, explicit rejection, or total_score < 40

The five core objections are:
- existing_broker
- not_enough_contacts
- client_support_concern
- trust_concern
- call_later

Return valid JSON only using the required schema. Include:
- classification
- interestLevelScore
- readinessToSignupScore
- networkSizeScore
- totalScore
- conversationComplete
- shouldScheduleFollowUpCall
- detectedLanguage
- reason
- topicsCovered
- objections
- recommendedNextAction
- suggestedOpeningLine
- handoffSummary
- overallSummary

Objections must include:
- type
- leadStatement
- status: resolved | partially_resolved | unresolved
- aiResponseSummary

Rules:
- Evaluate only from the transcript and lead profile provided.
- No multi-turn memory assumptions.
- If the transcript is thin, make that explicit in reason and summaries.
- Only recommend follow-up call when the lead is hot.
$prompt$,
  jsonb_build_object(
    'type', 'object',
    'required', jsonb_build_array(
      'conversationComplete',
      'shouldScheduleFollowUpCall',
      'interestLevelScore',
      'readinessToSignupScore',
      'networkSizeScore',
      'totalScore',
      'classification',
      'detectedLanguage',
      'reason',
      'topicsCovered',
      'objections',
      'recommendedNextAction',
      'suggestedOpeningLine',
      'handoffSummary',
      'overallSummary'
    )
  ),
  true
where not exists (
  select 1 from public.analysis_system_contexts
  where name = 'Default Lead Scoring Context'
);
