-- Create admin tables and policies
create table if not exists public.admin_users (
  user_id uuid primary key,
  email text unique not null,
  role text not null check (role in ('admin','ops','viewer')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz default now()
);

create table if not exists public.admin_allowlist (
  id bigserial primary key,
  email text,
  domain text,
  unique (email, domain)
);

create table if not exists public.admin_audit_logs (
  id bigserial primary key,
  user_id uuid,
  email text,
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.admin_users enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.admin_audit_logs enable row level security;

-- RLS policies
create policy au_rw on public.admin_users for all using (auth.role() = 'service_role');
create policy al_rw on public.admin_allowlist for all using (auth.role() = 'service_role');
create policy aal_rw on public.admin_audit_logs for all using (auth.role() = 'service_role');

-- Add policies for authenticated admin users to view their own data
create policy admin_users_view_own on public.admin_users 
  for select using (auth.uid() = user_id);

create policy admin_audit_view on public.admin_audit_logs 
  for select using (
    user_id = auth.uid() OR 
    exists (
      select 1 from public.admin_users 
      where user_id = auth.uid() 
      and role in ('admin', 'ops')
    )
  );

-- Insert company domain allowlist
insert into public.admin_allowlist (domain) values ('alphaluxclean.com');

-- Create helper function to check admin role
create or replace function public.get_admin_role(_user_id uuid default auth.uid())
returns text
language sql
stable security definer
set search_path = public
as $$
  select role from public.admin_users 
  where user_id = _user_id and status = 'active'
$$;