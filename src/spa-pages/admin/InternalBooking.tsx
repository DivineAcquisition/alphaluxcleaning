// Internal Booking — admin/VA phone-booking workspace.
//
// Ported from the Novara internal booking system ("Novara Internal
// Booking" / book-as-va), molded for AlphaLux: the booking lands in
// Housecall Pro (ops platform), the confirmation SMS rides the
// state-routed OpenPhone number (NJ/TX/CA/NY), the confirmation email
// goes out via Resend, and Stripe invoices are created on the
// customer's state-routed Stripe account.
//
// The VA fills the form while on the phone, books, and gets back a
// result panel with the booking ref + invoice URLs to copy/paste to
// the customer immediately.

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Copy, CheckCircle2, Phone, DollarSign, RotateCcw } from 'lucide-react';

const HOME_SIZE_RANGES = [
  { id: 'under_1000', label: 'Under 1,000 sq ft', sqft: 800 },
  { id: '1000_1499', label: '1,000–1,499 sq ft', sqft: 1250 },
  { id: '1500_1999', label: '1,500–1,999 sq ft', sqft: 1750 },
  { id: '2000_2499', label: '2,000–2,499 sq ft', sqft: 2250 },
  { id: '2500_2999', label: '2,500–2,999 sq ft', sqft: 2750 },
  { id: '3000_3499', label: '3,000–3,499 sq ft', sqft: 3250 },
  { id: '3500_3999', label: '3,500–3,999 sq ft', sqft: 3750 },
  { id: '4000_4999', label: '4,000–4,999 sq ft', sqft: 4500 },
  { id: '5000_plus', label: '5,000+ sq ft', sqft: 5500 },
];

// Canonical slots — the same set booking-confirm-comms + hcp-sync-booking parse.
const TIME_SLOTS = [
  { value: 'early_morning', label: 'Early Morning (7–9 AM)' },
  { value: 'morning', label: 'Morning (9–11 AM)' },
  { value: 'late_morning', label: 'Late Morning (11 AM–1 PM)' },
  { value: 'afternoon', label: 'Afternoon (1–3 PM)' },
  { value: 'late_afternoon', label: 'Late Afternoon (3–5 PM)' },
  { value: 'evening', label: 'Evening (5–7 PM)' },
];

const OFFERS = [
  { value: 'standard', label: 'Standard Clean' },
  { value: 'tester', label: 'Tester Deep Clean' },
  { value: '90_day', label: '90-Day Reset & Maintain Plan' },
  { value: 'move_in_out', label: 'Move-In/Out Clean' },
];

const STATES = ['NJ', 'NY', 'TX', 'CA'];

// Mirrors the server rate card in book-as-va 1:1 so the live quote and
// the Stripe invoice always match.
function quoteDollars(sqftRange: string, offerType: string): number {
  const sqft = HOME_SIZE_RANGES.find((r) => r.id === sqftRange)?.sqft ?? 0;
  if (!sqft) return 0;
  if (offerType === 'tester') return sqft < 1500 ? 199 : sqft < 2500 ? 249 : sqft < 4000 ? 299 : 349;
  if (offerType === '90_day') return sqft < 1500 ? 549 : sqft < 2500 ? 649 : sqft < 4000 ? 749 : 849;
  if (offerType === 'move_in_out') return sqft < 1500 ? 299 : sqft < 2500 ? 359 : sqft < 4000 ? 429 : 499;
  return sqft < 1500 ? 149 : sqft < 2500 ? 179 : sqft < 4000 ? 209 : 249;
}

const INITIAL = {
  firstName: '', lastName: '', email: '', phone: '',
  addressLine1: '', addressLine2: '', city: '', state: 'NJ', zipCode: '',
  sqftRange: '', bedrooms: '', bathrooms: '',
  offerType: 'standard', frequency: 'one-time',
  serviceDate: '', timeSlot: '',
  invoiceMode: 'deposit_plus_remaining', depositPercent: '25', priceOverride: '',
  specialInstructions: '', csrName: '', sendConfirmationSms: true,
};

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
      <Button size="sm" variant="outline" onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
      }}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function InternalBooking() {
  const [form, setForm] = useState<any>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const set = (field: string, value: any) => setForm((p: any) => ({ ...p, [field]: value }));

  const listPrice = useMemo(
    () => quoteDollars(form.sqftRange, form.offerType),
    [form.sqftRange, form.offerType],
  );
  const total = form.priceOverride && Number(form.priceOverride) > 0
    ? Number(form.priceOverride)
    : listPrice;
  const depositPct = Math.max(0, Math.min(100, Number(form.depositPercent) || 25)) / 100;
  const deposit = form.invoiceMode === 'full_now'
    ? total
    : Math.round(total * depositPct * 100) / 100;
  const balance = Math.max(0, Math.round((total - deposit) * 100) / 100);

  const book = async () => {
    if (!form.firstName || !form.email || !form.phone || !form.sqftRange || !form.serviceDate || !form.timeSlot) {
      toast.error('First name, email, phone, home size, service date and time slot are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('book-as-va', {
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city || undefined,
          state: form.state,
          zipCode: form.zipCode,
          sqftRange: form.sqftRange,
          bedrooms: form.bedrooms || undefined,
          bathrooms: form.bathrooms || undefined,
          offerType: form.offerType,
          frequency: form.frequency,
          serviceDate: form.serviceDate,
          timeSlot: form.timeSlot,
          invoiceMode: form.invoiceMode,
          depositPercent: depositPct,
          priceOverride: form.priceOverride && Number(form.priceOverride) > 0
            ? { total: Number(form.priceOverride) }
            : undefined,
          specialInstructions: form.specialInstructions || undefined,
          csrName: form.csrName || undefined,
          sendConfirmationSms: form.sendConfirmationSms,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Booking failed');
      setResult(data);
      toast.success(`Booking ${data.bookingRef} created`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const smsOk = result.smsResult?.success;
    const emailOk = result.emailResult?.email === 'sent' || result.emailResult?.success;
    return (
      <AdminLayout title="Internal Booking" description="Booking created — share these with the customer">
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Booking {result.bookingRef} confirmed</CardTitle>
              </div>
              <CardDescription>
                Total ${result.totals.total.toFixed(2)} · Deposit ${result.totals.deposit.toFixed(2)} · Balance ${result.totals.balance.toFixed(2)}
                {' '}· Stripe account: {result.stripeAccount}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={result.hcpJobId ? 'default' : 'destructive'}>
                  {result.hcpJobId ? `HCP job ${result.hcpJobId}` : `HCP: ${result.hcpError || 'not synced'}`}
                </Badge>
                <Badge variant={smsOk ? 'default' : 'secondary'}>
                  {smsOk
                    ? `SMS sent (${result.smsResult?.provider}${result.smsResult?.fromNumber ? ` from ${result.smsResult.fromNumber}` : ''})`
                    : result.smsResult ? 'SMS failed' : 'SMS skipped'}
                </Badge>
                <Badge variant={emailOk ? 'default' : 'secondary'}>
                  {emailOk ? 'Confirmation email sent' : 'Email pending'}
                </Badge>
              </div>
              {result.depositInvoice?.hostedInvoiceUrl && (
                <CopyRow label="Deposit invoice (due today)" value={result.depositInvoice.hostedInvoiceUrl} />
              )}
              {result.remainingInvoice?.hostedInvoiceUrl && (
                <CopyRow label="Remaining balance invoice (due on service date)" value={result.remainingInvoice.hostedInvoiceUrl} />
              )}
              {result.fullInvoice?.hostedInvoiceUrl && (
                <CopyRow label="Full payment invoice" value={result.fullInvoice.hostedInvoiceUrl} />
              )}
              {result.invoiceError && (
                <p className="text-sm text-destructive">Invoice issue: {result.invoiceError}</p>
              )}
              <Button onClick={() => { setResult(null); setForm(INITIAL); }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Book another
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Internal Booking"
      description="Book a customer while on the phone — job lands in Housecall Pro, confirmation SMS rides the state's OpenPhone number"
    >
      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name *</Label>
                <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input placeholder="(555) 123-4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Service address</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Street address</Label>
                <Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
              </div>
              <div>
                <Label>Unit / Apt</Label>
                <Input value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <Label>State (routes SMS number + Stripe account)</Label>
                <Select value={form.state} onValueChange={(v) => set('state', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ZIP</Label>
                <Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Property & service</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div>
                <Label>Home size *</Label>
                <Select value={form.sqftRange} onValueChange={(v) => set('sqftRange', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {HOME_SIZE_RANGES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Offer *</Label>
                <Select value={form.offerType} onValueChange={(v) => {
                  set('offerType', v);
                  if (v === '90_day') set('frequency', 'biweekly');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OFFERS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bedrooms</Label>
                <Input type="number" min={0} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input type="number" min={0} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              </div>
              <div>
                <Label>Service date *</Label>
                <Input type="date" value={form.serviceDate} onChange={(e) => set('serviceDate', e.target.value)} />
              </div>
              <div>
                <Label>Arrival window *</Label>
                <Select value={form.timeSlot} onValueChange={(v) => set('timeSlot', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => set('frequency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly (recurring)</SelectItem>
                    <SelectItem value="biweekly">Biweekly (recurring)</SelectItem>
                    <SelectItem value="monthly">Monthly (recurring)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Special instructions</Label>
                <Textarea rows={2} value={form.specialInstructions}
                  onChange={(e) => set('specialInstructions', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice mode</Label>
                <Select value={form.invoiceMode} onValueChange={(v) => set('invoiceMode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_plus_remaining">Deposit now + balance on service date</SelectItem>
                    <SelectItem value="full_now">Full amount now</SelectItem>
                    <SelectItem value="none">No invoice (leave pending)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.invoiceMode === 'deposit_plus_remaining' && (
                <div>
                  <Label>Deposit %</Label>
                  <Input type="number" min={0} max={100} value={form.depositPercent}
                    onChange={(e) => set('depositPercent', e.target.value)} />
                </div>
              )}
              <div>
                <Label>Price override ($, optional)</Label>
                <Input type="number" min={0} placeholder={listPrice ? `List: $${listPrice}` : ''}
                  value={form.priceOverride} onChange={(e) => set('priceOverride', e.target.value)} />
              </div>
              <div>
                <Label>Booked by (VA name)</Label>
                <Input value={form.csrName} onChange={(e) => set('csrName', e.target.value)} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.sendConfirmationSms}
                  onCheckedChange={(v) => set('sendConfirmationSms', v)} />
                <Label>Send confirmation SMS (OpenPhone, {form.state} number)</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Quote</CardTitle>
              <CardDescription>Mirrors the server rate card — invoice totals will match.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>List price</span><span>{listPrice ? `$${listPrice.toFixed(2)}` : '—'}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span><span>{total ? `$${total.toFixed(2)}` : '—'}</span>
              </div>
              {form.invoiceMode !== 'none' && total > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Deposit {form.invoiceMode === 'full_now' ? '(full)' : `(${Math.round(depositPct * 100)}%)`}</span>
                    <span>${deposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance (due on service date)</span><span>${balance.toFixed(2)}</span>
                  </div>
                </>
              )}
              <Button className="w-full mt-4" disabled={submitting} onClick={book}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {submitting ? 'Booking…' : 'Book & send invoices'}
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                On book: customer + booking saved → job pushed to Housecall Pro → Stripe
                invoice(s) emailed → confirmation email (Resend) + SMS from the {form.state} OpenPhone
                number. Lifecycle engine picks the customer up automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
