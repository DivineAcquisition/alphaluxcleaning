// Leads — speed-to-lead board.
//
// Shows everyone who entered contact details at the top of the booking
// funnel, which market number texted them, whether the intro SMS landed,
// how far they got in the funnel, and whether they eventually booked.
//
// Two live sources: `lead_intro_notifications` (the intro SMS + internal
// alert ledger) and `partial_bookings` (funnel progress).

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw } from 'lucide-react';

const db = supabase as any;

const SMS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  sent: 'default',
  failed: 'destructive',
  skipped_opted_out: 'outline',
  skipped_no_phone: 'secondary',
  skipped_disabled: 'secondary',
};

const FUNNEL_STEPS: Record<string, string> = {
  lead_captured: 'Entered contact info',
  home_size_selected: 'Picked home size',
  offer_selected: 'Picked an offer',
  checkout_started: 'Started checkout',
  completed: 'Booked',
};

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LeadsAdmin() {
  const [search, setSearch] = useState('');

  const intro = useQuery({
    queryKey: ['admin-lead-intros'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lead_intro_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const partials = useQuery({
    queryKey: ['admin-partial-bookings'],
    queryFn: async () => {
      const { data, error } = await db
        .from('partial_bookings')
        .select('id, email, first_name, last_name, phone, zip_code, city, state, last_step, service_type, base_price, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const term = search.trim().toLowerCase();
  const match = (vals: unknown[]) =>
    !term || vals.filter(Boolean).some((v) => String(v).toLowerCase().includes(term));

  const introRows = useMemo(
    () => (intro.data || []).filter((r: any) =>
      match([r.email, r.first_name, r.last_name, r.phone_digits, r.zip_code, r.state_code])),
    [intro.data, term],
  );
  const partialRows = useMemo(
    () => (partials.data || []).filter((r: any) =>
      match([r.email, r.first_name, r.last_name, r.phone, r.zip_code, r.city, r.state])),
    [partials.data, term],
  );

  const stats = useMemo(() => {
    const rows = intro.data || [];
    return {
      total: rows.length,
      sent: rows.filter((r: any) => r.intro_sms_status === 'sent').length,
      failed: rows.filter((r: any) => r.intro_sms_status === 'failed').length,
      converted: rows.filter((r: any) => r.converted_booking_id).length,
    };
  }, [intro.data]);

  const refreshAll = () => { intro.refetch(); partials.refetch(); };
  const busy = intro.isFetching || partials.isFetching;

  return (
    <AdminLayout
      title="Leads"
      description="Speed-to-lead: who came in, which market number texted them, and who booked"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Leads captured" value={stats.total} />
          <Stat label="Intro SMS delivered" value={stats.sent} />
          <Stat label="Intro SMS failed" value={stats.failed} tone={stats.failed ? 'bad' : undefined} />
          <Stat label="Converted to booking" value={stats.converted} />
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search name, email, phone, ZIP, state…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={refreshAll} disabled={busy}>
              <RefreshCw className={`h-4 w-4 mr-1 ${busy ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="intro">
          <TabsList>
            <TabsTrigger value="intro">Intro SMS &amp; alerts</TabsTrigger>
            <TabsTrigger value="funnel">Funnel progress</TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {intro.isLoading ? 'Loading…' : `${introRows.length} lead${introRows.length === 1 ? '' : 's'}`}
                </CardTitle>
                <CardDescription>
                  Each lead is texted once from the OpenPhone number for their state, and the ops
                  mailbox is alerted at the same moment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {intro.isLoading ? (
                  <Skeleton className="h-64" />
                ) : introRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">
                    No leads captured yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Market</TableHead>
                          <TableHead>Texted from</TableHead>
                          <TableHead>Intro SMS</TableHead>
                          <TableHead>Ops alert</TableHead>
                          <TableHead>Booked</TableHead>
                          <TableHead>Captured</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {introRows.map((r: any) => (
                          <TableRow key={r.email}>
                            <TableCell className="max-w-[220px]">
                              <div className="font-medium truncate">
                                {[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                              <div className="text-xs text-muted-foreground">
                                {r.phone_digits || '—'} {r.zip_code ? `· ${r.zip_code}` : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.state_code
                                ? <Badge variant="outline">{r.state_code}</Badge>
                                : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {r.from_number || '—'}
                            </TableCell>
                            <TableCell>
                              {r.intro_sms_status ? (
                                <Badge variant={SMS_VARIANT[r.intro_sms_status] || 'secondary'}>
                                  {r.intro_sms_status}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">pending</span>
                              )}
                              {r.intro_sms_error && (
                                <div className="text-xs text-destructive mt-1 max-w-[260px] truncate"
                                     title={r.intro_sms_error}>
                                  {r.intro_sms_error}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.internal_email_sent_at ? 'sent' : '—'}
                            </TableCell>
                            <TableCell>
                              {r.converted_booking_id
                                ? <Badge>booked</Badge>
                                : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {relTime(r.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {partials.isLoading
                    ? 'Loading…'
                    : `${partialRows.length} in-funnel lead${partialRows.length === 1 ? '' : 's'}`}
                </CardTitle>
                <CardDescription>
                  How far each lead got before stopping — the drop-off point tells you where to
                  follow up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partials.isLoading ? (
                  <Skeleton className="h-64" />
                ) : partialRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">
                    No funnel activity recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Reached</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Quote</TableHead>
                          <TableHead>Last activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partialRows.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="max-w-[220px]">
                              <div className="font-medium truncate">
                                {[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                              <div className="text-xs text-muted-foreground">{r.phone || '—'}</div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {[r.city, r.state, r.zip_code].filter(Boolean).join(', ') || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.last_step === 'completed' ? 'default' : 'secondary'}>
                                {FUNNEL_STEPS[r.last_step] || r.last_step}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{r.service_type || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {r.base_price != null ? `$${Number(r.base_price).toFixed(0)}` : '—'}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {relTime(r.updated_at || r.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'bad' }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${tone === 'bad' ? 'text-destructive' : ''}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
