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

import { useMemo, useState } from 'react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ADD_ONS,
  addOnPrice,
  buildQuote,
  HOME_SIZE_RANGES,
  INVOICE_MODES,
  money,
  serviceListPrice,
  SERVICE_TIERS,
  splitTotal,
  TIME_SLOTS,
  type InvoiceMode,
  type ServiceType,
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

const SERVICE_ORDER: ServiceType[] = ['standard', 'deep', 'moveInOut', 'combo'];

const INITIAL = {
  firstName: '', lastName: '', email: '', phone: '',
  addressLine1: '', addressLine2: '', city: '', state: 'NJ', zipCode: '',
  homeSizeId: '1501_2000', serviceType: 'standard' as ServiceType,
  addOns: [] as string[],
  bedrooms: '', bathrooms: '',
  frequency: 'one-time',
  serviceDate: '', timeSlot: '',
  invoiceMode: 'deposit_plus_preauth' as InvoiceMode,
  depositPercent: '50',
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
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
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const set = <K extends keyof typeof INITIAL>(field: K, value: (typeof INITIAL)[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  const toggleAddOn = (id: string) =>
    setForm((p) => ({
      ...p,
      addOns: p.addOns.includes(id) ? p.addOns.filter((a) => a !== id) : [...p.addOns, id],
    }));

  const quote = useMemo(
    () => buildQuote(form.homeSizeId, form.serviceType, form.addOns),
    [form.homeSizeId, form.serviceType, form.addOns],
  );

  const override = Number(form.priceOverride);
  const total = override > 0 ? override : quote.total;
  const depositPct = Math.max(0, Math.min(100, Number(form.depositPercent) || 50)) / 100;
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
          serviceType: form.serviceType,
          addOns: form.addOns,
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
                    ? `SMS via ${result.smsResult?.provider === 'ghl' ? 'GoHighLevel' : 'OpenPhone failover'}`
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
  return (
    <AdminLayout
      title="Internal Booking"
      description="Book while the customer is on the phone"
    >
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
                <Field label="Street address">
                  <Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
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

            <Field label="Service" required>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICE_ORDER.map((type) => {
                  const active = form.serviceType === type;
                  const list = serviceListPrice(form.homeSizeId, type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('serviceType', type)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40 hover:bg-muted/50',
                      )}
                    >
                      <div className="text-sm font-semibold">{SERVICE_TIERS[type].label}</div>
                      <div className="text-xs text-muted-foreground">{money(list)} list</div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field
              label="Add-ons"
              hint={
                form.serviceType === 'moveInOut'
                  ? 'Move-In/Out already includes the fridge and oven, so those bill at $0.'
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ADD_ONS).map(([id, addOn]) => {
                  const active = form.addOns.includes(id);
                  const price = addOnPrice(id, form.serviceType);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAddOn(id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:border-primary/40 hover:bg-muted',
                      )}
                    >
                      {addOn.label} · {price === 0 ? 'included' : money(price)}
                    </button>
                  );
                })}
              </div>
            </Field>

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

            <Field label="Special instructions">
              <Textarea rows={2} value={form.specialInstructions}
                onChange={(e) => set('specialInstructions', e.target.value)} />
            </Field>
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
                <Select value={form.timeSlot} onValueChange={(v) => set('timeSlot', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated crew time: {quote.estimatedHours} hours.
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
                {INVOICE_MODES.map((mode) => {
                  const active = form.invoiceMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => set('invoiceMode', mode.value)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40 hover:bg-muted/50',
                      )}
                    >
                      <div className="text-sm font-semibold">{mode.label}</div>
                      <div className="text-xs text-muted-foreground">{mode.description}</div>
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

            <div className="flex items-center gap-2">
              <Switch checked={form.sendConfirmationSms}
                onCheckedChange={(v) => set('sendConfirmationSms', v)} />
              <Label className="text-xs">
                Send confirmation SMS via GoHighLevel — support line{' '}
                {SUPPORT_NUMBERS[form.state] || form.state}
              </Label>
            </div>
          </FormSection>
        </div>

        {/* ─── Sticky quote rail ─────────────────────────────────────── */}
        <aside className="xl:col-span-4">
          <div className="xl:sticky xl:top-20">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> Live quote
                </CardTitle>
                <CardDescription>Matches the invoice exactly — read it out.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{SERVICE_TIERS[form.serviceType].label} (list)</span>
                    <span>{money(quote.listPrice)}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>−{money(quote.discount)}</span>
                    </div>
                  )}
                  {form.addOns.length > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{form.addOns.length} add-on{form.addOns.length > 1 ? 's' : ''}</span>
                      <span>{money(quote.addOnsTotal)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
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
                  On book: customer and booking saved → job pushed to Housecall Pro → Stripe
                  {form.invoiceMode === 'deposit_plus_preauth'
                    ? ' pay link sent (deposit + card on file, balance held before service and charged after the clean)'
                    : ' invoice(s) emailed'}
                  {' '}→ booking synced to GoHighLevel, which fires the automated comms.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
