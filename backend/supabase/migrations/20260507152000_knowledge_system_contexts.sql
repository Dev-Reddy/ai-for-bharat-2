create table if not exists public.knowledge_system_contexts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  prompt_template text not null,
  is_active boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists knowledge_system_contexts_single_active_idx
  on public.knowledge_system_contexts(is_active)
  where is_active = true;

drop trigger if exists set_knowledge_system_contexts_updated_at on public.knowledge_system_contexts;
create trigger set_knowledge_system_contexts_updated_at
before update on public.knowledge_system_contexts
for each row execute function public.set_updated_at();

alter table public.knowledge_system_contexts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_system_contexts' and policyname = 'knowledge_system_contexts_admin_select'
  ) then
    create policy knowledge_system_contexts_admin_select
      on public.knowledge_system_contexts
      for select
      to authenticated
      using (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_system_contexts' and policyname = 'knowledge_system_contexts_admin_insert'
  ) then
    create policy knowledge_system_contexts_admin_insert
      on public.knowledge_system_contexts
      for insert
      to authenticated
      with check (public.is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'knowledge_system_contexts' and policyname = 'knowledge_system_contexts_admin_update'
  ) then
    create policy knowledge_system_contexts_admin_update
      on public.knowledge_system_contexts
      for update
      to authenticated
      using (public.is_admin_user())
      with check (public.is_admin_user());
  end if;
end $$;

insert into public.knowledge_system_contexts (
  name,
  description,
  prompt_template,
  is_active
)
select
  'Default Knowledge Extraction Context',
  'Default prompt for extracting shared Rupeezy knowledge into Mem0.',
  'Extract stable Rupeezy partner-program knowledge as atomic factual memories. Preserve named entities, benefits, support details, eligibility, onboarding details, and objection-handling facts. Do not invent claims.',
  true
where not exists (
  select 1 from public.knowledge_system_contexts
  where name = 'Default Knowledge Extraction Context'
);
