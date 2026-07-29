// Admin dashboard — live operational overview.
//
// Every figure on this page is queried from Supabase at render time (see
// useAdminMetrics). The previous version mixed real booking counts with
// mock subcontractors, a hardcoded reliability score, and payouts guessed
// at 70% of price; all of that is gone. Field operations live in Housecall
// Pro, so this workspace reports what it actually owns: the funnel,
// revenue, comms rails, and integration health.

import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminMetrics, useRecentBookings } from '@/hooks/useAdminMetrics';
import {
  Activity, CalendarDays, Users, DollarSign, TrendingUp, AlertTriangle, RefreshCw,
  MessageSquare, Mail, Plug, Zap, ArrowRight, UserPlus,
} from 'lucide-react';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
  rescheduled: 'outline',
  recurring_active: 'default',
};

function Kpi({
  label, value, sub, icon: Icon, to,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  to?: string;
}) {
  const body = (
    <Card className={to ? 'transition-colors hover:border-primary/40' : undefined}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminMetrics();
  const { data: recent, isLoading: recentLoading } = useRecentBookings(15);

  if (isError) {
    return (
      <AdminLayout title="Dashboard" description="Live operational overview">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Couldn't load dashboard data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Unknown error'}
            <Button size="sm" variant="outline" className="ml-3" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <AdminLayout title="Dashboard" description="Live operational overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </AdminLayout>
    );
  }

  const { bookings, revenue, customers, funnel, comms, integrations, lifecycle } = data;

  // Alerts are derived from live state — they appear only when something
  // genuinely needs attention.
  const alerts: Array<{ id: string; title: string; body: string; to?: string; cta?: string }> = [];
  if (integrations.bookingsMissingHcp > 0) {
    alerts.push({
      id: 'hcp',
      title: `${integrations.bookingsMissingHcp} booking(s) not in Housecall Pro`,
      body: 'Confirmed or completed bookings without an HCP job. The hourly backfill retries automatically; check the sync log if the count keeps climbing.',
      to: '/admin/integrations/housecall-pro/logs',
      cta: 'Open sync log',
    });
  }
  if (integrations.hcpFailed > 0) {
    alerts.push({
      id: 'hcp-failed',
      title: `${integrations.hcpFailed} failed HCP sync(s)`,
      // The stored error names the real cause (almost always a rejected
      // API key), so show it rather than a generic "sync failed".
      body: integrations.lastHcpError
        ? `Most recent failure: ${integrations.lastHcpError}`
        : 'These jobs never reached Housecall Pro and need a retry.',
      to: '/admin/integrations/housecall-pro/logs',
      cta: 'Review',
    });
  }
  if (funnel.introSmsFailed > 0 || comms.smsFailed7d > 0) {
    alerts.push({
      id: 'sms',
      title: `${funnel.introSmsFailed || comms.smsFailed7d} SMS failure(s)`,
      body: integrations.lastSmsError
        ? `Most recent failure: ${integrations.lastSmsError}`
        : 'Outbound texts are not going out. Usually an OpenPhone credential or number-ownership problem.',
      to: '/admin/leads',
      cta: 'Open leads',
    });
  }
  if (comms.emailsFailed7d > 0) {
    alerts.push({
      id: 'email',
      title: `${comms.emailsFailed7d} email failure(s) this week`,
      body: 'Resend rejected or bounced these sends.',
      to: '/admin/email/logs',
      cta: 'Open email logs',
    });
  }
  if (lifecycle.engineEnabled === false) {
    alerts.push({
      id: 'lifecycle',
      title: 'Lifecycle engine is switched off',
      body: 'Reactivation cadence, offers and campaigns are not sending. Turn it on once the copy has been reviewed.',
      to: '/admin/lifecycle',
      cta: 'Open lifecycle',
    });
  }

  return (
    <AdminLayout title="Dashboard" description="Live operational overview">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            All figures are queried live. Field operations (crews, dispatch, payouts) live in
            Housecall Pro.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/admin/activity">
                <Activity className="h-4 w-4 mr-1" /> Booking activity
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a) => (
              <Alert key={a.id}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{a.title}</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
                  <span>{a.body}</span>
                  {a.to && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={a.to}>{a.cta} <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Jobs today" value={bookings.today}
            sub={`${bookings.upcoming7} in the next 7 days`}
            icon={CalendarDays} to="/admin/bookings"
          />
          <Kpi
            label="Booked revenue (month)" value={money(revenue.bookedThisMonth)}
            sub={`${money(revenue.bookedAllTime)} all time`}
            icon={DollarSign} to="/admin/bookings"
          />
          <Kpi
            label="Outstanding balance" value={money(revenue.outstandingBalance)}
            sub={`Avg booking ${money(revenue.avgBookingValue)}`}
            icon={TrendingUp} to="/admin/bookings"
          />
          <Kpi
            label="Customers" value={customers.total}
            sub={`${customers.active} active · ${customers.lapsed} lapsed`}
            icon={Users} to="/admin/customers"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Funnel &amp; leads
              </CardTitle>
              <CardDescription>Top-of-funnel capture and speed-to-lead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Leads captured (all time)" value={funnel.partialLeads} />
              <Row label="New leads this week" value={funnel.leadsThisWeek} />
              <Row label="Intro SMS delivered" value={funnel.introSmsSent} />
              <Row
                label="Intro SMS failed" value={funnel.introSmsFailed}
                tone={funnel.introSmsFailed > 0 ? 'bad' : undefined}
              />
              <Row label="Leads that became bookings" value={funnel.leadsConverted} />
              <Row
                label="Lead → booking rate"
                value={`${funnel.conversionRate.toFixed(1)}%`}
              />
              <Button asChild size="sm" variant="outline" className="w-full mt-2">
                <Link to="/admin/leads">Open leads</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comms (last 7 days)
              </CardTitle>
              <CardDescription>OpenPhone SMS and Resend email health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="SMS sent" value={comms.smsSent7d} />
              <Row
                label="SMS failed" value={comms.smsFailed7d}
                tone={comms.smsFailed7d > 0 ? 'bad' : undefined}
              />
              <Row label="Emails sent" value={comms.emailsSent7d} />
              <Row
                label="Emails failed" value={comms.emailsFailed7d}
                tone={comms.emailsFailed7d > 0 ? 'bad' : undefined}
              />
              <Row label="SMS opt-outs (STOP)" value={comms.smsOptOuts} />
              <Row label="Email unsubscribes" value={comms.emailOptOuts} />
              <Button asChild size="sm" variant="outline" className="w-full mt-2">
                <Link to="/admin/email/logs">
                  <Mail className="h-3 w-3 mr-1" /> Email logs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plug className="h-4 w-4" /> Integrations
              </CardTitle>
              <CardDescription>Housecall Pro, GoHighLevel, lifecycle engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="HCP jobs synced" value={integrations.hcpSynced} />
              <Row
                label="HCP syncs failed" value={integrations.hcpFailed}
                tone={integrations.hcpFailed > 0 ? 'bad' : undefined}
              />
              <Row
                label="Bookings missing an HCP job" value={integrations.bookingsMissingHcp}
                tone={integrations.bookingsMissingHcp > 0 ? 'bad' : undefined}
              />
              <Row
                label="GHL sync errors" value={integrations.ghlFailed}
                tone={integrations.ghlFailed > 0 ? 'bad' : undefined}
              />
              <Row
                label="Lifecycle engine"
                value={
                  lifecycle.engineEnabled === null
                    ? 'not configured'
                    : lifecycle.engineEnabled ? 'on' : 'off'
                }
              />
              <Row label="Lifecycle sends (7d)" value={lifecycle.sends7d} />
              <Button asChild size="sm" variant="outline" className="w-full mt-2">
                <Link to="/admin/integrations/housecall-pro">
                  <Zap className="h-3 w-3 mr-1" /> Integration settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">Recent bookings</CardTitle>
                <CardDescription>
                  {bookings.total} total · {bookings.pending} pending · {bookings.confirmed} confirmed ·{' '}
                  {bookings.completed} completed
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/bookings">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <Skeleton className="h-48" />
            ) : (recent || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rail</TableHead>
                      <TableHead>Service date</TableHead>
                      <TableHead>Offer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>HCP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recent || []).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.full_name || 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.customer?.email || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.source === 'internal_booking' ? 'default' : 'secondary'}>
                            {b.source === 'internal_booking' ? 'Internal' : 'Online'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {b.service_date || 'Not scheduled'}
                        </TableCell>
                        <TableCell>{b.offer_name || b.service_type || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[b.status] || 'secondary'}>{b.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {b.est_price != null ? money(Number(b.est_price)) : '—'}
                        </TableCell>
                        <TableCell>
                          {b.hcp_job_id
                            ? <Badge variant="outline">synced</Badge>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Row({
  label, value, tone,
}: {
  label: string;
  value: string | number;
  tone?: 'bad';
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${tone === 'bad' ? 'text-destructive' : ''}`}>{value}</span>
    </div>
  );
}
