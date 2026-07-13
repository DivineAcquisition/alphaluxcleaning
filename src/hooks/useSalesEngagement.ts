import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimeRangeDays = 7 | 30 | 90;

export interface SalesFunnelKPIs {
  leads: number;
  totalBookings: number;
  confirmed: number;
  paid: number;
  completed: number;
  cancelled: number;
  recurring: number;
  revenue: number;
  avgOrderValue: number;
  leadConversionRate: number; // bookings / (leads + bookings)
  paidConversionRate: number; // paid / bookings
}

export interface EmailEngagement {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number; // opened / delivered
  clickRate: number; // clicked / delivered
}

export interface SmsEngagement {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number; // delivered / sent
}

export interface HcpHealth {
  synced: number;
  pending: number;
  failed: number;
  notSynced: number;
}

export type HcpRowStatus = 'success' | 'pending' | 'failed' | 'not_synced';

export interface BookingLifecycleRow {
  id: string;
  createdAt: string;
  serviceDate: string | null;
  customerName: string;
  customerEmail: string | null;
  serviceType: string;
  frequency: string;
  status: string;
  paymentStatus: string;
  amount: number;
  isRecurring: boolean;
  source: string | null;
  hcpStatus: HcpRowStatus;
  emailOpened: boolean;
  emailClicked: boolean;
  smsStatus: 'delivered' | 'sent' | 'failed' | 'none';
}

export interface SalesEngagementData {
  kpis: SalesFunnelKPIs;
  email: EmailEngagement;
  sms: SmsEngagement;
  hcp: HcpHealth;
  bookings: BookingLifecycleRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PAID_STATUSES = ['paid', 'deposit_paid', 'fully_paid', 'succeeded', 'authorized'];

function rate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // one decimal percent
}

export function useSalesEngagement(days: TimeRangeDays = 30): SalesEngagementData {
  const [kpis, setKpis] = useState<SalesFunnelKPIs>({
    leads: 0,
    totalBookings: 0,
    confirmed: 0,
    paid: 0,
    completed: 0,
    cancelled: 0,
    recurring: 0,
    revenue: 0,
    avgOrderValue: 0,
    leadConversionRate: 0,
    paidConversionRate: 0,
  });
  const [email, setEmail] = useState<EmailEngagement>({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [sms, setSms] = useState<SmsEngagement>({
    sent: 0,
    delivered: 0,
    failed: 0,
    deliveryRate: 0,
  });
  const [hcp, setHcp] = useState<HcpHealth>({
    synced: 0,
    pending: 0,
    failed: 0,
    notSynced: 0,
  });
  const [bookings, setBookings] = useState<BookingLifecycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [
        bookingsRes,
        leadsRes,
        emailRes,
        smsRes,
        hcpRes,
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select(
            `id, created_at, service_date, service_type, frequency, status, payment_status,
             est_price, is_recurring, source, source_channel, paid_at, hcp_job_id, customer_id, full_name,
             customers ( name, email )`
          )
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('partial_bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since),
        supabase
          .from('email_events')
          .select('event, recipient, created_at')
          .gte('created_at', since)
          .limit(5000),
        supabase
          .from('notification_analytics')
          .select('status, delivery_method, customer_id, created_at')
          .eq('delivery_method', 'sms')
          .gte('created_at', since)
          .limit(5000),
        supabase
          .from('hcp_sync_log')
          .select('booking_id, status')
          .limit(5000),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;

      const bookingRows = bookingsRes.data || [];

      // ----- Email engagement -----
      const emailEvents = emailRes.data || [];
      const openedEmails = new Set<string>();
      const clickedEmails = new Set<string>();
      const emailCounts = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
      for (const ev of emailEvents) {
        const type = (ev.event || '').toLowerCase();
        const recipient = (ev.recipient || '').toLowerCase();
        if (type.includes('deliver')) emailCounts.delivered++;
        else if (type.includes('open')) {
          emailCounts.opened++;
          if (recipient) openedEmails.add(recipient);
        } else if (type.includes('click')) {
          emailCounts.clicked++;
          if (recipient) clickedEmails.add(recipient);
        } else if (type.includes('bounce') || type.includes('complain')) emailCounts.bounced++;
        else if (type.includes('sent')) emailCounts.sent++;
      }
      setEmail({
        ...emailCounts,
        openRate: rate(emailCounts.opened, emailCounts.delivered || emailCounts.sent),
        clickRate: rate(emailCounts.clicked, emailCounts.delivered || emailCounts.sent),
      });

      // ----- SMS engagement -----
      const smsEvents = smsRes.data || [];
      const smsByCustomer = new Map<string, string>();
      const smsCounts = { sent: 0, delivered: 0, failed: 0 };
      for (const ev of smsEvents) {
        const status = (ev.status || '').toLowerCase();
        if (status.includes('deliver')) smsCounts.delivered++;
        else if (status.includes('fail') || status.includes('error') || status.includes('undeliver'))
          smsCounts.failed++;
        else smsCounts.sent++;
        if (ev.customer_id) {
          // Keep the "best" status per customer: delivered > sent > failed
          const current = smsByCustomer.get(ev.customer_id);
          const rank = (s: string) =>
            s.includes('deliver') ? 3 : s.includes('fail') ? 1 : 2;
          if (!current || rank(status) > rank(current)) {
            smsByCustomer.set(ev.customer_id, status);
          }
        }
      }
      setSms({
        ...smsCounts,
        deliveryRate: rate(smsCounts.delivered, smsCounts.sent + smsCounts.delivered + smsCounts.failed),
      });

      // ----- HCP health -----
      const hcpLogs = hcpRes.data || [];
      const hcpByBooking = new Map<string, string>();
      for (const log of hcpLogs) {
        if (log.booking_id) hcpByBooking.set(log.booking_id, (log.status || '').toLowerCase());
      }

      // ----- Booking lifecycle rows + funnel -----
      let confirmed = 0;
      let paid = 0;
      let completed = 0;
      let cancelled = 0;
      let recurring = 0;
      let revenue = 0;
      const hcpCounts = { synced: 0, pending: 0, failed: 0, notSynced: 0 };

      const rows: BookingLifecycleRow[] = bookingRows.map((b: any) => {
        const status = (b.status || 'pending').toLowerCase();
        const paymentStatus = (b.payment_status || '').toLowerCase();
        const isPaid = !!b.paid_at || PAID_STATUSES.includes(paymentStatus);
        const amount = Number(b.est_price) || 0;

        if (status === 'confirmed') confirmed++;
        if (status === 'completed') completed++;
        if (status === 'cancelled' || status === 'canceled') cancelled++;
        if (b.is_recurring) recurring++;
        if (isPaid) {
          paid++;
          revenue += amount;
        }

        // HCP status resolution
        const logStatus = hcpByBooking.get(b.id);
        let hcpStatus: HcpRowStatus;
        if (logStatus === 'success') hcpStatus = 'success';
        else if (logStatus === 'failed') hcpStatus = 'failed';
        else if (logStatus === 'pending') hcpStatus = 'pending';
        else if (b.hcp_job_id) hcpStatus = 'success';
        else hcpStatus = 'not_synced';

        if (hcpStatus === 'success') hcpCounts.synced++;
        else if (hcpStatus === 'pending') hcpCounts.pending++;
        else if (hcpStatus === 'failed') hcpCounts.failed++;
        else hcpCounts.notSynced++;

        const emailLower = (b.customers?.email || '').toLowerCase();
        const emailOpened = emailLower ? openedEmails.has(emailLower) : false;
        const emailClicked = emailLower ? clickedEmails.has(emailLower) : false;

        const smsRaw = b.customer_id ? smsByCustomer.get(b.customer_id) : undefined;
        let smsStatus: BookingLifecycleRow['smsStatus'] = 'none';
        if (smsRaw) {
          if (smsRaw.includes('deliver')) smsStatus = 'delivered';
          else if (smsRaw.includes('fail')) smsStatus = 'failed';
          else smsStatus = 'sent';
        }

        return {
          id: b.id,
          createdAt: b.created_at,
          serviceDate: b.service_date,
          customerName: b.customers?.name || b.full_name || 'Unknown',
          customerEmail: b.customers?.email || null,
          serviceType: b.service_type || 'Cleaning',
          frequency: b.frequency || 'one_time',
          status,
          paymentStatus: isPaid ? 'paid' : paymentStatus || 'unpaid',
          amount,
          isRecurring: !!b.is_recurring,
          source: b.source || b.source_channel || null,
          hcpStatus,
          emailOpened,
          emailClicked,
          smsStatus,
        };
      });

      const leads = leadsRes.count || 0;
      const totalBookings = rows.length;

      setKpis({
        leads,
        totalBookings,
        confirmed,
        paid,
        completed,
        cancelled,
        recurring,
        revenue,
        avgOrderValue: paid ? Math.round(revenue / paid) : 0,
        leadConversionRate: rate(totalBookings, leads + totalBookings),
        paidConversionRate: rate(paid, totalBookings),
      });
      setHcp(hcpCounts);
      setBookings(rows);
    } catch (err: any) {
      console.error('useSalesEngagement error:', err);
      setError(err?.message || 'Failed to load sales & engagement data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('sales-engagement-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        setTimeout(() => fetchAll(), 400);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { kpis, email, sms, hcp, bookings, loading, error, refetch: fetchAll };
}
