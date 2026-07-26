// Live admin metrics — every number here is queried from Supabase.
//
// Replaces the previous dashboard hook, which shipped mock subcontractors,
// a hardcoded 85% "reliability" score, and payouts estimated as
// est_price × 0.7. None of that reflected reality: this deployment has no
// subcontractor or payout tables at all, because field operations live in
// Housecall Pro. What this workspace actually owns is the funnel
// (leads → bookings → revenue), the comms rails, and integration health —
// so that is what the dashboard reports.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Several operational tables (lifecycle_*, sms_*, lead_intro_notifications)
// are newer than the generated Supabase types.
const db = supabase as any;

export const ADMIN_METRICS_KEY = ['admin-metrics'];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Tolerates a missing table/column so one bad query can't blank the page. */
async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

async function countRows(
  table: string,
  build: (q: any) => any = (q) => q,
): Promise<number> {
  return safe(async () => {
    const { count, error } = await build(
      db.from(table).select('id', { count: 'exact', head: true }),
    );
    if (error) throw error;
    return count || 0;
  }, 0);
}

export interface AdminOverview {
  bookings: {
    today: number;
    upcoming7: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    total: number;
    newThisWeek: number;
  };
  revenue: {
    bookedAllTime: number;
    bookedThisMonth: number;
    collectedAllTime: number;
    outstandingBalance: number;
    avgBookingValue: number;
  };
  customers: {
    total: number;
    active: number;
    lapsed: number;
    leads: number;
    recurringMembers: number;
    newThisWeek: number;
  };
  funnel: {
    partialLeads: number;
    leadsThisWeek: number;
    introSmsSent: number;
    introSmsFailed: number;
    leadsConverted: number;
    conversionRate: number;
  };
  comms: {
    emailsSent7d: number;
    emailsFailed7d: number;
    smsSent7d: number;
    smsFailed7d: number;
    smsOptOuts: number;
    emailOptOuts: number;
  };
  integrations: {
    hcpSynced: number;
    hcpFailed: number;
    hcpPending: number;
    bookingsMissingHcp: number;
    ghlFailed: number;
  };
  lifecycle: {
    engineEnabled: boolean | null;
    stepsEnabled: number;
    sends7d: number;
    attributedBookings: number;
  };
}

async function fetchOverview(): Promise<AdminOverview> {
  const today = dateOnly(new Date());
  const in7 = dateOnly(new Date(Date.now() + 7 * 86_400_000));
  const weekAgo = isoDaysAgo(7);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartDate = dateOnly(monthStart);

  const [
    bToday, bUpcoming, bPending, bConfirmed, bCompleted, bCancelled, bTotal, bNewWeek,
    revenueRows,
    custTotal, custNewWeek, custStages,
    partialTotal, partialWeek, leadIntroRows,
    emailSent, emailFailed, smsRows, smsOptOuts, emailOptOuts,
    hcpRows, bookingsMissingHcp, ghlFailed,
    lifecycleSettings, lifecycleSteps, lifecycleSends, lifecycleAttributed,
  ] = await Promise.all([
    countRows('bookings', (q) => q.eq('service_date', today)),
    countRows('bookings', (q) => q.gte('service_date', today).lte('service_date', in7)),
    countRows('bookings', (q) => q.eq('status', 'pending')),
    countRows('bookings', (q) => q.eq('status', 'confirmed')),
    countRows('bookings', (q) => q.eq('status', 'completed')),
    countRows('bookings', (q) => q.eq('status', 'cancelled')),
    countRows('bookings'),
    countRows('bookings', (q) => q.gte('created_at', weekAgo)),

    safe(async () => {
      const { data, error } = await db
        .from('bookings')
        .select('est_price, deposit_amount, balance_due, paid_at, service_date, status, created_at')
        .neq('status', 'cancelled');
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    countRows('customers'),
    countRows('customers', (q) => q.gte('created_at', weekAgo)),
    safe(async () => {
      const { data, error } = await db.from('customers').select('lifecycle_stage, is_recurring_member');
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    countRows('partial_bookings'),
    countRows('partial_bookings', (q) => q.gte('created_at', weekAgo)),
    safe(async () => {
      const { data, error } = await db
        .from('lead_intro_notifications')
        .select('intro_sms_status, converted_booking_id');
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),

    countRows('email_jobs', (q) => q.eq('status', 'sent').gte('created_at', weekAgo)),
    countRows('email_jobs', (q) => q.eq('status', 'failed').gte('created_at', weekAgo)),
    safe(async () => {
      const { data, error } = await db
        .from('sms_logs').select('status').gte('created_at', weekAgo);
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),
    countRows('sms_opt_outs', (q) => q),
    countRows('email_opt_outs', (q) => q),

    safe(async () => {
      const { data, error } = await db.from('hcp_sync_log').select('status');
      if (error) throw error;
      return (data || []) as any[];
    }, [] as any[]),
    countRows('bookings', (q) =>
      q.in('status', ['confirmed', 'completed']).is('hcp_job_id', null)),
    countRows('bookings', (q) => q.not('ghl_sync_error', 'is', null)),

    safe(async () => {
      const { data } = await db.from('lifecycle_settings').select('engine_enabled').eq('id', 1).maybeSingle();
      return data;
    }, null as any),
    countRows('lifecycle_cadence_steps', (q) => q.eq('enabled', true)),
    countRows('lifecycle_sends', (q) => q.eq('status', 'sent').gte('created_at', weekAgo)),
    countRows('lifecycle_sends', (q) => q.not('attributed_booking_id', 'is', null)),
  ]);

  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

  const bookedAllTime = revenueRows.reduce((s, b) => s + num(b.est_price), 0);
  const bookedThisMonth = revenueRows
    .filter((b) => (b.service_date || '') >= monthStartDate)
    .reduce((s, b) => s + num(b.est_price), 0);
  const collectedAllTime = revenueRows
    .filter((b) => b.paid_at)
    .reduce((s, b) => s + (num(b.deposit_amount) || num(b.est_price)), 0);
  const outstandingBalance = revenueRows
    .filter((b) => !b.paid_at)
    .reduce((s, b) => s + num(b.balance_due), 0);

  const stageCount = (stage: string) =>
    custStages.filter((c) => c.lifecycle_stage === stage).length;

  const introSmsSent = leadIntroRows.filter((r) => r.intro_sms_status === 'sent').length;
  const introSmsFailed = leadIntroRows.filter((r) => r.intro_sms_status === 'failed').length;
  const leadsConverted = leadIntroRows.filter((r) => r.converted_booking_id).length;

  const hcpStatus = (s: string) => hcpRows.filter((r) => r.status === s).length;

  return {
    bookings: {
      today: bToday,
      upcoming7: bUpcoming,
      pending: bPending,
      confirmed: bConfirmed,
      completed: bCompleted,
      cancelled: bCancelled,
      total: bTotal,
      newThisWeek: bNewWeek,
    },
    revenue: {
      bookedAllTime,
      bookedThisMonth,
      collectedAllTime,
      outstandingBalance,
      avgBookingValue: revenueRows.length ? bookedAllTime / revenueRows.length : 0,
    },
    customers: {
      total: custTotal,
      active: stageCount('active'),
      lapsed: stageCount('lapsed'),
      leads: stageCount('lead'),
      recurringMembers: custStages.filter((c) => c.is_recurring_member).length,
      newThisWeek: custNewWeek,
    },
    funnel: {
      partialLeads: partialTotal,
      leadsThisWeek: partialWeek,
      introSmsSent,
      introSmsFailed,
      leadsConverted,
      conversionRate: leadIntroRows.length
        ? (leadsConverted / leadIntroRows.length) * 100
        : 0,
    },
    comms: {
      emailsSent7d: emailSent,
      emailsFailed7d: emailFailed,
      smsSent7d: smsRows.filter((r) => r.status === 'sent' || r.status === 'delivered').length,
      smsFailed7d: smsRows.filter((r) => r.status === 'failed').length,
      smsOptOuts,
      emailOptOuts,
    },
    integrations: {
      hcpSynced: hcpStatus('success'),
      hcpFailed: hcpStatus('failed'),
      hcpPending: hcpStatus('pending'),
      bookingsMissingHcp,
      ghlFailed,
    },
    lifecycle: {
      engineEnabled: lifecycleSettings?.engine_enabled ?? null,
      stepsEnabled: lifecycleSteps,
      sends7d: lifecycleSends,
      attributedBookings: lifecycleAttributed,
    },
  };
}

/** Live workspace metrics, refreshed on booking changes. */
export function useAdminMetrics() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ADMIN_METRICS_KEY,
    queryFn: fetchOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        qc.invalidateQueries({ queryKey: ADMIN_METRICS_KEY });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export interface RecentBooking {
  id: string;
  created_at: string;
  service_date: string | null;
  time_slot: string | null;
  full_name: string | null;
  status: string;
  service_type: string | null;
  offer_name: string | null;
  est_price: number | null;
  balance_due: number | null;
  paid_at: string | null;
  zip_code: string | null;
  hcp_job_id: string | null;
  source: string | null;
  customer: { email?: string | null; phone?: string | null; state?: string | null } | null;
}

/** Recent bookings joined to the customer record (bookings has no email column). */
export function useRecentBookings(limit = 25) {
  return useQuery({
    queryKey: ['admin-recent-bookings', limit],
    queryFn: async (): Promise<RecentBooking[]> => {
      const { data, error } = await db
        .from('bookings')
        .select(
          'id, created_at, service_date, time_slot, full_name, status, service_type, offer_name, est_price, balance_due, paid_at, zip_code, hcp_job_id, source, customer:customers(email, phone, state)',
        )
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as RecentBooking[];
    },
    staleTime: 30_000,
  });
}
