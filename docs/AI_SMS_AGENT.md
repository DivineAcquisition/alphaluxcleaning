# AI SMS Conversion Agent (GoHighLevel)

An AI agent that holds a real, two-way SMS conversation with inbound leads
through GoHighLevel and converts them into booked cleanings — qualifying the
lead, quoting an exact price, and creating the booking, all over text.

## How it works

```
Lead texts the business number
        │
        ▼
GHL "Inbound Message" workflow webhook  ──►  POST /functions/v1/ghl-sms-ai-agent
        │
        ▼
Edge function:
  1. Loads/creates the lead's conversation row (sms_ai_conversations)
  2. Replays the full transcript into Claude (Anthropic Messages API,
     claude-sonnet-4-6) with a conversion-focused system prompt
  3. LLM uses tools: calculate_price · check_availability · create_booking
     · update_lead_status · handoff_to_human
  4. Sends the reply back via GHL Conversations API (type=SMS)
  5. Persists transcript + funnel status (new → engaged → qualified → booked)
```

Everything stays inside the contact's GHL conversation, so the human team can
read along and take over at any time (flip the per-contact toggle in the admin
panel, or the bot auto-pauses on a `handoff_to_human`).

## Files

| Piece | Path |
| --- | --- |
| Edge function | `supabase/functions/ghl-sms-ai-agent/index.ts` |
| GHL SMS send + contact lookup | `supabase/functions/_shared/ghl-client.ts` (`sendSms`, `getContact`, `findContactByPhone`) |
| Conversation table | `supabase/migrations/20260529120000_sms_ai_conversations.sql` |
| Admin UI | `src/components/admin/SmsAiAgentDashboard.tsx` (mounted as the **AI SMS** tab in the GHL Integration Dashboard) |

## Required secrets (Supabase Edge Function env)

| Secret | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude (Anthropic Messages API) — powers the conversation. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-sonnet-4-6`. |
| `GHL_PRIVATE_INTEGRATION_TOKEN` | GHL Private Integration token (location-scoped). Falls back to the shared default baked into `ghl-client.ts`. |
| `GHL_LOCATION_ID` | GHL sub-account/location id. Falls back to the shared default. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Provided automatically by Supabase. |

The GHL Private Integration token needs the **Conversations / Messages** and
**Contacts** scopes so it can send SMS and resolve contacts.

## Wire the inbound webhook in GoHighLevel

1. In the GHL sub-account, create a **Workflow** with trigger
   **Customer Replied** → channel **SMS** (or **Conversation → Inbound Message**).
2. Add a **Webhook** action:
   - Method: `POST`
   - URL: `https://yltvknkqnzdeiqckqjha.functions.supabase.co/ghl-sms-ai-agent`
   - Send the contact + message fields. The handler is tolerant of payload
     shapes and looks for `contactId`/`contact.id`, the message text in
     `message`/`body`/`messageBody`/`text`, plus `phone`, `email`,
     `firstName`, `conversationId`, `direction`, `messageType`.
3. (Recommended) Add a filter so the workflow only fires on **inbound** SMS.
   The function also self-guards: it ignores `direction:"outbound"` and
   non-SMS message types to avoid replying to its own messages.

> The function is registered with `verify_jwt = false` in
> `supabase/config.toml` because GHL webhooks don't carry a Supabase JWT.

## Admin actions (used by the dashboard, callable directly)

```jsonc
// Proactively open an SMS thread with a lead
{ "action": "outreach", "phone": "+15125551234", "firstName": "Jane", "email": "jane@email.com" }

// List recent threads + funnel stats
{ "action": "list_conversations", "limit": 100 }

// Read one transcript
{ "action": "get_conversation", "contactId": "<ghlContactId>" }

// Pause/resume the bot for one contact (human takeover)
{ "action": "set_enabled", "contactId": "<ghlContactId>", "enabled": false }

// Sweep + send due follow-ups (driven by pg_cron every 5 min)
{ "action": "run_followups", "limit": 50 }
```

## Conversation framework

The agent's persona + sales methodology live in `buildSystemPrompt()` inside
`supabase/functions/ghl-sms-ai-agent/index.ts`. It's built to:

1. **Sound like a real person texting** — one line per message, contractions,
   no corporate/AI tells, one question at a time, mirrors the lead's energy.
2. **Pull context and use it as leverage** — it reads the whole thread, catches
   the specifics (move-out date, newborn, hosting, pets, "place is trashed"),
   diagnoses the real *why*, reflects it back, and ties value to *their*
   situation. Their why/trigger is persisted as a `context` note in
   `collected_data` so it carries across messages.
3. **Sell value before price** — never leads with a number. Flow: connect &
   discover → build value with the ONE proof point that fits their why → light
   qualify → present price anchored to value → close + handle objections. If a
   lead asks price too early, it gives a soft frame and trades for the 1–2 facts
   it needs to quote.

Real, on-brand value levers it draws from: same trusted team every visit;
bonded/licensed/insured; 24-hour re-clean satisfaction guarantee; eco-friendly
products safe for kids & pets; all supplies included; 40-point Deep Clean by a
2-person team; no contracts / transparent pricing; premium quality.

To tune the voice or the offer framing, edit `buildSystemPrompt()` — that's the
single source of truth for how the agent talks and sells.

## Follow-up cadence

If a lead goes quiet after the agent's last text, a `pg_cron` job (every 5 min)
calls the agent's `run_followups` action and sends a fresh, contextual nudge on
this schedule, then stops:

`30 min → 4 hr → 1 day → 3 days → 7 days → 14 days`

- The cadence **resets** the instant the lead replies.
- It never runs for `booked` / `opted_out` / `lost` threads, after a `STOP`, or
  once a human takes over (agent paused).
- Each nudge is generated by Claude from the full transcript, so it references
  the lead's situation and varies the angle instead of repeating itself.
- Tuning lives in `FOLLOWUP_CADENCE_MIN` (the function) and the cron schedule
  (`supabase/migrations/20260529150000_sms_ai_followups.sql`).

## Latency

Replies target ~5–15s. The large system prompt is split into a cached static
block (`cache_control: ephemeral`) plus a small dynamic context block, and
`max_tokens` is capped at 400 — both cut time-to-first-token, especially on the
second tool-loop call and on follow-up turns within the cache window.

## Behavior notes

- **Opt-out:** inbound `STOP`/`UNSUBSCRIBE`/`CANCEL` etc. immediately marks the
  lead `opted_out`, disables the bot, and sends no reply.
- **Pricing parity:** quotes come from the same price table as
  `chat-create-booking`, so the number the bot quotes is the number written on
  the booking it creates.
- **Bookings:** on a confirmed yes, the agent calls `chat-create-booking`,
  tags the GHL contact `ai-sms-booked`, and flips the thread to `booked`.
- **Handoff:** when a lead asks for a person (or the bot can't help), the
  contact is tagged `ai-sms-handoff` / `needs-human` and the bot pauses.
