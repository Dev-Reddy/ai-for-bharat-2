do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role_enum'
  ) then
    create type public.user_role_enum as enum ('admin', 'rm');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  email text unique not null,
  user_role public.user_role_enum not null,
  is_active boolean not null default true,
  avatar_path text
);

alter table if exists public.users
  alter column user_role type public.user_role_enum
  using user_role::text::public.user_role_enum;

alter table if exists public.users
  add column if not exists user_role public.user_role_enum,
  add column if not exists is_active boolean not null default true,
  add column if not exists avatar_path text;

create table if not exists public.admin_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.rm_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.admin_users (user_id)
select id
from public.users
where user_role = 'admin'
on conflict (user_id) do nothing;

insert into public.rm_users (user_id)
select id
from public.users
where user_role = 'rm'
on conflict (user_id) do nothing;

alter table public.users enable row level security;
alter table public.admin_users enable row level security;
alter table public.rm_users enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_select_own'
  ) then
    create policy users_select_own
      on public.users
      for select
      to authenticated
      using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_update_own_profile'
  ) then
    create policy users_update_own_profile
      on public.users
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_users'
      and policyname = 'admin_users_select_own'
  ) then
    create policy admin_users_select_own
      on public.admin_users
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rm_users'
      and policyname = 'rm_users_select_own'
  ) then
    create policy rm_users_select_own
      on public.rm_users
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  app_user_role text;
begin
  claims := event->'claims';

  select user_role::text
  into app_user_role
  from public.users
  where id = (event->>'user_id')::uuid;

  if app_user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(app_user_role));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.users to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
