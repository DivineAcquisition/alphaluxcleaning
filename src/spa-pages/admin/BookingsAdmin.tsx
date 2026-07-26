// Bookings — live operational list.
//
// The sidebar previously linked to pages that didn't exist; this is the
// real one. Reads straight from `bookings`, joined to `customers` for
// contact details (bookings has no email column of its own).

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, ExternalLink } from 'lucide-react';

const db = supabase as any;

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
  rescheduled: 'outline',
};

const money = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v)
    ? v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : '—';
};

export default function BookingsAdmin() {
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-bookings', status],
    queryFn: async () => {
      let q = db
        .from('bookings')
        .select(
          'id, created_at, service_date, time_slot, full_name, status, service_type, offer_name, est_price, deposit_amount, balance_due, paid_at, zip_code, hcp_job_id, source, promo_code, special_instructions, customer:customers(email, phone, state, city)',
        )
        .order('created_at', { ascending: false })
        .limit(300);
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data || [];
    return (data || []).filter((b: any) =>
      [
        b.full_name, b.customer?.email, b.customer?.phone, b.zip_code,
        b.offer_name, b.service_type, b.promo_code, b.hcp_job_id,
      ]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const value = rows.reduce((s: number, b: any) => s + (Number(b.est_price) || 0), 0);
    const outstanding = rows
      .filter((b: any) => !b.paid_at)
      .reduce((s: number, b: any) => s + (Number(b.balance_due) || 0), 0);
    return { value, outstanding };
  }, [rows]);

  return (
    <AdminLayout title="Bookings" description="Every booking in the system, live from the database">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search name, email, phone, ZIP, promo, HCP job…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-44">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isLoading ? 'Loading…' : `${rows.length} booking${rows.length === 1 ? '' : 's'}`}
              {!isLoading && rows.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {money(totals.value)} booked · {money(totals.outstanding)} outstanding
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No bookings match this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>HCP job</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="max-w-[220px]">
                          <div className="font-medium truncate">{b.full_name || 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {b.customer?.email || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[b.customer?.city, b.customer?.state, b.zip_code]
                              .filter(Boolean).join(', ') || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{b.offer_name || b.service_type || '—'}</div>
                          {b.promo_code && (
                            <Badge variant="outline" className="mt-1">{b.promo_code}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div>{b.service_date || 'Not scheduled'}</div>
                          <div className="text-xs text-muted-foreground">{b.time_slot || ''}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[b.status] || 'secondary'}>{b.status}</Badge>
                          {b.paid_at && (
                            <div className="text-xs text-muted-foreground mt-1">paid</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {money(b.est_price)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {b.paid_at ? '—' : money(b.balance_due)}
                        </TableCell>
                        <TableCell>
                          {b.hcp_job_id ? (
                            <a
                              className="text-xs inline-flex items-center gap-1 underline"
                              href={`https://pro.housecallpro.com/app/jobs/${b.hcp_job_id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              open <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">not synced</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {b.source || '—'}
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
