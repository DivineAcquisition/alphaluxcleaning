// Cross-channel booking activity — the data behind /admin/activity.
//
// The workspace now runs two booking rails with deliberately different
// plumbing, and ops needs to watch both in one place:
//
//   internal — /admin/internal-booking → book-as-va. GoHighLevel fires
//              the automated comms; OpenPhone is the support line.
//   public   — the online booking interface on the public host.
//              OpenPhone sends every automated SMS, no GHL fallback.
//
// Everything here is queried live from Supabase and bucketed by rail:
// `bookings.source` ('internal_booking' → internal) for bookings and
// anything joined to them, `sms_logs.channel` for outbound texts. Rows
// written before the channel column existed report as unattributed
// rather than being silently counted against the wrong rail.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Several operational tables (sms_logs, ghl_sync_log,
// lead_intro_notifications) are newer than the generated Supabase types.
const db = supabase as any;

export const BOOKING_ACTIVITY_KEY = ['booking-activity'];

export type ActivityChannel = 'internal' | 'public';

export type ActivityKind = 'booking' | 'lead' | 'sms' | 'hcp' | 'ghl';

export type ActivityStatus = 'ok' | 'warn' | 'error' | 'info';

export interface ActivityEvent {
  id: string;
  at: string;
  channel: ActivityChannel | null;
  kind: ActivityKind;
  title: string;
  detail: string;
  status: ActivityStatus;
  amount?: number | null;
}

export interface ChannelStats {
  bookings24h: number;
  bookings7d: number;
  bookings30d: number;
  bookingsTotal: number;
  revenue7d: number;
  revenue30d: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  hcpSynced: number;
  hcpMissing: number;
  smsSent7d: number;
  smsFailed7d: number;
  /** Providers that actually carried this rail's texts in the last 7 days. */
  smsProviders: Record<string, number>;
  lastBookingAt: string | null;
}

export interface BookingActivity {
  internal: ChannelStats;
  public: ChannelStats;
  /** SMS rows written before the channel column existed. */
  unattributedSms7d: number;
  leads7d: number;
  leadIntroFailed: number;
  events: ActivityEvent[];
  /** True when a rail sent on a provider it isn't supposed to use. */
  railWarnings: string[];
}

const DAY = 86_400_000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function emptyStats(): ChannelStats {
  return {
    bookings24h: 0, bookings7d: 0, bookings30d: 0, bookingsTotal: 0,
    revenue7d: 0, revenue30d: 0,
    pending: 0, confirmed: 0, completed: 0, cancelled: 0,
    hcpSynced: 0, hcpMissing: 0,
    smsSent7d: 0, smsFailed7d: 0,
    smsProviders: {},
    lastBookingAt: null,
  };
}

/** Tolerates a missing table/column so one bad query can't blank the page. */
async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

export function channelOfSource(source: string | null | undefined): ActivityChannel {
  return String(source || '').toLowerCase() === 'internal_booking' ? 'internal' : 'public';
}

const CHANNEL_LABEL: Record<ActivityChannel, string> = {
  internal: 'Internal booking',
  public: 'Online booking',
};

/** The provider each rail is supposed to send on. */
const EXPECTED_PROVIDER: Record<ActivityChannel, string> = {
  internal: 'ghl',
  public: 'openphone',
};

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v) || 0;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

async function fetchActivity(): Promise<BookingActivity> {
  const since7 = isoDaysAgo(7);
  const since30 = isoDaysAgo(30);
  const since1 = isoDaysAgo(1);

  const [bookingRows, smsRows, leadRows, hcpRows, ghlRows] = await Promise.all([
    safe(async () => {
      const { data, error } = await db
        .from('bookings')
        .select(
          'id, created_at, service_date, time_slot, full_name, status, source, offer_name, service_type, est_price, hcp_job_id, zip_code',
        )
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    safe(async () => {
      const { data, error } = await db
        .from('sms_logs')
        .select('id, created_at, channel, provider, status, context, to_phone, from_number, error')
        .gte('created_at', since30)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    safe(async () => {
      const { data, error } = await db
        .from('lead_intro_notifications')
        .select('email, created_at, first_name, state_code, intro_sms_status, intro_sms_error, zip_code')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    safe(async () => {
      const { data, error } = await db
        .from('hcp_sync_log')
        .select('id, booking_id, status, last_error, hcp_job_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    safe(async () => {
      const { data, error } = await db
        .from('ghl_sync_log')
        .select('id, booking_id, stage, status, last_error, ghl_contact_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),
  ]);

  const stats: Record<ActivityChannel, ChannelStats> = {
    internal: emptyStats(),
    public: emptyStats(),
  };

  // Booking id → rail, so sync-log rows land in the right column.
  const bookingChannel = new Map<string, ActivityChannel>();
  const bookingName = new Map<string, string>();

  for (const b of bookingRows) {
    const channel = channelOfSource(b.source);
    bookingChannel.set(b.id, channel);
    bookingName.set(b.id, b.full_name || 'Unnamed');
    const s = stats[channel];
    const created = b.created_at || '';
    const price = num(b.est_price);

    s.bookingsTotal += 1;
    if (created >= since1) s.bookings24h += 1;
    if (created >= since7) {
      s.bookings7d += 1;
      if (b.status !== 'cancelled') s.revenue7d += price;
    }
    if (created >= since30) {
      s.bookings30d += 1;
      if (b.status !== 'cancelled') s.revenue30d += price;
    }
    if (b.status === 'pending') s.pending += 1;
    if (b.status === 'confirmed') s.confirmed += 1;
    if (b.status === 'completed') s.completed += 1;
    if (b.status === 'cancelled') s.cancelled += 1;
    if (b.hcp_job_id) s.hcpSynced += 1;
    else if (b.status === 'confirmed' || b.status === 'completed') s.hcpMissing += 1;
    if (!s.lastBookingAt || created > s.lastBookingAt) s.lastBookingAt = created;
  }

  let unattributedSms7d = 0;
  for (const m of smsRows) {
    if ((m.created_at || '') < since7) continue;
    const channel = m.channel === 'internal' || m.channel === 'public'
      ? (m.channel as ActivityChannel)
      : null;
    if (!channel) {
      unattributedSms7d += 1;
      continue;
    }
    const s = stats[channel];
    if (m.status === 'failed') s.smsFailed7d += 1;
    else if (m.status === 'sent' || m.status === 'delivered') {
      s.smsSent7d += 1;
      const provider = m.provider || 'unknown';
      s.smsProviders[provider] = (s.smsProviders[provider] || 0) + 1;
    }
  }

  // A rail sending on the wrong provider is the failure mode that
  // matters here: it means the public funnel texted from an unstaffed
  // GHL number, or an internal booking bypassed the CRM thread.
  const railWarnings: string[] = [];
  (['internal', 'public'] as ActivityChannel[]).forEach((channel) => {
    const expected = EXPECTED_PROVIDER[channel];
    const offenders = Object.entries(stats[channel].smsProviders)
      .filter(([provider]) => provider !== expected);
    for (const [provider, count] of offenders) {
      railWarnings.push(
        `${CHANNEL_LABEL[channel]}: ${count} SMS sent via ${provider} instead of ${expected} in the last 7 days.`,
      );
    }
  });

  // ─── Merged feed ───────────────────────────────────────────────────
  const events: ActivityEvent[] = [];

  for (const b of bookingRows.slice(0, 60)) {
    const channel = channelOfSource(b.source);
    events.push({
      id: `booking-${b.id}`,
      at: b.created_at,
      channel,
      kind: 'booking',
      title: `${CHANNEL_LABEL[channel]} — ${b.full_name || 'Unnamed'}`,
      detail: [
        b.offer_name || b.service_type || 'Cleaning',
        b.service_date ? `for ${b.service_date}` : 'unscheduled',
        b.status,
      ].join(' · '),
      status: b.status === 'cancelled' ? 'warn' : b.status === 'pending' ? 'info' : 'ok',
      amount: b.est_price != null ? num(b.est_price) : null,
    });
  }

  for (const m of smsRows.slice(0, 80)) {
    const channel = m.channel === 'internal' || m.channel === 'public'
      ? (m.channel as ActivityChannel)
      : null;
    const failed = m.status === 'failed';
    events.push({
      id: `sms-${m.id}`,
      at: m.created_at,
      channel,
      kind: 'sms',
      title: `SMS ${m.status} via ${m.provider || 'unknown'}${m.to_phone ? ` → ${m.to_phone}` : ''}`,
      detail: failed
        ? (m.error || 'unknown error')
        : [m.context || 'no context', m.from_number ? `from ${m.from_number}` : null]
            .filter(Boolean).join(' · '),
      status: failed ? 'error' : m.status === 'suppressed' ? 'warn' : 'ok',
    });
  }

  for (const l of leadRows.slice(0, 40)) {
    const failed = String(l.intro_sms_status || '').startsWith('failed');
    events.push({
      id: `lead-${l.email}-${l.created_at}`,
      at: l.created_at,
      channel: 'public',
      kind: 'lead',
      title: `Lead captured — ${l.first_name || l.email}`,
      detail: [
        l.state_code || l.zip_code || 'market unknown',
        `intro SMS ${l.intro_sms_status || 'pending'}`,
      ].join(' · '),
      status: failed ? 'error' : 'info',
    });
  }

  for (const h of hcpRows.slice(0, 40)) {
    const failed = h.status === 'failed';
    events.push({
      id: `hcp-${h.id}-${h.updated_at}`,
      at: h.updated_at,
      channel: bookingChannel.get(h.booking_id) ?? null,
      kind: 'hcp',
      title: `Housecall Pro sync ${h.status}${
        bookingName.has(h.booking_id) ? ` — ${bookingName.get(h.booking_id)}` : ''
      }`,
      detail: failed ? (h.last_error || 'unknown error') : h.hcp_job_id ? `job ${h.hcp_job_id}` : '—',
      status: failed ? 'error' : h.status === 'pending' ? 'info' : 'ok',
    });
  }

  for (const g of ghlRows.slice(0, 40)) {
    const failed = g.status === 'failed';
    events.push({
      id: `ghl-${g.id}-${g.updated_at}`,
      at: g.updated_at,
      channel: g.booking_id ? bookingChannel.get(g.booking_id) ?? null : 'public',
      kind: 'ghl',
      title: `GoHighLevel ${g.stage || 'sync'} ${g.status}${
        g.booking_id && bookingName.has(g.booking_id) ? ` — ${bookingName.get(g.booking_id)}` : ''
      }`,
      detail: failed
        ? (g.last_error || 'unknown error')
        : g.ghl_contact_id ? `contact ${g.ghl_contact_id}` : '—',
      status: failed ? 'error' : g.status === 'pending' ? 'info' : 'ok',
    });
  }

  events.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

  const leads7d = leadRows.filter((l) => (l.created_at || '') >= since7).length;
  const leadIntroFailed = leadRows.filter((l) =>
    String(l.intro_sms_status || '').startsWith('failed'),
  ).length;

  return {
    internal: stats.internal,
    public: stats.public,
    unattributedSms7d,
    leads7d,
    leadIntroFailed,
    events: events.slice(0, 200),
    railWarnings,
  };
}

/** Live cross-channel activity, refreshed on bookings and SMS writes. */
export function useBookingActivity() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: BOOKING_ACTIVITY_KEY,
    queryFn: fetchActivity,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const invalidate = () => qc.invalidateQueries({ queryKey: BOOKING_ACTIVITY_KEY });
    const channel = supabase
      .channel('admin-booking-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, invalidate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_logs' }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export { CHANNEL_LABEL, EXPECTED_PROVIDER, fmtMoney };
