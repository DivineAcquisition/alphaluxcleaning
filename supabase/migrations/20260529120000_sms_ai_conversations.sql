-- AI SMS conversion agent — per-contact conversation state.
--
-- One row per GHL contact the agent is texting with. `messages` holds
-- the running transcript (array of {role, content, at}) that we replay
-- into the LLM on every inbound SMS so the bot keeps full context.
-- `collected_data` accumulates the booking fields the agent has gathered
-- (service type, home size, zip, date, …) and `conversion_status` tracks
-- the lead down the funnel so admins can measure the agent's close rate.
create table if not exists public.sms_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  ghl_contact_id text not null,
  ghl_conversation_id text,
  location_id text,
  phone text,
  email text,
  first_name text,
  last_name text,
  messages jsonb not null default '[]'::jsonb,
  collected_data jsonb not null default '{}'::jsonb,
  -- new | engaged | qualified | booked | opted_out | lost
  conversion_status text not null default 'new',
  agent_enabled boolean not null default true,
  message_count integer not null default 0,
  booking_id uuid,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sms_ai_conversations_contact_key
  on public.sms_ai_conversations (ghl_contact_id);
create index if not exists sms_ai_conversations_phone_idx
  on public.sms_ai_conversations (phone);
create index if not exists sms_ai_conversations_status_idx
  on public.sms_ai_conversations (conversion_status);
create index if not exists sms_ai_conversations_updated_idx
  on public.sms_ai_conversations (updated_at desc);

alter table public.sms_ai_conversations enable row level security;

-- Lock writes down to service_role only — all reads/writes flow through
-- the ghl-sms-ai-agent edge function which uses the service-role key.
drop policy if exists sms_ai_conversations_service_role_all
  on public.sms_ai_conversations;
create policy sms_ai_conversations_service_role_all
  on public.sms_ai_conversations
  for all
  to service_role
  using (true)
  with check (true);

-- Auto-touch updated_at.
create or replace function public.tg_sms_ai_conversations_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sms_ai_conversations_updated_at
  on public.sms_ai_conversations;
create trigger trg_sms_ai_conversations_updated_at
  before update on public.sms_ai_conversations
  for each row execute function public.tg_sms_ai_conversations_updated_at();
