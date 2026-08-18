// Internal Booking — the VA's phone-booking workspace.
//
// Rebuilt to mirror the Novara internal booking flow: four numbered
// sections down the left (customer, service, schedule, payment) and a
// sticky live-quote rail on the right that the VA reads off while the
// customer is still on the line. Colours are AlphaLux navy rather than
// Novara's violet — same structure, our brand.
//
// The quote comes from `@/lib/pricing-internal`, which is mirrored in
// the edge function, so the number quoted on the phone is the number
// Stripe invoices. Nothing here computes a price of its own.
//
// Comms split: automated messages on this rail are sent by GoHighLevel,
// and the OpenPhone line for the customer's market is quoted in the copy
// as support, because a LeadConnector number is not a staffed inbox.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  buildQuote,
  DEPOSIT_PERCENT,
  HOME_SIZE_RANGES,
  INVOICE_MODES,
  money,
  CADENCE_LABELS,
  CADENCE_PER_MONTH,
  offerPrice,
  OFFERS,
  OFFER_ORDER,
  requiresEstimate,
  splitTotal,
  TIME_SLOTS,
  type InvoiceMode,
  type Cadence,
  type OfferId,
} from '@/lib/pricing-internal';
import {
  Loader2, Copy, CheckCircle2, Phone, DollarSign, RotateCcw, Home, CalendarDays,
  Sparkles, AlertTriangle,
} from 'lucide-react';

const STATES = ['NJ', 'NY', 'TX', 'CA'];

// Support lines quoted in the UI. The server resolves the live value from
// `sms_state_numbers` (editable under Lifecycle → Numbers), so treat
// these as the defaults ops sees, not the source of truth.
const SUPPORT_NUMBERS: Record<string, string> = {
  NJ: '(551) 239-9444',
  TX: '(972) 559-0223',
  CA: '(323) 300-5528',
  NY: '(631) 366-8565',
};

/** Novara groups arrival windows by part of day rather than one long list. */
const SLOT_PERIODS = [
  { label: 'Morning', slots: ['early_morning', 'morning'] },
  { label: 'Midday', slots: ['late_morning', 'afternoon'] },
  { label: 'Evening', slots: ['late_afternoon', 'evening'] },
];

const INITIAL = {
  firstName: '', lastName: '', email: '', phone: '',
  addressLine1: '', addressLine2: '', city: '', state: 'NJ', zipCode: '',
  homeSizeId: '1501_2000', offerId: 'deep' as OfferId,
  cadence: 'biweekly' as Cadence,
  bedrooms: '', bathrooms: '',
  dwellingType: '', pets: 'none', parkingNotes: '',
  accessNotes: '', teamNotes: '',
  frequency: 'one-time',
  serviceDate: '', timeSlot: '',
  invoiceMode: 'deposit_plus_preauth' as InvoiceMode,
  depositPercent: String(Math.round(DEPOSIT_PERCENT * 100)),
  priceOverride: '',
  specialInstructions: '', csrName: '',
  sendConfirmationSms: true,
  agreedOnPhone: false,
};

function FormSection({
  number, title, description, icon, children,
}: {
  number: number;
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-alx-navy-deep text-sm font-bold text-primary-foreground shadow-sm">
            {number}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 text-primary">
              {icon}
              <CardTitle className="text-base font-bold tracking-tight text-foreground">
                {title}
              </CardTitle>
            </div>
            {description && (
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">{children}</CardContent>
    </Card>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Shape of the book-as-va response the result screen renders. */
interface BookingResult {
  bookingRef: string;
  stripeAccount: string;
  totals: { total: number; deposit: number; balance: number };
  hcpJobId?: string | null;
  hcpError?: string | null;
  ghlContactId?: string | null;
  ghlError?: string | null;
  payPageUrl?: string | null;
  smsResult?: { success?: boolean; provider?: string } | null;
  emailResult?: { email?: string; success?: boolean } | null;
  depositInvoice?: { hostedInvoiceUrl?: string | null } | null;
  remainingInvoice?: { hostedInvoiceUrl?: string | null } | null;
  fullInvoice?: { hostedInvoiceUrl?: string | null } | null;
  invoiceError?: string | null;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{value}</div>
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
  const { leadToken } = useParams<{ leadToken?: string }>();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [leadLocked, setLeadLocked] = useState(false);
  const [leadSource, setLeadSource] = useState<string | null>(null);
  const [leadLoadError, setLeadLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadToken) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('lead_booking_tokens')
        .select('token, first_name, last_name, email, phone, zip_code, city, state_code, source, booked_at')
        .eq('token', leadToken)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLeadLoadError('This lead booking link is invalid.');
        return;
      }
      if (data.booked_at) {
        setLeadLoadError('This lead has already been booked on this link.');
        return;
      }
      const state = STATES.includes(String(data.state_code || '').toUpperCase())
        ? String(data.state_code).toUpperCase()
        : 'NJ';
      setLeadLocked(true);
      setLeadSource(data.source || 'GHL');
      setForm((p) => ({
        ...p,
        firstName: data.first_name || p.firstName,
        lastName: data.last_name || p.lastName,
        email: data.email || p.email,
        phone: data.phone || p.phone,
        zipCode: data.zip_code || p.zipCode,
        city: data.city || p.city,
        state,
        invoiceMode: 'deposit_plus_preauth',
      }));
    })();
    return () => { cancelled = true; };
  }, [leadToken]);

  const set = <K extends keyof typeof INITIAL>(field: K, value: (typeof INITIAL)[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  const quote = useMemo(
    () => buildQuote(form.homeSizeId, form.offerId, form.state, form.cadence),
    [form.homeSizeId, form.offerId, form.state, form.cadence],
  );

  const override = Number(form.priceOverride);
  const total = override > 0 ? override : quote.total;
  const depositPct = Math.max(0, Math.min(100, Number(form.depositPercent) || DEPOSIT_PERCENT * 100)) / 100;
  const { deposit, remaining } = splitTotal(total, form.invoiceMode, depositPct);

  // What the VA still has to collect before the button does anything.
  const missing = useMemo(() => {
    const list: string[] = [];
    if (!form.firstName.trim()) list.push('First name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) list.push('Valid email');
    if (form.phone.replace(/\D/g, '').length < 10) list.push('Phone (10+ digits)');
    if (form.zipCode.replace(/\D/g, '').length !== 5) list.push('ZIP (5 digits)');
    if (!form.serviceDate) list.push('Service date');
    if (!form.timeSlot) list.push('Arrival window');
    if (!form.agreedOnPhone) list.push('Confirm the customer agreed');
    return list;
  }, [form]);

  const book = async () => {
    if (missing.length) {
      toast.error(`Still needed: ${missing.join(', ')}`);
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
          homeSizeId: form.homeSizeId,
          offerId: form.offerId,
          cadence: form.offerId === 'recurring' ? form.cadence : undefined,
          propertyDetails: {
            dwellingType: form.dwellingType || null,
            pets: form.pets,
            parkingNotes: form.parkingNotes || null,
          },
          accessNotes: form.accessNotes || undefined,
          teamNotes: form.teamNotes || undefined,
          bedrooms: form.bedrooms || undefined,
          bathrooms: form.bathrooms || undefined,
          frequency: form.frequency,
          serviceDate: form.serviceDate,
          timeSlot: form.timeSlot,
          invoiceMode: form.invoiceMode,
          depositPercent: depositPct,
          priceOverride: override > 0 ? { total: override } : undefined,
          specialInstructions: form.specialInstructions || undefined,
          csrName: form.csrName || undefined,
          sendConfirmationSms: form.sendConfirmationSms,
          leadBookingToken: leadToken || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Booking failed');
      setResult(data as BookingResult);
      toast.success(`Booking ${data.bookingRef} created`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Result screen ──────────────────────────────────────────────────
  if (result) {
    const smsOk = result.smsResult?.success;
    const emailOk = result.emailResult?.email === 'sent' || result.emailResult?.success;
    const payUrl = result.payPageUrl || result.depositInvoice?.hostedInvoiceUrl;
    return (
      <AdminLayout title="Internal Booking" description="Booking created">
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <CardTitle>Booking {result.bookingRef} confirmed</CardTitle>
              </div>
              <CardDescription>
                Total {money(result.totals.total)} · Deposit {money(result.totals.deposit)} ·
                Balance {money(result.totals.balance)} · Stripe account {result.stripeAccount}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={result.hcpJobId ? 'default' : 'destructive'}>
                  {result.hcpJobId ? `HCP job ${result.hcpJobId}` : `HCP: ${result.hcpError || 'not synced'}`}
                </Badge>
                <Badge variant={result.ghlContactId ? 'default' : 'destructive'}>
                  {result.ghlContactId ? 'GoHighLevel synced' : `GHL: ${result.ghlError || 'not synced'}`}
                </Badge>
                <Badge variant={smsOk ? 'default' : 'secondary'}>
                  {smsOk
                    ? `SMS via ${result.smsResult?.provider === 'openphone' ? 'OpenPhone' : result.smsResult?.provider === 'ghl' ? 'GoHighLevel' : result.smsResult?.provider || 'SMS'}`
                    : result.smsResult ? 'SMS failed' : 'SMS skipped'}
                </Badge>
                <Badge variant={emailOk ? 'default' : 'secondary'}>
                  {emailOk ? 'Confirmation email sent' : 'Email pending'}
                </Badge>
              </div>

              {payUrl && <CopyRow label="Secure pay link (deposit + card on file)" value={payUrl} />}
              {result.remainingInvoice?.hostedInvoiceUrl && (
                <CopyRow label="Balance invoice (due on service date)" value={result.remainingInvoice.hostedInvoiceUrl} />
              )}
              {result.fullInvoice?.hostedInvoiceUrl && (
                <CopyRow label="Full payment invoice" value={result.fullInvoice.hostedInvoiceUrl} />
              )}
              {result.invoiceError && (
                <p className="text-sm text-destructive">Invoice issue: {result.invoiceError}</p>
              )}

              <Button onClick={() => { setResult(null); setForm(INITIAL); }}>
                <RotateCcw className="mr-1 h-4 w-4" /> Book another
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────────
  if (leadLoadError) {
    return (
      <AdminLayout title="Internal Booking" description="Lead booking link">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Can’t open this lead</CardTitle>
            <CardDescription>{leadLoadError}</CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Internal Booking"
      description={leadLocked ? 'Book this Facebook / GHL lead' : 'Book while the customer is on the phone'}
    >
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-7">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              Workspace · Internal
            </span>
            {leadLocked && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                {leadSource || 'Lead'} · tokenized
              </span>
            )}
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {form.state} · {SUPPORT_NUMBERS[form.state] || '—'}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
                {leadLocked ? 'Book this lead' : 'AlphaLux Internal Booking'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {leadLocked
                  ? 'Same internal booking form, prefilled for this lead. Payment is deposit + pre-auth only — OpenPhone texts the customer the pay link when you book them in. The job goes to Housecall Pro and GoHighLevel.'
                  : 'Same rate card the website quotes. GoHighLevel fires the automated comms; the OpenPhone line for the customer\'s market is what they call.'}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6 inline-flex rounded-xl border border-border bg-muted/50 p-1">
          {([
            { id: 'one_time' as const, label: 'One-time clean' },
            { id: 'recurring' as const, label: 'Recurring plan' },
          ]).map((tab) => {
            const active = (form.offerId === 'recurring') === (tab.id === 'recurring');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  set('offerId', tab.id === 'recurring' ? 'recurring' : 'deep')
                }
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <FormSection
            number={1}
            title="Customer"
            description="Who we're booking for and where to reach them."
            icon={<Phone className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" required>
                <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Phone" required>
                <Input placeholder="(555) 123-4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Street address" hint="Pick a Google suggestion to fill city, state and ZIP automatically.">
                  <AddressAutocomplete
                    value={form.addressLine1}
                    onChange={(v) => set('addressLine1', v)}
                    onResolved={(a) =>
                      setForm((p) => ({
                        ...p,
                        addressLine1: a.line1 || p.addressLine1,
                        city: a.city || p.city,
                        state: a.state || p.state,
                        zipCode: a.zipCode || p.zipCode,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Unit / Apt">
                <Input value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="State" hint="Routes the support number and the Stripe account.">
                <Select value={form.state} onValueChange={(v) => set('state', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ZIP" required>
                <Input maxLength={5} value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number={2}
            title="Service"
            description="Home size sets the base price; the service tier multiplies it."
            icon={<Home className="h-4 w-4" />}
          >
            <Field label="Home size" required>
              <Select value={form.homeSizeId} onValueChange={(v) => set('homeSizeId', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOME_SIZE_RANGES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Offer" required>
              <div className="grid gap-2 sm:grid-cols-2">
                {OFFER_ORDER.map((id) => {
                  const active = form.offerId === id;
                  const price = offerPrice(form.homeSizeId, id, form.state, form.cadence);
                  const offer = OFFERS[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set('offerId', id)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40 hover:bg-muted/50',
                      )}
                    >
                      <div className="text-sm font-semibold">{offer.label}</div>
                      <div className="text-xs text-muted-foreground">{offer.blurb}</div>
                      <div className="mt-1 text-sm font-bold text-primary">
                        {price > 0 ? money(price) : 'Quote required'}
                        {offer.visits > 1 && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            · {offer.visits} visits
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            {form.offerId === 'recurring' && (
              <Field label="Cadence" required hint="Discount applies from the first visit.">
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(CADENCE_LABELS) as Cadence[]).map((c) => {
                    const active = form.cadence === c;
                    const per = offerPrice(form.homeSizeId, 'recurring', form.state, c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set('cadence', c)}
                        className={cn(
                          'rounded-xl border p-3 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary/40 hover:bg-muted/50',
                        )}
                      >
                        <div className="text-sm font-semibold">{CADENCE_LABELS[c]}</div>
                        <div className="text-xs text-muted-foreground">
                          {money(per)} per visit
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {money(per * CADENCE_PER_MONTH[c])} / month
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Bedrooms">
                <Input type="number" min={0} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
              </Field>
              <Field label="Bathrooms">
                <Input type="number" min={0} step="0.5" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              </Field>
              <Field label="Frequency">
                <Select value={form.frequency} onValueChange={(v) => set('frequency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dwelling type">
                <Select value={form.dwellingType} onValueChange={(v) => set('dwellingType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhome">Townhome</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pets" hint="Crews plan supplies and time around pets.">
                <Select value={form.pets} onValueChange={(v) => set('pets', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No pets</SelectItem>
                    <SelectItem value="cats">Cats</SelectItem>
                    <SelectItem value="dogs">Dogs</SelectItem>
                    <SelectItem value="both">Cats and dogs</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Special instructions" hint="Shared with the customer on their confirmation.">
              <Textarea rows={2} value={form.specialInstructions}
                onChange={(e) => set('specialInstructions', e.target.value)} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Access & parking" hint="How the crew gets in and where they park.">
                <Textarea rows={2} value={form.accessNotes}
                  onChange={(e) => set('accessNotes', e.target.value)} />
              </Field>
              <Field label="Internal team notes" hint="Never shown to the customer.">
                <Textarea rows={2} value={form.teamNotes}
                  onChange={(e) => set('teamNotes', e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number={3}
            title="Schedule"
            description="Lands in Housecall Pro as the job the crew works from."
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Service date" required>
                <Input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.serviceDate}
                  onChange={(e) => set('serviceDate', e.target.value)}
                />
              </Field>
              <Field label="Arrival window" required>
                <div className="space-y-2">
                  {SLOT_PERIODS.map((period) => (
                    <div key={period.label}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
                        {period.label}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {period.slots.map((value) => {
                          const slot = TIME_SLOTS.find((t) => t.value === value);
                          if (!slot) return null;
                          const active = form.timeSlot === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => set('timeSlot', value)}
                              className={cn(
                                'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                                active
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'hover:border-primary/40 hover:bg-muted',
                              )}
                            >
                              {slot.label.replace(/^[^(]*\(|\)$/g, '')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              {quote.offerLabel} · {quote.tierLabel}
              {quote.visits > 1 && ` · ${quote.visits} visits`}
            </p>
          </FormSection>

          <FormSection
            number={4}
            title="Payment"
            description="How the customer pays, and who booked it."
            icon={<DollarSign className="h-4 w-4" />}
          >
            <Field label="Invoice mode">
              <div className="space-y-2">
                {(leadLocked
                  ? INVOICE_MODES.filter((m) => m.value === 'deposit_plus_preauth')
                  : INVOICE_MODES
                ).map((mode) => {
                  const active = form.invoiceMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => { if (!leadLocked) set('invoiceMode', mode.value); }}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40 hover:bg-muted/50',
                      )}
                    >
                      <div className="text-sm font-semibold">{mode.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {leadLocked
                          ? 'Only option on a lead booking link. OpenPhone texts the customer the deposit + card-on-file page when you book them in. Balance is held before service and captured after the clean.'
                          : mode.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              {form.invoiceMode !== 'full_now' && form.invoiceMode !== 'none' && (
                <Field label="Deposit %">
                  <Input type="number" min={0} max={100} value={form.depositPercent}
                    onChange={(e) => set('depositPercent', e.target.value)} />
                </Field>
              )}
              <Field label="Override total ($)" hint="Leave blank to use the rate card.">
                <Input type="number" min={0} placeholder={String(quote.total)}
                  value={form.priceOverride} onChange={(e) => set('priceOverride', e.target.value)} />
              </Field>
              <Field label="Booked by">
                <Input value={form.csrName} onChange={(e) => set('csrName', e.target.value)} />
              </Field>
            </div>

            {!leadLocked && (
            <div className="flex items-center gap-2">
              <Switch checked={form.sendConfirmationSms}
                onCheckedChange={(v) => set('sendConfirmationSms', v)} />
              <Label className="text-xs">
                Send confirmation SMS via GoHighLevel — support line{' '}
                {SUPPORT_NUMBERS[form.state] || form.state}
              </Label>
            </div>
            )}
            {leadLocked && (
              <p className="text-xs text-muted-foreground">
                OpenPhone will text the customer the pre-auth pay link from{' '}
                {SUPPORT_NUMBERS[form.state] || form.state} when you create this booking.
              </p>
            )}
          </FormSection>
        </div>

        {/* ─── Sticky quote rail ─────────────────────────────────────── */}
        <aside className="xl:col-span-4">
          <div className="xl:sticky xl:top-20">
            <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
              <div className="bg-gradient-to-r from-alx-navy-deep via-primary to-alx-black-elev px-5 py-4 text-primary-foreground">
                <p className="flex items-center gap-2 text-sm font-bold tracking-tight">
                  <Sparkles className="h-4 w-4" /> Live quote
                </p>
                <p className="mt-0.5 text-xs text-primary-foreground/80">
                  Matches the invoice exactly — read it out.
                </p>
              </div>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{quote.offerLabel}</span>
                    <span>{money(quote.total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{quote.tierLabel}</span>
                    <span>{form.state}</span>
                  </div>
                  {quote.visits > 1 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Visits included</span>
                      <span>{quote.visits}</span>
                    </div>
                  )}
                  {quote.isRecurring && quote.monthlyTotal != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Per month ({CADENCE_LABELS[form.cadence]})</span>
                      <span>{money(quote.monthlyTotal)}</span>
                    </div>
                  )}
                </div>

                {quote.requiresEstimate && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
                    This size is quote-only. Enter the agreed price as an override before booking.
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>{quote.isRecurring ? 'Per visit' : 'Total'}</span>
                  <span>{money(total)}</span>
                </div>
                {override > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Overriding the rate-card price of {money(quote.total)}.
                  </p>
                )}

                {form.invoiceMode !== 'none' && total > 0 && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>
                        Due today
                        {form.invoiceMode !== 'full_now' && ` (${Math.round(depositPct * 100)}%)`}
                      </span>
                      <span>{money(deposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {form.invoiceMode === 'deposit_plus_preauth'
                          ? 'Held, charged after the clean'
                          : 'Due on service date'}
                      </span>
                      <span>{money(remaining)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
                  <Checkbox
                    id="agreed"
                    checked={form.agreedOnPhone}
                    onCheckedChange={(v) => set('agreedOnPhone', v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="agreed" className="text-xs font-normal leading-snug">
                    The customer agreed to this price and the cancellation policy on the call.
                  </Label>
                </div>

                <Button className="w-full" size="lg" disabled={submitting} onClick={book}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Booking…' : 'Create booking'}
                </Button>

                {missing.length > 0 && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" /> Still needed
                    </p>
                    <ul className="mt-1 list-inside list-disc text-[11px] text-muted-foreground">
                      {missing.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  On book: customer and booking saved → job pushed to Housecall Pro →
                  {leadLocked || form.invoiceMode === 'deposit_plus_preauth'
                    ? ' OpenPhone texts the customer the deposit + card-on-file pay link (balance held before service and charged after the clean)'
                    : ' Stripe invoice(s) emailed'}
                  {' '}→ booking synced to GoHighLevel.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
