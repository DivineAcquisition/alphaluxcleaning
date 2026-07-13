import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Loader2,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Mail,
  MessageSquare,
  Cloud,
  MailOpen,
  MousePointerClick,
  XCircle,
} from 'lucide-react';
import {
  useSalesEngagement,
  type TimeRangeDays,
  type BookingLifecycleRow,
} from '@/hooks/useSalesEngagement';

const RANGES: { label: string; value: TimeRangeDays }[] = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  confirmed: 'secondary',
  pending: 'outline',
  cancelled: 'destructive',
  canceled: 'destructive',
};

function HcpBadge({ status }: { status: BookingLifecycleRow['hcpStatus'] }) {
  const map = {
    success: { label: 'Synced', variant: 'default' as const },
    pending: { label: 'Pending', variant: 'secondary' as const },
    failed: { label: 'Failed', variant: 'destructive' as const },
    not_synced: { label: 'Not synced', variant: 'outline' as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function Dashboard() {
  const [days, setDays] = useState<TimeRangeDays>(30);
  const { kpis, email, sms, hcp, bookings, loading, error, refetch } = useSalesEngagement(days);

  return (
    <AdminLayout title="Sales & Engagement" description="Track every sales component, booking, and message">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Sales &amp; Engagement Command Center</h1>
            <p className="text-muted-foreground">
              Unified view of the booking funnel, revenue, message engagement, and Housecall Pro sync.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setDays(r.value)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    days === r.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Sales funnel KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Leads" value={kpis.leads} sub="Started booking flow" icon={Users} accent="text-blue-500" />
          <StatCard
            title="Bookings"
            value={kpis.totalBookings}
            sub={`${kpis.leadConversionRate}% lead conversion`}
            icon={CalendarCheck}
            accent="text-indigo-500"
          />
          <StatCard
            title="Paid"
            value={kpis.paid}
            sub={`${kpis.paidConversionRate}% of bookings`}
            icon={CheckCircle2}
            accent="text-green-500"
          />
          <StatCard title="Revenue" value={currency(kpis.revenue)} sub={`AOV ${currency(kpis.avgOrderValue)}`} icon={DollarSign} accent="text-emerald-500" />
          <StatCard title="Completed" value={kpis.completed} sub={`${kpis.confirmed} confirmed`} icon={TrendingUp} accent="text-purple-500" />
          <StatCard title="Recurring" value={kpis.recurring} sub={`${kpis.cancelled} cancelled`} icon={RefreshCw} accent="text-orange-500" />
        </div>

        {/* Engagement channels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-blue-500" /> Email (Resend)
              </CardTitle>
              <CardDescription>Delivery &amp; engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{email.sent}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium">{email.delivered}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><MailOpen className="h-3 w-3" /> Open rate</span><span className="font-medium text-blue-600">{email.openRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> Click rate</span><span className="font-medium text-purple-600">{email.clickRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bounced / spam</span><span className="font-medium text-red-600">{email.bounced}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-green-500" /> SMS (OpenPhone)
              </CardTitle>
              <CardDescription>Delivery status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{sms.sent}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium text-green-600">{sms.delivered}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-medium text-red-600">{sms.failed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery rate</span><span className="font-medium">{sms.deliveryRate}%</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud className="h-4 w-4 text-sky-500" /> Housecall Pro Sync
              </CardTitle>
              <CardDescription>Job sync health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Synced</span><span className="font-medium text-green-600">{hcp.synced}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium text-amber-600">{hcp.pending}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-medium text-red-600">{hcp.failed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Not synced</span><span className="font-medium">{hcp.notSynced}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Booking lifecycle table */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Lifecycle</CardTitle>
            <CardDescription>
              Every booking with payment, message engagement, and Housecall Pro sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No bookings in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SMS</TableHead>
                      <TableHead>HCP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.customerName}</div>
                          <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="capitalize">{b.serviceType.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-muted-foreground capitalize">{b.frequency.replace(/_/g, ' ')}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[b.status] || 'outline'} className="capitalize">
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.paymentStatus === 'paid' ? 'default' : 'outline'} className="capitalize">
                            {b.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{currency(b.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {b.emailClicked ? (
                              <MousePointerClick className="h-4 w-4 text-purple-600" aria-label="Clicked" />
                            ) : b.emailOpened ? (
                              <MailOpen className="h-4 w-4 text-blue-600" aria-label="Opened" />
                            ) : (
                              <Mail className="h-4 w-4 text-muted-foreground/40" aria-label="No engagement" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {b.smsStatus === 'delivered' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Delivered" />
                          ) : b.smsStatus === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />
                          ) : b.smsStatus === 'sent' ? (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-label="Sent" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-muted-foreground/30" aria-label="None" />
                          )}
                        </TableCell>
                        <TableCell>
                          <HcpBadge status={b.hcpStatus} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {b.serviceDate
                            ? new Date(b.serviceDate).toLocaleDateString()
                            : new Date(b.createdAt).toLocaleDateString()}
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

export default function SalesEngagementDashboard() {
  return (
    <AdminRoute requiredRole="viewer">
      <Helmet>
        <title>Sales &amp; Engagement - Admin</title>
      </Helmet>
      <Dashboard />
    </AdminRoute>
  );
}
