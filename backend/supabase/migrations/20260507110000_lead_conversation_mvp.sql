create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_source_enum') then
    create type public.lead_source_enum as enum (
      'client_website',
      'admin_manual',
      'rm_manual',
      'chat_followup',
      'call_followup'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'preferred_contact_method_enum') then
    create type public.preferred_contact_method_enum as enum (
      'chat_now',
      'call_under_5_min'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_contact_status_enum') then
    create type public.lead_contact_status_enum as enum (
      'pending',
      'contacted_by_ai',
      'contacted_by_rm'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_progress_status_enum') then
    create type public.lead_progress_status_enum as enum (
      'pending_contact',
      'pending_assignment',
      'assigned',
      'converted'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_interest_enum') then
    create type public.lead_interest_enum as enum (
      'hot',
      'warm',
      'cold'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'chat_thread_status_enum') then
    create type public.chat_thread_status_enum as enum (
      'active',
      'completed',
      'abandoned'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'call_thread_status_enum') then
    create type public.call_thread_status_enum as enum (
      'queued',
      'claiming',
      'initiated',
      'in_progress',
      'completed',
      'failed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'message_actor_type_enum') then
    create type public.message_actor_type_enum as enum (
      'ai',
      'lead',
      'rm',
      'system'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select user_role::text
  from public.users
  where id = auth.uid()
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  public_auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  address text,
  source public.lead_source_enum not null,
  preferred_language text,
  preferred_contact_method public.preferred_contact_method_enum not null,
  assigned_rm_id uuid references public.users(id) on delete set null,
  contact_status public.lead_contact_status_enum not null default 'pending',
  progress_status public.lead_progress_status_enum not null default 'pending_contact',
  call_due_at timestamptz,
  last_contacted_at timestamptz,
  interest_level_score numeric(5, 2),
  readiness_to_signup_score numeric(5, 2),
  network_size_score numeric(5, 2),
  final_interest_score public.lead_interest_enum,
  reason text,
  objections jsonb not null default '[]'::jsonb,
  topics_covered jsonb not null default '[]'::jsonb,
  recommended_next_action text,
  handoff_summary text,
  overall_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  public_auth_user_id uuid references auth.users(id) on delete set null,
  channel_topic text not null unique,
  status public.chat_thread_status_enum not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_type public.message_actor_type_enum not null,
  sender_id text,
  receiver_type public.message_actor_type_enum not null,
  receiver_id text,
  message_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

create table if not exists public.call_threads (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  rm_id uuid references public.users(id) on delete set null,
  vapi_call_id text unique,
  trigger_source public.lead_source_enum not null,
  status public.call_thread_status_enum not null default 'queued',
  requested_at timestamptz not null default now(),
  call_due_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  transcript text,
  provider_payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(3072),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_public_auth_user_id_idx on public.leads(public_auth_user_id);
create index if not exists leads_assigned_rm_id_idx on public.leads(assigned_rm_id);
create index if not exists leads_progress_status_idx on public.leads(progress_status);
create index if not exists leads_final_interest_score_idx on public.leads(final_interest_score);
create index if not exists leads_call_due_at_idx on public.leads(call_due_at);
create index if not exists chat_threads_lead_id_idx on public.chat_threads(lead_id);
create index if not exists messages_thread_id_sent_at_idx on public.messages(thread_id, sent_at);
create index if not exists call_threads_lead_id_idx on public.call_threads(lead_id);
create index if not exists call_threads_status_due_idx on public.call_threads(status, call_due_at);
create index if not exists knowledge_chunks_document_idx on public.knowledge_chunks(document_id, chunk_index);

do $$
begin
  begin
    create index if not exists knowledge_chunks_embedding_hnsw
      on public.knowledge_chunks
      using hnsw (embedding vector_cosine_ops);
  exception when others then
    null;
  end;
end $$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists set_chat_threads_updated_at on public.chat_threads;
create trigger set_chat_threads_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

drop trigger if exists set_call_threads_updated_at on public.call_threads;
create trigger set_call_threads_updated_at
before update on public.call_threads
for each row execute function public.set_updated_at();

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;
create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_knowledge_chunks_updated_at on public.knowledge_chunks;
create trigger set_knowledge_chunks_updated_at
before update on public.knowledge_chunks
for each row execute function public.set_updated_at();

create or replace function public.claim_due_call_threads(limit_count integer default 10)
returns setof public.call_threads
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due_rows as (
    select ct.id
    from public.call_threads ct
    where ct.status = 'queued'
      and ct.call_due_at <= now()
    order by ct.requested_at asc
    for update skip locked
    limit limit_count
  ),
  updated_rows as (
    update public.call_threads ct
    set status = 'claiming',
        updated_at = now()
    from due_rows
    where ct.id = due_rows.id
    returning ct.*
  )
  select * from updated_rows;
end;
$$;

create or replace function public.match_knowledge_chunks(
  query_embedding vector(3072),
  match_count integer default 6
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
set search_path = public
as $$
  select
    kc.id,
    kc.document_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kd.id = kc.document_id
  where kd.is_active = true
    and kc.embedding is not null
  order by kc.embedding <=> query_embedding
  limit greatest(match_count, 1)
$$;

create or replace function public.schedule_call_dispatcher_job()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  functions_base_url text;
  existing_job_id integer;
begin
  functions_base_url := current_setting('app.settings.functions_base_url', true);

  if functions_base_url is null or functions_base_url = '' then
    return;
  end if;

  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'call-dispatcher-every-minute';

  if existing_job_id is not null then
    return;
  end if;

  perform cron.schedule(
    'call-dispatcher-every-minute',
    '* * * * *',
    format(
      $cron$
      select
        net.http_post(
          url := %L,
          headers := '{"Content-Type":"application/json"}'::jsonb,
          body := '{}'::jsonb
        );
      $cron$,
      functions_base_url || '/call-dispatcher'
    )
  );
end;
$$;

create or replace function public.can_access_chat_thread(thread_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_threads ct
    join public.leads l on l.id = ct.lead_id
    where ct.id = thread_uuid
      and (
        public.is_admin_user()
        or l.assigned_rm_id = auth.uid()
        or l.public_auth_user_id = auth.uid()
      )
  )
$$;

create or replace function public.can_access_call_thread(call_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.call_threads ct
    join public.leads l on l.id = ct.lead_id
    where ct.id = call_uuid
      and (
        public.is_admin_user()
        or l.assigned_rm_id = auth.uid()
        or l.public_auth_user_id = auth.uid()
      )
  )
$$;

alter table public.leads enable row level security;
alter table public.chat_threads enable row level security;
alter table public.messages enable row level security;
alter table public.call_threads enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_admin_select'
  ) then
    create policy leads_admin_select
      on public.leads
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_rm_select_assigned'
  ) then
    create policy leads_rm_select_assigned
      on public.leads
      for select
      to authenticated
      using (assigned_rm_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_public_select_own'
  ) then
    create policy leads_public_select_own
      on public.leads
      for select
      to authenticated
      using (public_auth_user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_admin_select'
  ) then
    create policy chat_threads_admin_select
      on public.chat_threads
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_public_or_rm_select'
  ) then
    create policy chat_threads_public_or_rm_select
      on public.chat_threads
      for select
      to authenticated
      using (
        public_auth_user_id = auth.uid()
        or exists (
          select 1
          from public.leads l
          where l.id = lead_id
            and l.assigned_rm_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_select_by_thread_access'
  ) then
    create policy messages_select_by_thread_access
      on public.messages
      for select
      to authenticated
      using (public.can_access_chat_thread(thread_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'call_threads' and policyname = 'call_threads_admin_select'
  ) then
    create policy call_threads_admin_select
      on public.call_threads
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'call_threads' and policyname = 'call_threads_public_or_rm_select'
  ) then
    create policy call_threads_public_or_rm_select
      on public.call_threads
      for select
      to authenticated
      using (public.can_access_call_thread(id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_documents' and policyname = 'knowledge_documents_admin_select'
  ) then
    create policy knowledge_documents_admin_select
      on public.knowledge_documents
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_chunks' and policyname = 'knowledge_chunks_admin_select'
  ) then
    create policy knowledge_chunks_admin_select
      on public.knowledge_chunks
      for select
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

select public.schedule_call_dispatcher_job();
