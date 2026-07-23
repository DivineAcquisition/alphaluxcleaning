// Lifecycle SMS + Email Engine — admin workspace.
//
// Cadence editor, offer manager, campaign composer, state-number +
// opt-out management, engine settings (quiet hours / frequency cap),
// and per-step / per-offer / per-campaign attribution analytics.
//
// Data lives in the lifecycle_* tables (see the lifecycle_engine
// migration); sends are executed by the `lifecycle-engine` edge
// function on a pg_cron schedule.

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Play, Ban, Send, RefreshCw } from 'lucide-react';

// The lifecycle tables are newer than the generated Supabase types.
const db = supabase as any;

const AUDIENCES = [
  { value: 'new_0_30', label: 'New customers (0–30 days)' },
  { value: 'lapsed_31_90', label: 'Recent lapsed (31–90 days)' },
  { value: 'lapsed_90_plus', label: 'Long lapsed (90+ days)' },
  { value: 'active', label: 'Active customers' },
  { value: 'recurring_members', label: 'Recurring members' },
  { value: 'all', label: 'Everyone' },
];

const TRACK_LABELS: Record<string, string> = {
  reactivation: 'Reactivation',
  recurring_conversion: 'Recurring conversion',
  loyalty: 'Loyalty (members)',
};

function useInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

// ---------------------------------------------------------------------------
// Cadence editor
// ---------------------------------------------------------------------------

function CadenceTab() {
  const invalidate = useInvalidate();
  const { data: steps, isLoading } = useQuery({
    queryKey: ['lifecycle-steps'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lifecycle_cadence_steps').select('*').order('sort_order');
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: stats } = useQuery({
    queryKey: ['lifecycle-step-stats'],
    queryFn: async () => {
      const { data, error } = await db.from('lifecycle_step_stats').select('*');
      if (error) throw error;
      return data as any[];
    },
  });

  const [edits, setEdits] = useState<Record<string, any>>({});
  const edit = (id: string, field: string, value: any) =>
    setEdits((p) => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
  const merged = (step: any) => ({ ...step, ...(edits[step.id] || {}) });

  const save = useMutation({
    mutationFn: async (step: any) => {
      const patch = edits[step.id];
      if (!patch) return;
      const update: any = { ...patch, updated_at: new Date().toISOString() };
      if (update.incentive_description !== undefined) {
        update.incentive = { ...(step.incentive || {}), description: update.incentive_description };
        delete update.incentive_description;
      }
      if (update.day_offset !== undefined) update.day_offset = Number(update.day_offset);
      const { error } = await db.from('lifecycle_cadence_steps').update(update).eq('id', step.id);
      if (error) throw error;
    },
    onSuccess: (_d, step: any) => {
      setEdits((p) => { const n = { ...p }; delete n[step.id]; return n; });
      invalidate(['lifecycle-steps', 'lifecycle-step-stats']);
      toast.success('Step saved');
    },
    onError: (e: Error) => toast.error('Save failed: ' + e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await db.from('lifecycle_cadence_steps').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(['lifecycle-steps', 'lifecycle-step-stats']),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading cadence…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Steps fire from each customer's <strong>time since last booking</strong>. Customers who
        rebook fall out automatically; recurring members only get the loyalty track. Placeholders:{' '}
        <code>{'{{first_name}} {{last_service_type}} {{days_since}} {{last_clean_date}} {{completed_cleans}} {{booking_link}} {{incentive_text}}'}</code>
      </p>
      {(steps || []).map((raw) => {
        const step = merged(raw);
        const stat = (stats || []).find((s) => s.id === raw.id);
        const dirty = Boolean(edits[raw.id]);
        return (
          <Card key={raw.id} className={raw.enabled ? '' : 'opacity-60'}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={raw.enabled}
                    onCheckedChange={(enabled) => toggle.mutate({ id: raw.id, enabled })}
                  />
                  <CardTitle className="text-base">{step.name}</CardTitle>
                  <Badge variant="outline">{TRACK_LABELS[step.track] || step.track}</Badge>
                  <Badge variant="secondary">{step.channel.toUpperCase()}</Badge>
                </div>
                {stat && (
                  <div className="text-xs text-muted-foreground">
                    {stat.sends} sent · {stat.replies} replies · {stat.attributed_bookings} bookings ·{' '}
                    {stat.attributed_recurring} recurring signups
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Day (after last clean)</Label>
                  <Input
                    type="number" min={0} value={step.day_offset}
                    onChange={(e) => edit(raw.id, 'day_offset', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={step.channel} onValueChange={(v) => edit(raw.id, 'channel', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Incentive (from company margin — never cleaner pay)</Label>
                  <Input
                    placeholder="e.g. a $25 credit on your first recurring visit"
                    value={
                      edits[raw.id]?.incentive_description ?? raw.incentive?.description ?? ''
                    }
                    onChange={(e) => edit(raw.id, 'incentive_description', e.target.value)}
                  />
                </div>
              </div>
              {(step.channel === 'sms' || step.channel === 'both') && (
                <div>
                  <Label>SMS copy (STOP footer added automatically)</Label>
                  <Textarea
                    rows={2} value={step.sms_body || ''}
                    onChange={(e) => edit(raw.id, 'sms_body', e.target.value)}
                  />
                </div>
              )}
              {(step.channel === 'email' || step.channel === 'both') && (
                <>
                  <div>
                    <Label>Email subject</Label>
                    <Input
                      value={step.email_subject || ''}
                      onChange={(e) => edit(raw.id, 'email_subject', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email body (HTML — wrapped in the branded shell + unsubscribe footer)</Label>
                    <Textarea
                      rows={4} value={step.email_body || ''}
                      onChange={(e) => edit(raw.id, 'email_body', e.target.value)}
                    />
                  </div>
                </>
              )}
              {dirty && (
                <div>
                  <Button size="sm" onClick={() => save.mutate(raw)} disabled={save.isPending}>
                    Save step
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

const EMPTY_OFFER = {
  name: '', audience: 'lapsed_31_90', channel: 'both',
  sms_body: '', email_subject: '', email_body: '',
  incentive_description: '', ends_at: '',
};

function OffersTab() {
  const invalidate = useInvalidate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_OFFER);

  const { data: offers } = useQuery({
    queryKey: ['lifecycle-offers'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lifecycle_offer_stats').select('*').order('starts_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error('Name required');
      const row: any = {
        name: form.name,
        audience: form.audience,
        channel: form.channel,
        sms_body: form.sms_body || null,
        email_subject: form.email_subject || null,
        email_body: form.email_body || null,
        incentive: form.incentive_description ? { description: form.incentive_description } : {},
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        status: 'draft',
      };
      const { error } = await db.from('lifecycle_offers').insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(['lifecycle-offers']);
      setShowForm(false);
      setForm(EMPTY_OFFER);
      toast.success('Offer created (draft) — activate it to start sending');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('lifecycle_offers')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(['lifecycle-offers']),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Offers trickle out to their audience on each engine run (deduped per customer),
          honoring opt-outs, quiet hours, and the frequency cap. Expiring offers stop
          automatically at the end date.
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> New offer
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New offer</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Incentive (company margin)</Label>
                <Input
                  placeholder="e.g. $30 off your next deep clean"
                  value={form.incentive_description}
                  onChange={(e) => setForm({ ...form, incentive_description: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Expires (optional)</Label>
                <Input
                  type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>
            {(form.channel === 'sms' || form.channel === 'both') && (
              <div>
                <Label>SMS copy</Label>
                <Textarea rows={2} value={form.sms_body}
                  onChange={(e) => setForm({ ...form, sms_body: e.target.value })} />
              </div>
            )}
            {(form.channel === 'email' || form.channel === 'both') && (
              <>
                <div>
                  <Label>Email subject</Label>
                  <Input value={form.email_subject}
                    onChange={(e) => setForm({ ...form, email_subject: e.target.value })} />
                </div>
                <div>
                  <Label>Email body (HTML)</Label>
                  <Textarea rows={4} value={form.email_body}
                    onChange={(e) => setForm({ ...form, email_body: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
                Create offer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead><TableHead>Audience</TableHead>
            <TableHead>Channel</TableHead><TableHead>Status</TableHead>
            <TableHead>Sends</TableHead><TableHead>Bookings</TableHead>
            <TableHead>Recurring</TableHead><TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(offers || []).map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.name}</TableCell>
              <TableCell>{AUDIENCES.find((a) => a.value === o.audience)?.label || o.audience}</TableCell>
              <TableCell>{o.channel.toUpperCase()}</TableCell>
              <TableCell>
                <Badge variant={o.status === 'active' ? 'default' : 'secondary'}>{o.status}</Badge>
              </TableCell>
              <TableCell>{o.sends}</TableCell>
              <TableCell>{o.attributed_bookings}</TableCell>
              <TableCell>{o.attributed_recurring}</TableCell>
              <TableCell className="space-x-2">
                {o.status === 'draft' && (
                  <Button size="sm" variant="outline"
                    onClick={() => setStatus.mutate({ id: o.id, status: 'active' })}>
                    <Play className="h-3 w-3 mr-1" /> Activate
                  </Button>
                )}
                {o.status === 'active' && (
                  <Button size="sm" variant="outline"
                    onClick={() => setStatus.mutate({ id: o.id, status: 'ended' })}>
                    <Ban className="h-3 w-3 mr-1" /> End
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const EMPTY_CAMPAIGN = {
  name: '', segment: 'all', channel: 'email',
  sms_body: '', email_subject: '', email_body: '', scheduled_at: '',
};

function CampaignsTab() {
  const invalidate = useInvalidate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_CAMPAIGN);

  const { data: campaigns } = useQuery({
    queryKey: ['lifecycle-campaigns'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lifecycle_campaign_stats').select('*').order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error('Name required');
      const row: any = {
        name: form.name,
        segment: form.segment,
        channel: form.channel,
        sms_body: form.sms_body || null,
        email_subject: form.email_subject || null,
        email_body: form.email_body || null,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : new Date().toISOString(),
        status: 'draft',
      };
      const { error } = await db.from('lifecycle_campaigns').insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(['lifecycle-campaigns']);
      setShowForm(false);
      setForm(EMPTY_CAMPAIGN);
      toast.success('Campaign created (draft) — schedule it to send');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('lifecycle_campaigns')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(['lifecycle-campaigns']),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          One-off broadcasts (holiday specials, capacity pushes). Same opt-out, quiet-hours and
          frequency-cap rails as the cadence — layered on top, never interrupting it.
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> New campaign
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New campaign</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Segment</Label>
                <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Send at (blank = next engine run)</Label>
                <Input type="datetime-local" value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
            </div>
            {(form.channel === 'sms' || form.channel === 'both') && (
              <div>
                <Label>SMS copy</Label>
                <Textarea rows={2} value={form.sms_body}
                  onChange={(e) => setForm({ ...form, sms_body: e.target.value })} />
              </div>
            )}
            {(form.channel === 'email' || form.channel === 'both') && (
              <>
                <div>
                  <Label>Email subject</Label>
                  <Input value={form.email_subject}
                    onChange={(e) => setForm({ ...form, email_subject: e.target.value })} />
                </div>
                <div>
                  <Label>Email body (HTML)</Label>
                  <Textarea rows={4} value={form.email_body}
                    onChange={(e) => setForm({ ...form, email_body: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
                Create campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead><TableHead>Segment</TableHead>
            <TableHead>Channel</TableHead><TableHead>Status</TableHead>
            <TableHead>Scheduled</TableHead><TableHead>Sends</TableHead>
            <TableHead>Bookings</TableHead><TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(campaigns || []).map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{AUDIENCES.find((a) => a.value === c.segment)?.label || c.segment}</TableCell>
              <TableCell>{c.channel.toUpperCase()}</TableCell>
              <TableCell>
                <Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status}</Badge>
              </TableCell>
              <TableCell>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</TableCell>
              <TableCell>{c.sends}</TableCell>
              <TableCell>{c.attributed_bookings}</TableCell>
              <TableCell className="space-x-2">
                {c.status === 'draft' && (
                  <Button size="sm" variant="outline"
                    onClick={() => setStatus.mutate({ id: c.id, status: 'scheduled' })}>
                    <Send className="h-3 w-3 mr-1" /> Schedule
                  </Button>
                )}
                {(c.status === 'scheduled' || c.status === 'sending') && (
                  <Button size="sm" variant="outline"
                    onClick={() => setStatus.mutate({ id: c.id, status: 'cancelled' })}>
                    <Ban className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Numbers + opt-outs
// ---------------------------------------------------------------------------

function NumbersOptOutsTab() {
  const invalidate = useInvalidate();
  const [newOptOutPhone, setNewOptOutPhone] = useState('');
  const [newOptOutEmail, setNewOptOutEmail] = useState('');

  const { data: numbers } = useQuery({
    queryKey: ['sms-state-numbers'],
    queryFn: async () => {
      const { data, error } = await db.from('sms_state_numbers').select('*').order('state_code');
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: smsOptOuts } = useQuery({
    queryKey: ['sms-opt-outs'],
    queryFn: async () => {
      const { data, error } = await db.from('sms_opt_outs')
        .select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: emailOptOuts } = useQuery({
    queryKey: ['email-opt-outs'],
    queryFn: async () => {
      const { data, error } = await db.from('email_opt_outs')
        .select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  const saveNumber = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await db.from('sms_state_numbers').update({
        phone_e164: row.phone_e164,
        openphone_phone_id: row.openphone_phone_id || null,
        updated_at: new Date().toISOString(),
      }).eq('state_code', row.state_code);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(['sms-state-numbers']); toast.success('Number saved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSmsOptOut = useMutation({
    mutationFn: async () => {
      const digits = newOptOutPhone.replace(/\D/g, '').replace(/^1/, '');
      if (digits.length !== 10) throw new Error('Enter a 10-digit US phone');
      const { error } = await db.from('sms_opt_outs').upsert({
        phone_digits: digits, phone_e164: `+1${digits}`, source: 'admin',
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(['sms-opt-outs']); setNewOptOutPhone(''); toast.success('SMS opt-out added'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeSmsOptOut = useMutation({
    mutationFn: async (digits: string) => {
      const { error } = await db.from('sms_opt_outs').delete().eq('phone_digits', digits);
      if (error) throw error;
    },
    onSuccess: () => invalidate(['sms-opt-outs']),
  });
  const addEmailOptOut = useMutation({
    mutationFn: async () => {
      const email = newOptOutEmail.trim().toLowerCase();
      if (!email.includes('@')) throw new Error('Enter a valid email');
      const { error } = await db.from('email_opt_outs').upsert({ email, source: 'admin' });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(['email-opt-outs']); setNewOptOutEmail(''); toast.success('Email opt-out added'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeEmailOptOut = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await db.from('email_opt_outs').delete().eq('email', email);
      if (error) throw error;
    },
    onSuccess: () => invalidate(['email-opt-outs']),
  });

  const [numberEdits, setNumberEdits] = useState<Record<string, any>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">OpenPhone numbers by state</CardTitle>
          <CardDescription>
            Every outbound SMS is sent from the number matching the customer's state
            (inferred from their ZIP when the state is missing). Configure the OpenPhone
            webhook for message events on all four numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(numbers || []).map((raw) => {
            const row = { ...raw, ...(numberEdits[raw.state_code] || {}) };
            const dirty = Boolean(numberEdits[raw.state_code]);
            return (
              <div key={raw.state_code} className="flex items-end gap-3 flex-wrap">
                <Badge className="mb-2">{raw.state_code}</Badge>
                <div>
                  <Label>Number (E.164)</Label>
                  <Input className="w-44" value={row.phone_e164}
                    onChange={(e) => setNumberEdits((p) => ({
                      ...p, [raw.state_code]: { ...(p[raw.state_code] || {}), phone_e164: e.target.value },
                    }))} />
                </div>
                <div>
                  <Label>OpenPhone phoneNumberId (optional)</Label>
                  <Input className="w-56" placeholder="PN…" value={row.openphone_phone_id || ''}
                    onChange={(e) => setNumberEdits((p) => ({
                      ...p, [raw.state_code]: { ...(p[raw.state_code] || {}), openphone_phone_id: e.target.value },
                    }))} />
                </div>
                <span className="text-xs text-muted-foreground mb-2">{raw.timezone}</span>
                {dirty && (
                  <Button size="sm" onClick={() => {
                    saveNumber.mutate(row);
                    setNumberEdits((p) => { const n = { ...p }; delete n[raw.state_code]; return n; });
                  }}>Save</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SMS opt-outs (STOP)</CardTitle>
            <CardDescription>Numbers here are never texted again, on any flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="(555) 123-4567" value={newOptOutPhone}
                onChange={(e) => setNewOptOutPhone(e.target.value)} />
              <Button size="sm" onClick={() => addSmsOptOut.mutate()}>Add</Button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {(smsOptOuts || []).map((o) => (
                <div key={o.phone_digits} className="flex items-center justify-between text-sm border-b py-1">
                  <span>{o.phone_e164 || o.phone_digits} <Badge variant="outline">{o.source}</Badge></span>
                  <Button size="sm" variant="ghost" onClick={() => removeSmsOptOut.mutate(o.phone_digits)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email opt-outs (unsubscribe)</CardTitle>
            <CardDescription>Addresses here never receive marketing email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="customer@email.com" value={newOptOutEmail}
                onChange={(e) => setNewOptOutEmail(e.target.value)} />
              <Button size="sm" onClick={() => addEmailOptOut.mutate()}>Add</Button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {(emailOptOuts || []).map((o) => (
                <div key={o.email} className="flex items-center justify-between text-sm border-b py-1">
                  <span>{o.email} <Badge variant="outline">{o.source}</Badge></span>
                  <Button size="sm" variant="ghost" onClick={() => removeEmailOptOut.mutate(o.email)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings + engine controls
// ---------------------------------------------------------------------------

function SettingsTab() {
  const invalidate = useInvalidate();
  const [edits, setEdits] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  const { data: settings } = useQuery({
    queryKey: ['lifecycle-settings'],
    queryFn: async () => {
      const { data, error } = await db.from('lifecycle_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return data as any;
    },
  });

  const merged = { ...(settings || {}), ...(edits || {}) };

  const save = useMutation({
    mutationFn: async () => {
      const patch: any = { ...edits, updated_at: new Date().toISOString() };
      for (const k of ['quiet_hours_start', 'quiet_hours_end', 'frequency_cap_per_week', 'attribution_window_days', 'cadence_grace_days', 'lapsed_after_days']) {
        if (patch[k] !== undefined) patch[k] = Number(patch[k]);
      }
      const { error } = await db.from('lifecycle_settings').update(patch).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => { setEdits(null); invalidate(['lifecycle-settings']); toast.success('Settings saved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const runEngine = async (dryRun: boolean) => {
    setRunning(true);
    setRunResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('lifecycle-engine', {
        body: { dryRun },
      });
      if (error) throw error;
      setRunResult(data);
      toast.success(dryRun ? 'Dry run complete' : 'Engine run complete');
    } catch (e) {
      toast.error('Engine run failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRunning(false);
    }
  };

  if (!settings) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Engine</CardTitle>
              <CardDescription>Runs automatically every 20 minutes via cron.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label>Enabled</Label>
              <Switch
                checked={merged.engine_enabled}
                onCheckedChange={(v) => setEdits({ ...(edits || {}), engine_enabled: v })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>Send window start (local hour)</Label>
            <Input type="number" min={0} max={23} value={merged.quiet_hours_start}
              onChange={(e) => setEdits({ ...(edits || {}), quiet_hours_start: e.target.value })} />
          </div>
          <div>
            <Label>Send window end (local hour)</Label>
            <Input type="number" min={1} max={24} value={merged.quiet_hours_end}
              onChange={(e) => setEdits({ ...(edits || {}), quiet_hours_end: e.target.value })} />
          </div>
          <div>
            <Label>Frequency cap (touches / week)</Label>
            <Input type="number" min={1} value={merged.frequency_cap_per_week}
              onChange={(e) => setEdits({ ...(edits || {}), frequency_cap_per_week: e.target.value })} />
          </div>
          <div>
            <Label>Attribution window (days)</Label>
            <Input type="number" min={1} value={merged.attribution_window_days}
              onChange={(e) => setEdits({ ...(edits || {}), attribution_window_days: e.target.value })} />
          </div>
          <div>
            <Label>Step grace window (days)</Label>
            <Input type="number" min={1} value={merged.cadence_grace_days}
              onChange={(e) => setEdits({ ...(edits || {}), cadence_grace_days: e.target.value })} />
          </div>
          <div>
            <Label>Lapsed after (days)</Label>
            <Input type="number" min={30} value={merged.lapsed_after_days}
              onChange={(e) => setEdits({ ...(edits || {}), lapsed_after_days: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Booking link (CTA in every message)</Label>
            <Input value={merged.booking_link}
              onChange={(e) => setEdits({ ...(edits || {}), booking_link: e.target.value })} />
          </div>
          {edits && (
            <div className="col-span-2 md:col-span-3">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                Save settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual run</CardTitle>
          <CardDescription>
            Dry run shows exactly who would get what, without sending anything.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={running} onClick={() => runEngine(true)}>
              <RefreshCw className="h-4 w-4 mr-1" /> Dry run
            </Button>
            <Button size="sm" disabled={running} onClick={() => runEngine(false)}>
              <Play className="h-4 w-4 mr-1" /> Run engine now
            </Button>
          </div>
          {runResult && (
            <pre className="text-xs bg-muted rounded p-3 max-h-96 overflow-auto">
              {JSON.stringify(runResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics — recent sends log
// ---------------------------------------------------------------------------

function AnalyticsTab() {
  const { data: sends } = useQuery({
    queryKey: ['lifecycle-sends'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lifecycle_sends')
        .select('id, created_at, track, channel, status, skip_reason, provider, from_number, phone_digits, email, replied_at, attributed_booking_id, attributed_recurring_id')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: stepStats } = useQuery({
    queryKey: ['lifecycle-step-stats'],
    queryFn: async () => {
      const { data, error } = await db.from('lifecycle_step_stats').select('*').order('day_offset');
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadence performance</CardTitle>
          <CardDescription>Which steps earn bookings and recurring signups.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead><TableHead>Track</TableHead><TableHead>Day</TableHead>
                <TableHead>Sends</TableHead><TableHead>Replies</TableHead>
                <TableHead>Bookings</TableHead><TableHead>Recurring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stepStats || []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{TRACK_LABELS[s.track] || s.track}</TableCell>
                  <TableCell>{s.day_offset}</TableCell>
                  <TableCell>{s.sends}</TableCell>
                  <TableCell>{s.replies}</TableCell>
                  <TableCell>{s.attributed_bookings}</TableCell>
                  <TableCell>{s.attributed_recurring}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent sends</CardTitle>
          <CardDescription>Every lifecycle touch — sent, skipped, or failed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead><TableHead>Track</TableHead><TableHead>Channel</TableHead>
                <TableHead>To</TableHead><TableHead>From</TableHead><TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sends || []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                  <TableCell>{s.track}</TableCell>
                  <TableCell>{s.channel.toUpperCase()}</TableCell>
                  <TableCell>{s.channel === 'sms' ? s.phone_digits : s.email}</TableCell>
                  <TableCell>{s.from_number || s.provider || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'sent' ? 'default' : s.status === 'failed' ? 'destructive' : 'secondary'}>
                      {s.status}{s.skip_reason ? `: ${s.skip_reason.slice(0, 40)}` : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.replied_at ? 'replied ' : ''}
                    {s.attributed_booking_id ? '· booked ' : ''}
                    {s.attributed_recurring_id ? '· recurring' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LifecycleEngine() {
  return (
    <AdminLayout
      title="Lifecycle Engine"
      description="Reactivation cadence, offers & campaigns — SMS via OpenPhone (state-routed numbers), email via Resend. Recurring is the goal."
    >
      <div className="space-y-6">
        <Tabs defaultValue="cadence">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="cadence">Cadence</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="optouts">Numbers & Opt-outs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="cadence" className="mt-4"><CadenceTab /></TabsContent>
          <TabsContent value="offers" className="mt-4"><OffersTab /></TabsContent>
          <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
          <TabsContent value="optouts" className="mt-4"><NumbersOptOutsTab /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
