// Booking Activity — one screen for both booking rails.
//
// The workspace runs two funnels with different comms plumbing, and
// until now each was only observable in pieces (bookings list, email
// logs, HCP sync log, lifecycle page). This page puts them side by side:
//
//   Internal booking — /admin/internal-booking → book-as-va.
//                      GoHighLevel fires the automated comms; the
//                      OpenPhone line for the customer's market is
//                      quoted in the copy as support.
//   Online booking   — the public booking interface. OpenPhone sends
//                      every automated SMS, with no GHL fallback.
//
// The feed below merges bookings, leads, outbound SMS, Housecall Pro
// syncs and GoHighLevel syncs into one timeline, tagged with the rail
// that produced each row so a problem on one funnel is obvious.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useBookingActivity,
  type ActivityChannel,
  type ActivityEvent,
  type ActivityKind,
  type ChannelStats,
} from '@/hooks/useBookingActivity';
import {
  AlertTriangle, ArrowRight, CalendarPlus, Globe, MessageSquare, Plug,
  RefreshCw, UserPlus, Zap,
} from 'lucide-react';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const KIND_LABEL: Record<ActivityKind, string> = {
  booking: 'Booking',
  lead: 'Lead',
  sms: 'SMS',
  hcp: 'Housecall Pro',
  ghl: 'GoHighLevel',
};

const STATUS_VARIANT: Record<
  ActivityEvent['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ok: 'default',
  info: 'secondary',
  warn: 'outline',
  error: 'destructive',
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function StatRow({
  label, value, tone,
}: {
  label: string;
  value: string | number;
  tone?: 'bad';
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${tone === 'bad' ? 'text-destructive' : ''}`}>{value}</span>
    </div>
  );
}

function ChannelCard({
  channel, stats, title, description, icon: Icon, sendsVia, supportVia, bookHref,
}: {
  channel: ActivityChannel;
  stats: ChannelStats;
  title: string;
  description: string;
  icon: React.ElementType;
  sendsVia: string;
  supportVia: string;
  bookHref: string;
}) {
  const providerSummary = Object.entries(stats.smsProviders)
    .map(([provider, count]) => `${provider} ${count}`)
    .join(' · ');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Last 24h</p>
            <p className="text-2xl font-bold">{stats.bookings24h}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
            <p className="text-2xl font-bold">{stats.bookings7d}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booked (7d)</p>
            <p className="text-2xl font-bold">{money(stats.revenue7d)}</p>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <StatRow label="Bookings (30d)" value={stats.bookings30d} />
          <StatRow label="Booked value (30d)" value={money(stats.revenue30d)} />
          <StatRow label="All time" value={stats.bookingsTotal} />
          <StatRow
            label="Status mix"
            value={`${stats.confirmed} confirmed · ${stats.pending} pending · ${stats.completed} done`}
          />
          <StatRow label="Last booking" value={relativeTime(stats.lastBookingAt)} />
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comms rail
          </p>
          <StatRow label="Automated SMS sent by" value={sendsVia} />
          <StatRow label="Support number" value={supportVia} />
          <StatRow label="SMS sent (7d)" value={stats.smsSent7d} />
          <StatRow
            label="SMS failed (7d)" value={stats.smsFailed7d}
            tone={stats.smsFailed7d > 0 ? 'bad' : undefined}
          />
          {providerSummary && <StatRow label="Providers used" value={providerSummary} />}
        </div>

        <div className="space-y-2 border-t pt-3">
          <StatRow label="Jobs in Housecall Pro" value={stats.hcpSynced} />
          <StatRow
            label="Confirmed jobs missing from HCP" value={stats.hcpMissing}
            tone={stats.hcpMissing > 0 ? 'bad' : undefined}
          />
        </div>

        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to={bookHref}>
            {channel === 'internal' ? 'Open internal booking' : 'Open bookings list'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

type ChannelFilter = 'all' | ActivityChannel;
type KindFilter = 'all' | ActivityKind;

export default function ActivityMonitor() {
  const { data, isLoading, isError, error, refetch, isFetching } = useBookingActivity();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  const events = useMemo(() => {
    const all = data?.events || [];
    return all.filter(
      (e) =>
        (channelFilter === 'all' || e.channel === channelFilter) &&
        (kindFilter === 'all' || e.kind === kindFilter),
    );
  }, [data?.events, channelFilter, kindFilter]);

  if (isError) {
    return (
      <AdminLayout title="Booking Activity" description="Internal and online booking, side by side">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Couldn't load activity</AlertTitle>
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
      <AdminLayout title="Booking Activity" description="Internal and online booking, side by side">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Booking Activity"
      description="Every event on both rails — internal (GoHighLevel comms) and online (OpenPhone comms)"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Live from Supabase and refreshed as bookings and texts land.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {data.railWarnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>A rail sent on the wrong provider</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {data.railWarnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <ChannelCard
            channel="internal"
            stats={data.internal}
            title="Internal booking (phone / VA)"
            description="Booked by staff in the workspace. GoHighLevel drives the automations."
            icon={CalendarPlus}
            sendsVia="GoHighLevel"
            supportVia="OpenPhone (state-routed)"
            bookHref="/admin/internal-booking"
          />
          <ChannelCard
            channel="public"
            stats={data.public}
            title="Online booking (public site)"
            description="Self-serve funnel on the public host. OpenPhone sends every automated text."
            icon={Globe}
            sendsVia="OpenPhone (state-routed)"
            supportVia="OpenPhone (state-routed)"
            bookHref="/admin/bookings"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads captured (7d)</p>
                <p className="text-2xl font-bold mt-1">{data.leads7d}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.leadIntroFailed > 0
                    ? `${data.leadIntroFailed} intro SMS failed`
                    : 'All intro texts delivered'}
                </p>
              </div>
              <UserPlus className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unattributed SMS (7d)</p>
                <p className="text-2xl font-bold mt-1">{data.unattributedSms7d}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifecycle and operational sends that belong to neither rail
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Integration shortcuts</p>
                <div className="flex flex-col gap-1 mt-2">
                  <Link className="text-sm underline" to="/admin/integrations/housecall-pro/logs">
                    Housecall Pro sync log
                  </Link>
                  <Link className="text-sm underline" to="/admin/lifecycle">
                    OpenPhone numbers &amp; lifecycle
                  </Link>
                  <Link className="text-sm underline" to="/admin/email/logs">
                    Email delivery log
                  </Link>
                </div>
              </div>
              <Plug className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Activity feed
                </CardTitle>
                <CardDescription>
                  Bookings, leads, outbound texts and integration syncs from both rails.
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">All rails</TabsTrigger>
                    <TabsTrigger value="internal">Internal</TabsTrigger>
                    <TabsTrigger value="public">Online</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">Everything</TabsTrigger>
                    <TabsTrigger value="booking">Bookings</TabsTrigger>
                    <TabsTrigger value="lead">Leads</TabsTrigger>
                    <TabsTrigger value="sms">SMS</TabsTrigger>
                    <TabsTrigger value="hcp">HCP</TabsTrigger>
                    <TabsTrigger value="ghl">GHL</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nothing matches this filter yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">When</TableHead>
                      <TableHead>Rail</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {relativeTime(e.at)}
                        </TableCell>
                        <TableCell>
                          {e.channel ? (
                            <Badge variant={e.channel === 'internal' ? 'default' : 'secondary'}>
                              {e.channel === 'internal' ? 'Internal' : 'Online'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{KIND_LABEL[e.kind]}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[e.status]} className="font-normal">
                            {e.title}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-sm text-muted-foreground break-words">
                          {e.detail}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {e.amount != null ? money(e.amount) : '—'}
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
