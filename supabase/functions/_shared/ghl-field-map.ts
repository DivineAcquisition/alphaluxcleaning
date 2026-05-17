// ─── GHL Custom Field Map (AlphaLuxClean) ──────────────────────────────────
//
// One mapper that builds the full custom-field bag for a booking event.
// Keys use GHL's bare `fieldKey` (the ghl-client resolves both bare and
// "contact." prefixed forms — and falls back to the snapshotted UUIDs in
// KNOWN_GHL_FIELD_IDS — at upload time). Fields that don't apply to the
// current event come back as empty strings — the ghl-client filters
// those out so we never blow away a populated value with a blank.
//
// Snapshot of the AlphaLuxClean GHL location custom fields (2026-05-17):
//   referral_link, service_end_time, frequency, property_type,
//   conversion_status, invoice_link, sqft, remaining_balance,
//   utm_campaign, preferred_contact_method, booking_amount,
//   subscription_status, cancel_fee_amount, landing_page,
//   original_price, bedrooms, mrr_est, deposit_amount, fb_lead_id,
//   utm_source, payment_link, utm_content, flooring, utm_fields,
//   service_start_time, entry_instructions, service_date__time,
//   promo_code, arr_est, manage_link, service_date, stripe_id,
//   tracking_attribution, service_frequency, urgency,
//   discount_cash_value, service_type, bathrooms, referral_code,
//   utm_medium.

import { fmtMoney, ynBool } from './ghl-client.ts';

// ─── Booking row shape (kept loose so any row shape works) ─────────────
export interface BookingRowLike {
  id?: string;
  full_name?: string | null;
  service_type?: string | null;
  offer_type?: string | null;
  offer_name?: string | null;
  visit_count?: number | null;
  frequency?: string | null;
  service_date?: string | null;
  time_slot?: string | null;
  service_time_window?: string | null;
  preferred_date?: string | null;
  preferred_time_block?: string | null;
  zip_code?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  home_size?: string | null;
  sqft_or_bedrooms?: string | null;
  status?: string | null;
  payment_status?: string | null;
  est_price?: number | string | null;
  base_price?: number | string | null;
  deposit_amount?: number | string | null;
  balance_due?: number | string | null;
  promo_code?: string | null;
  promo_discount_cents?: number | null;
  promo_applied?: string | null;
  mrr?: number | string | null;
  arr?: number | string | null;
  is_recurring?: boolean | null;
  recurring_active?: boolean | null;
  conversion_status?: string | null;
  pricing_breakdown?: Record<string, unknown> | null;
  property_details?: Record<string, unknown> | null;
  utms?: Record<string, unknown> | null;
  attribution_method?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_account_slug?: string | null;
  receipt_url?: string | null;
  balance_invoice_url?: string | null;
  manage_token?: string | null;
  referrer_code?: string | null;
  special_instructions?: string | null;
  notes?: string | null;
  created_at?: string | null;
  paid_at?: string | null;
  hcp_job_id?: string | null;
}

export interface CustomerRowLike {
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
}

export interface MapperExtras {
  /** Customer-facing manage-booking URL. Defaults to app.alphaluxclean.com. */
  publicOrigin?: string;
}

// ─── Customer-facing arrival window labels (mirrors OfferDateTimePicker) ──
const ARRIVAL_WINDOW_LABEL: Record<string, { window: string; start: string; end: string }> = {
  early_morning: { window: '7 – 9 AM', start: '7 AM', end: '9 AM' },
  morning: { window: '9 – 11 AM', start: '9 AM', end: '11 AM' },
  late_morning: { window: '11 AM – 1 PM', start: '11 AM', end: '1 PM' },
  afternoon: { window: '1 – 3 PM', start: '1 PM', end: '3 PM' },
  late_afternoon: { window: '3 – 5 PM', start: '3 PM', end: '5 PM' },
  evening: { window: '5 – 7 PM', start: '5 PM', end: '7 PM' },
};

function slotToWindow(slot?: string | null): { window: string; start: string; end: string } | null {
  if (!slot) return null;
  const def = ARRIVAL_WINDOW_LABEL[String(slot)];
  if (def) return def;
  // Title-cased fallback so a brand-new slot still shows up readable.
  const friendly = String(slot).split('_').map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s)).join(' ');
  return { window: friendly, start: friendly, end: friendly };
}

// ─── Service Type → AlphaLux human label ──────────────────────────────
const SERVICE_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard Cleaning',
  deep: 'Deep Cleaning',
  moveInOut: 'Move In / Move Out Cleaning',
  move_in_out: 'Move In / Move Out Cleaning',
  combo: 'Deep + Standard Combo',
  recurring: 'Recurring Maintenance',
};

// ─── Service Frequency (SINGLE_OPTIONS in GHL) ───────────────────────
//
// We send a human-readable token; GHL accepts any pre-configured
// option value or silently drops it. Mapping mirrors the booking
// flow's stored frequency values.
const SERVICE_FREQUENCY_LABEL: Record<string, string> = {
  one_time: 'One-Time',
  'one-time': 'One-Time',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  'bi-weekly': 'Bi-Weekly',
  monthly: 'Monthly',
  recurring: 'Recurring',
};

// ─── Conversion Status (SINGLE_OPTIONS) ───────────────────────────────
// Sent based on booking lifecycle stage. Values are kept short +
// title-cased so they match the most common GHL option configs.
function mapConversionStatus(args: {
  status?: string | null;
  paymentStatus?: string | null;
  isRecurring?: boolean | null;
}): string {
  const s = (args.status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return 'Lost';
  if (s === 'completed') return 'Closed Won';
  if (args.isRecurring) return 'Recurring Active';
  if (s === 'confirmed' || args.paymentStatus === 'deposit_paid' || args.paymentStatus === 'paid') {
    return 'Booked';
  }
  if (s === 'pending') return 'Offer Sent';
  return 'New Lead';
}

// ─── Subscription Status / Lifecycle Stage (SINGLE_OPTIONS) ───────────
function mapSubscriptionStatus(args: {
  status?: string | null;
  isRecurring?: boolean | null;
  recurringActive?: boolean | null;
}): string {
  const s = (args.status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return 'Churned';
  if (s === 'completed' && !args.isRecurring) return 'One-Time Customer';
  if (args.recurringActive) return 'Active Recurring';
  if (args.isRecurring) return 'Recurring Pending';
  if (s === 'confirmed') return 'Active';
  return 'Prospect';
}

// ─── Property Type ────────────────────────────────────────────────────
const PROPERTY_TYPE_LABEL: Record<string, string> = {
  house: 'House',
  single_family: 'House',
  apartment: 'Apartment',
  condo: 'Condo',
  townhouse: 'Townhouse',
  office_space: 'Office',
  mansion: 'House',
  mobile_home: 'House',
  other: 'House',
};

// ─── Home size friendly label ─────────────────────────────────────────
function homeSizeFriendly(homeSize?: string | null): string {
  if (!homeSize) return '';
  if (/^\d+_\d+$/.test(homeSize)) {
    const [lo, hi] = homeSize.split('_').map(Number);
    const fmt = (n: number) => n.toLocaleString('en-US');
    return `${fmt(lo)}–${fmt(hi)} sq ft`;
  }
  if (homeSize.includes('_plus') || homeSize.endsWith('+')) {
    return homeSize.replace(/_plus$/, '+').replace(/_/g, ' ');
  }
  return homeSize;
}

function homeSizeMidpoint(homeSize?: string | null): number | '' {
  if (!homeSize) return '';
  if (/^\d+_\d+$/.test(homeSize)) {
    const [lo, hi] = homeSize.split('_').map(Number);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return '';
    return Math.round((lo + hi) / 2);
  }
  return '';
}

// ─── Money helpers (booking columns store decimals, GHL wants numbers) ──
function moneyToCents(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return null;
  return Math.round(Number(n) * 100);
}

// ─── Tracking Attribution canonical value ─────────────────────────────
function deriveTrackingAttribution(args: {
  utmSource?: string | null;
  utmMedium?: string | null;
  fbLeadId?: string | null;
  gclid?: string | null;
  attributionMethod?: string | null;
  landingPage?: string | null;
}): string {
  if (args.attributionMethod) return args.attributionMethod;
  if (args.fbLeadId) return 'Meta Ads';
  if (args.gclid) return 'Google Ads';
  const src = (args.utmSource || '').toLowerCase();
  if (src === 'facebook' || src === 'fb') return 'Meta Ads';
  if (src === 'instagram' || src === 'ig') return 'Instagram';
  if (src === 'google') return 'Google';
  if (src === 'referral') return 'Referral';
  if (src === 'organic' || src === 'seo') return 'Organic';
  if (src === 'direct') return 'Direct';
  if (args.landingPage) return 'Web';
  return '';
}

/**
 * Build the full custom-field bag for a booking event. Pass it directly
 * into `client.syncBookingLifecycle({ contact: { customFieldsByKey: ... } })`
 * or `client.upsertContact({ customFieldsByKey: ... })`.
 *
 * Returns an object keyed by GHL `fieldKey` (bare form). The ghl-client
 * resolves each key to its GHL custom-field UUID. Empty / null / blank
 * values are filtered out so a partially-populated booking row never
 * overwrites already-populated GHL fields with blanks.
 */
export function buildGhlBookingFields(args: {
  booking: BookingRowLike;
  customer?: CustomerRowLike | null;
  extras?: MapperExtras;
}): Record<string, unknown> {
  const b = args.booking || {};
  const c = args.customer || {};
  const origin = (args.extras?.publicOrigin || 'https://app.alphaluxclean.com').replace(/\/$/, '');

  const slot = slotToWindow(b.time_slot || b.preferred_time_block || b.service_time_window);
  const arrivalWindow = slot?.window || '';
  const serviceStart = slot?.start || '';
  const serviceEnd = slot?.end || '';

  const propertyDetails = (b.property_details || {}) as Record<string, unknown>;
  const pricingBreakdown = (b.pricing_breakdown || {}) as Record<string, unknown>;
  const utms = (b.utms || {}) as Record<string, unknown>;

  // Property details (jsonb) commonly carries the bedroom/bathroom +
  // dwelling/flooring snapshot the customer chose during booking.
  const bedrooms = propertyDetails.bedrooms ?? null;
  const bathrooms = propertyDetails.bathrooms ?? null;
  const dwelling = propertyDetails.dwelling_type || propertyDetails.property_type || null;
  const flooring = propertyDetails.flooring || null;
  const pets = propertyDetails.pets || null;
  const sqftFromProperty = propertyDetails.sqft || null;

  // Sqft surfacing: prefer the explicit numeric sqft, fall back to the
  // home_size midpoint, fall back to the raw home_size slug (e.g.
  // "1000_1500"). The dynamic resolver normalizes both to `sqft`.
  const sqftValue = sqftFromProperty
    ?? homeSizeMidpoint(b.home_size)
    ?? b.home_size
    ?? '';

  // Money: AlphaLux columns store decimals ("295.00"). GHL MONETORY
  // accepts numbers; we send `$X.XX` strings via fmtMoney for clarity
  // because every existing AlphaLux GHL automation parses dollar
  // strings off these fields.
  const finalCost = b.est_price ?? b.base_price ?? null;
  const finalCostCents = moneyToCents(finalCost);
  const baseCents = moneyToCents(b.base_price ?? null);
  const depositCents = moneyToCents(b.deposit_amount ?? null);
  const balanceCents = moneyToCents(b.balance_due ?? null);
  const promoDiscountCents = typeof b.promo_discount_cents === 'number' ? b.promo_discount_cents : null;
  const mrrCents = moneyToCents(b.mrr ?? null);
  const arrCents = moneyToCents(b.arr ?? null);

  // Optional pricing-breakdown sub-values (90-day plan monthly etc.) —
  // surfaced into the existing AlphaLux `mrr_est` field for ops
  // dashboards when present.
  const monthlyAmount = (pricingBreakdown as any).monthlyAmount as number | undefined;
  const firstCleanBalance = (pricingBreakdown as any).firstCleanBalance as number | undefined;
  const finalPriceBreakdown = (pricingBreakdown as any).finalPrice as number | undefined;

  // Second-visit (combo) data lives inside property_details — surface
  // a single readable string into entry_instructions / urgency-style
  // fields so ops can read it without diving into JSONB.
  const secondVisit = (propertyDetails as any).second_visit as
    | { date?: string; time_slot?: string; type?: string }
    | undefined;

  // Manage link — single source of truth for /order-status links.
  const manageLink = b.manage_token
    ? `${origin}/order-status?token=${b.manage_token}`
    : '';

  // Referral link — uses the AlphaLux booking origin.
  const referralLink = b.referrer_code
    ? `${origin}/book/zip?ref=${b.referrer_code}`
    : '';

  // Service date + arrival window combined ("2026-05-25 · 1 – 3 PM").
  const serviceDateTime = b.service_date && arrivalWindow
    ? `${b.service_date} \u00b7 ${arrivalWindow}`
    : (b.service_date || '');

  // Build a single text blob for entry_instructions that ALWAYS
  // surfaces the most actionable customer-supplied context (special
  // instructions + combo second-visit date when present) so the
  // cleaning team and GHL workflows always see it.
  const entryInstructionsParts: string[] = [];
  if (b.special_instructions) entryInstructionsParts.push(String(b.special_instructions).trim());
  if (b.notes && (!b.special_instructions || b.notes !== b.special_instructions)) {
    entryInstructionsParts.push(String(b.notes).trim());
  }
  if (secondVisit?.date) {
    const sv = slotToWindow(secondVisit.time_slot)?.window || '';
    entryInstructionsParts.push(
      `2nd visit (${secondVisit.type || 'standard'}): ${secondVisit.date}${sv ? ` · ${sv}` : ''}`,
    );
  }
  const entryInstructions = entryInstructionsParts.filter(Boolean).join(' | ');

  // Build the field bag. Keys are bare fieldKeys; ghl-client resolves
  // them via the live custom-field map + a snapshotted fallback id.
  const map: Record<string, unknown> = {
    // ─── Service & Scheduling ─────────────────────────────────
    service_type: SERVICE_TYPE_LABEL[b.service_type || ''] || b.service_type || '',
    frequency: b.frequency || '',
    service_frequency: SERVICE_FREQUENCY_LABEL[b.frequency || ''] || b.frequency || '',
    service_date: b.service_date || '',
    service_date__time: serviceDateTime,
    service_start_time: serviceStart,
    service_end_time: serviceEnd,
    urgency: b.offer_name || b.offer_type || '',

    // ─── Property ────────────────────────────────────────────
    sqft: sqftValue ?? '',
    bedrooms: bedrooms ?? '',
    bathrooms: bathrooms ?? '',
    property_type: PROPERTY_TYPE_LABEL[String(dwelling || '').toLowerCase()] || dwelling || '',
    flooring: flooring || '',
    entry_instructions: entryInstructions,
    preferred_contact_method: (propertyDetails as any).preferred_contact_method || '',

    // ─── Lifecycle / status ──────────────────────────────────
    // SINGLE_OPTIONS — values must match GHL options.
    conversion_status: mapConversionStatus({
      status: b.status,
      paymentStatus: b.payment_status,
      isRecurring: b.is_recurring,
    }),
    subscription_status: mapSubscriptionStatus({
      status: b.status,
      isRecurring: b.is_recurring,
      recurringActive: b.recurring_active,
    }),

    // ─── Pricing & payments ──────────────────────────────────
    booking_amount: fmtMoney(finalCostCents),
    original_price: fmtMoney(baseCents),
    deposit_amount: fmtMoney(depositCents),
    remaining_balance: fmtMoney(balanceCents),
    cancel_fee_amount: '', // populated by cancel-booking when fee applies
    discount_cash_value: fmtMoney(promoDiscountCents),
    promo_code: b.promo_code || '',
    mrr_est: fmtMoney(
      mrrCents
        ?? (monthlyAmount ? Math.round(monthlyAmount * 100) : null)
        ?? (firstCleanBalance ? Math.round(firstCleanBalance * 100) : null),
    ),
    arr_est: fmtMoney(arrCents ?? null),

    // ─── Stripe + receipts ───────────────────────────────────
    stripe_id: b.stripe_payment_intent_id || b.stripe_checkout_session_id || b.stripe_subscription_id || '',
    payment_link: b.receipt_url || '',
    invoice_link: b.balance_invoice_url || '',
    manage_link: manageLink,

    // ─── Referral ────────────────────────────────────────────
    referral_code: b.referrer_code || '',
    referral_link: referralLink,

    // ─── Attribution ─────────────────────────────────────────
    utm_source: utms.utm_source || '',
    utm_medium: utms.utm_medium || '',
    utm_campaign: utms.utm_campaign || '',
    utm_content: utms.utm_content || '',
    landing_page: utms.landing_page || '',
    utm_fields: utms && Object.keys(utms).length > 0 ? JSON.stringify(utms) : '',
    fb_lead_id: utms.fb_lead_id || '',
    tracking_attribution: deriveTrackingAttribution({
      utmSource: utms.utm_source as string | undefined,
      utmMedium: utms.utm_medium as string | undefined,
      fbLeadId: utms.fb_lead_id as string | undefined,
      gclid: utms.gclid as string | undefined,
      attributionMethod: b.attribution_method,
      landingPage: utms.landing_page as string | undefined,
    }),
  };

  // Reserved for future GHL fields — these aren't in the location's
  // custom-field set today (verified 2026-05-17), but if ops add them
  // tomorrow the dynamic resolver picks them up without a code change.
  if (b.offer_type) map.offer_type = b.offer_type;
  if (b.offer_name) map.offer_name = b.offer_name;
  if (b.visit_count !== undefined && b.visit_count !== null) map.visit_count = b.visit_count;
  map.is_recurring = ynBool(b.is_recurring);
  if (b.status) map.booking_status = b.status;
  if (b.payment_status) map.payment_status = b.payment_status;
  if (b.paid_at) map.paid_at = b.paid_at;
  if (b.created_at) map.booking_created_at = b.created_at;
  if (b.stripe_account_slug) map.stripe_account = b.stripe_account_slug;
  if (b.hcp_job_id) map.hcp_job_id = b.hcp_job_id;
  if (homeSizeFriendly(b.home_size)) map.home_size_label = homeSizeFriendly(b.home_size);
  if (b.home_size) map.home_size = b.home_size;
  if (b.sqft_or_bedrooms) map.bedrooms_bathrooms = b.sqft_or_bedrooms;
  if (pets) map.pets = pets;
  if (finalPriceBreakdown) map.final_price = finalPriceBreakdown;
  if (monthlyAmount) map.monthly_amount = monthlyAmount;
  if (firstCleanBalance) map.first_clean_balance = firstCleanBalance;
  if (secondVisit?.date) {
    map.second_visit_date = secondVisit.date;
    map.second_visit_time_slot = secondVisit.time_slot || '';
    map.second_visit_type = secondVisit.type || 'standard';
  }
  if (arrivalWindow) {
    map.arrival_window = arrivalWindow;
    map.service_arrival_window = arrivalWindow;
  }

  // City / state aren't custom fields — they go on the contact body —
  // but ops occasionally adds them as custom fields too. Surfacing as
  // soft-references is harmless (no GHL match → skipped silently).
  if (c.city) map.service_city = c.city;
  if (c.state) map.service_state = c.state;
  if (b.zip_code || c.postal_code) map.service_zip = b.zip_code || c.postal_code;

  return map;
}

/**
 * Tag bag for a booking lifecycle event. Mirrors the existing
 * ghl-sync-booking tag list but centralizes it so reconcile-ghl,
 * cancel-booking, complete-booking, etc. all emit consistent tags.
 */
export function buildBookingTags(b: BookingRowLike): string[] {
  const tags: string[] = ['customer'];
  if (b.status === 'completed') tags.push('customer - completed');
  else if (b.status === 'cancelled' || b.status === 'canceled') tags.push('customer - cancelled');
  else if (b.status === 'confirmed') tags.push('lead - booked');
  else tags.push('lead - in progress');

  tags.push('alphaluxclean-txca');
  if (b.service_type) tags.push(`service-${String(b.service_type).toLowerCase()}`);
  if (b.frequency) tags.push(`freq-${String(b.frequency).toLowerCase()}`);
  if (b.is_recurring) tags.push('recurring');
  if (b.promo_code) tags.push(`promo-${String(b.promo_code).toLowerCase()}`);
  if (b.offer_type) tags.push(`offer-${String(b.offer_type).toLowerCase()}`);
  return tags;
}

/**
 * Opportunity status derived from the booking row.
 */
export function bookingToOppStatus(status?: string | null): 'open' | 'won' | 'lost' | 'abandoned' {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return 'lost';
  if (s === 'completed') return 'won';
  if (s === 'abandoned' || s === 'expired') return 'abandoned';
  return 'open';
}
