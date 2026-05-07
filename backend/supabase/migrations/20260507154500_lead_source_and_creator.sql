alter table public.leads
  add column if not exists created_by_user_id uuid references public.users(id) on delete set null;

create index if not exists leads_created_by_user_id_idx on public.leads(created_by_user_id);
