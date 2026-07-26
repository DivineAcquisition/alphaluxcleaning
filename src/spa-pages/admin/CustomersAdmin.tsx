// Customers — live CRM list backed by the lifecycle retention columns.
//
// `/admin/customers` was in the sidebar but had no route or page, so the
// link 404'd. This is the real page: lifecycle stage, the time-since-last-
// booking clock, and booking counts all come from the retention fields
// maintained by database triggers.

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
import { Search, RefreshCw } from 'lucide-react';

const db = supabase as any;

const STAGES = ['all', 'lead', 'active', 'lapsed', 'recurring'] as const;

const STAGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  recurring: 'default',
  lapsed: 'destructive',
  lead: 'secondary',
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export default function CustomersAdmin() {
  const [stage, setStage] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-customers', stage],
    queryFn: async () => {
      let q = db
        .from('customers')
        .select(
          'id, created_at, email, phone, name, first_name, last_name, city, state, postal_code, lifecycle_stage, last_booking_at, next_booking_at, total_bookings, completed_bookings, is_recurring_member',
        )
        .order('last_booking_at', { ascending: false, nullsFirst: false })
        .limit(500);
      if (stage !== 'all') q = q.eq('lifecycle_stage', stage);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data || [];
    return (data || []).filter((c: any) =>
      [c.name, c.first_name, c.last_name, c.email, c.phone, c.city, c.state, c.postal_code]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <AdminLayout
      title="Customers"
      description="Lifecycle stage and booking history, maintained live by database triggers"
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search name, email, phone, city, ZIP…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-44">
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All stages' : s}
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
              {isLoading ? 'Loading…' : `${rows.length} customer${rows.length === 1 ? '' : 's'}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No customers match this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead>Last clean</TableHead>
                      <TableHead>Next clean</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c: any) => {
                      const since = daysSince(c.last_booking_at);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="max-w-[240px]">
                            <div className="font-medium truncate">
                              {c.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                            <div className="text-xs text-muted-foreground">{c.phone || '—'}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {[c.city, c.state, c.postal_code].filter(Boolean).join(', ') || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STAGE_VARIANT[c.lifecycle_stage] || 'secondary'}>
                              {c.lifecycle_stage}
                            </Badge>
                            {c.is_recurring_member && (
                              <Badge variant="outline" className="ml-1">member</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {c.total_bookings ?? 0}
                            <span className="text-xs text-muted-foreground">
                              {' '}({c.completed_bookings ?? 0} done)
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {c.last_booking_at
                              ? `${String(c.last_booking_at).slice(0, 10)} (${since}d ago)`
                              : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {c.next_booking_at ? String(c.next_booking_at).slice(0, 10) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
