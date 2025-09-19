import { supabase } from "@/integrations/supabase/client";

export interface WebhookPayload {
  type: "LEAD_CREATED" | "BOOKING_CONFIRMED";
  idempotency_key: string;
  emitted_at: string;
  env: "prod" | "dev";
  source: {
    channel: "META" | "UI_DIRECT" | "REENGAGE" | "GG_LOCAL";
    utms: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
    };
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: "CA" | "TX" | "NY";
    postal_code: string;
  };
  service: {
    service_type: "Standard" | "Deep" | "Move-In/Out" | "Commercial";
    frequency: "One-time" | "Weekly" | "Bi-Weekly" | "Monthly";
    sqft_tier: "1000-1500" | "1501-2500" | "2501-3500" | "3501-4500" | "4501+";
    sqft_exact: number;
    bedrooms: number;
    bathrooms: number;
    addons: string[];
    notes: string;
  };
  schedule?: {
    service_date: string;
    time_window: string;
  };
  pricing?: {
    currency: "USD";
    labor_basis_per_hr_team: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  stripe?: {
    checkout_mode?: "payment" | "subscription";
    checkout_session_id?: string;
    payment_intent_id?: string;
    subscription_id?: string;
  };
  revenue_estimates?: {
    estimated_mrr: number;
    estimated_arr: number;
    revenue_model: "one-time" | "recurring";
    frequency_multiplier: number;
  };
  metadata?: {
    booking_id?: string;
    manage_link?: string;
    ghl_contact_id?: string;
    hcp_customer_id?: string;
    hcp_job_id?: string;
  };
}

export interface BookingData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  serviceDetails: {
    serviceType: string;
    frequency: string;
    squareFootage: number;
    bedrooms: number;
    bathrooms: number;
    addOns: string[];
    specialInstructions?: string;
  };
  schedulingInfo?: {
    selectedDate: string;
    selectedTimeSlot: string;
  };
  pricing?: {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  };
  paymentInfo?: {
    paymentIntentId?: string;
    subscriptionId?: string;
    sessionId?: string;
  };
}

// Helper function to determine square footage tier
function getSquareFootageTier(sqft: number): "1000-1500" | "1501-2500" | "2501-3500" | "3501-4500" | "4501+" {
  if (sqft <= 1500) return "1000-1500";
  if (sqft <= 2500) return "1501-2500";
  if (sqft <= 3500) return "2501-3500";
  if (sqft <= 4500) return "3501-4500";
  return "4501+";
}

// Helper function to format phone number to E.164
function formatPhoneToE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+1${cleaned}`;
}

// Helper function to normalize service type
function normalizeServiceType(serviceType: string): "Standard" | "Deep" | "Move-In/Out" | "Commercial" {
  const normalized = serviceType.toLowerCase();
  if (normalized.includes('deep')) return "Deep";
  if (normalized.includes('move')) return "Move-In/Out";
  if (normalized.includes('commercial')) return "Commercial";
  return "Standard";
}

// Helper function to normalize frequency
function normalizeFrequency(frequency: string): "One-time" | "Weekly" | "Bi-Weekly" | "Monthly" {
  const normalized = frequency.toLowerCase();
  if (normalized.includes('week') && normalized.includes('bi')) return "Bi-Weekly";
  if (normalized.includes('week')) return "Weekly";
  if (normalized.includes('month')) return "Monthly";
  return "One-time";
}

// Helper function to extract UTM parameters from URL
function extractUtmParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
} {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
  };
}

// Helper function to determine source channel
function determineSourceChannel(utms: any): "META" | "UI_DIRECT" | "REENGAGE" | "GG_LOCAL" {
  if (utms.utm_source === 'facebook' || utms.utm_source === 'instagram') return "META";
  if (utms.utm_source === 'google' && utms.utm_medium === 'local') return "GG_LOCAL";
  if (utms.utm_campaign?.includes('reengage')) return "REENGAGE";
  return "UI_DIRECT";
}

// Helper function to calculate revenue estimates
function calculateRevenueEstimates(
  frequency: "One-time" | "Weekly" | "Bi-Weekly" | "Monthly",
  totalAmount: number
): {
  estimated_mrr: number;
  estimated_arr: number;
  revenue_model: "one-time" | "recurring";
  frequency_multiplier: number;
} {
  if (frequency === "One-time") {
    return {
      estimated_mrr: 0,
      estimated_arr: 0,
      revenue_model: "one-time",
      frequency_multiplier: 0,
    };
  }

  let monthlyMultiplier = 0;
  
  switch (frequency) {
    case "Weekly":
      monthlyMultiplier = 4.33; // ~52 weeks / 12 months
      break;
    case "Bi-Weekly":
      monthlyMultiplier = 2.17; // ~26 bi-weeks / 12 months
      break;
    case "Monthly":
      monthlyMultiplier = 1;
      break;
  }

  const estimatedMRR = totalAmount * monthlyMultiplier;
  const estimatedARR = estimatedMRR * 12;

  return {
    estimated_mrr: Math.round(estimatedMRR * 100) / 100, // Round to 2 decimal places
    estimated_arr: Math.round(estimatedARR * 100) / 100,
    revenue_model: "recurring",
    frequency_multiplier: monthlyMultiplier,
  };
}

export function createWebhookPayload(
  type: "LEAD_CREATED" | "BOOKING_CONFIRMED",
  bookingData: BookingData,
  idempotencyKey: string,
  bookingId?: string
): WebhookPayload {
  const utms = extractUtmParams();
  const sourceChannel = determineSourceChannel(utms);

  const payload: WebhookPayload = {
    type,
    idempotency_key: idempotencyKey,
    emitted_at: new Date().toISOString(),
    env: window.location.hostname.includes('localhost') ? "dev" : "prod",
    source: {
      channel: sourceChannel,
      utms,
    },
    customer: {
      first_name: bookingData.customerInfo.firstName,
      last_name: bookingData.customerInfo.lastName,
      email: bookingData.customerInfo.email,
      phone: formatPhoneToE164(bookingData.customerInfo.phone),
    },
    address: {
      line1: bookingData.customerInfo.address.line1,
      line2: bookingData.customerInfo.address.line2 || null,
      city: bookingData.customerInfo.address.city,
      state: bookingData.customerInfo.address.state as "CA" | "TX" | "NY",
      postal_code: bookingData.customerInfo.address.postalCode,
    },
    service: {
      service_type: normalizeServiceType(bookingData.serviceDetails.serviceType),
      frequency: normalizeFrequency(bookingData.serviceDetails.frequency),
      sqft_tier: getSquareFootageTier(bookingData.serviceDetails.squareFootage),
      sqft_exact: bookingData.serviceDetails.squareFootage,
      bedrooms: bookingData.serviceDetails.bedrooms,
      bathrooms: bookingData.serviceDetails.bathrooms,
      addons: bookingData.serviceDetails.addOns,
      notes: bookingData.serviceDetails.specialInstructions || "",
    },
  };

  // Add schedule info for BOOKING_CONFIRMED
  if (type === "BOOKING_CONFIRMED" && bookingData.schedulingInfo) {
    payload.schedule = {
      service_date: bookingData.schedulingInfo.selectedDate,
      time_window: bookingData.schedulingInfo.selectedTimeSlot,
    };
  } else {
    payload.schedule = {
      service_date: "",
      time_window: "",
    };
  }

  // Add pricing info for BOOKING_CONFIRMED
  if (type === "BOOKING_CONFIRMED" && bookingData.pricing) {
    payload.pricing = {
      currency: "USD",
      labor_basis_per_hr_team: 50, // Base rate
      subtotal: bookingData.pricing.subtotal,
      tax: bookingData.pricing.taxAmount,
      total: bookingData.pricing.totalAmount,
    };
  } else {
    payload.pricing = {
      currency: "USD",
      labor_basis_per_hr_team: 50,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  // Add Stripe info for BOOKING_CONFIRMED
  if (type === "BOOKING_CONFIRMED" && bookingData.paymentInfo) {
    payload.stripe = {
      checkout_mode: bookingData.paymentInfo.subscriptionId ? "subscription" : "payment",
      checkout_session_id: bookingData.paymentInfo.sessionId,
      payment_intent_id: bookingData.paymentInfo.paymentIntentId,
      subscription_id: bookingData.paymentInfo.subscriptionId,
    };
  } else {
    payload.stripe = {};
  }

  // Add revenue estimates for BOOKING_CONFIRMED
  if (type === "BOOKING_CONFIRMED" && bookingData.pricing) {
    const revenueEstimates = calculateRevenueEstimates(
      normalizeFrequency(bookingData.serviceDetails.frequency),
      bookingData.pricing.totalAmount
    );
    payload.revenue_estimates = revenueEstimates;
  } else {
    // For LEAD_CREATED, estimate potential recurring value based on base pricing
    const estimatedTotal = bookingData.pricing?.totalAmount || 350; // Default estimate
    const revenueEstimates = calculateRevenueEstimates(
      normalizeFrequency(bookingData.serviceDetails.frequency),
      estimatedTotal
    );
    payload.revenue_estimates = revenueEstimates;
  }

  // Add metadata
  payload.metadata = {
    booking_id: bookingId || "",
    manage_link: bookingId ? `https://alphaluxclean.com/manage?token=${bookingId}` : "",
  };

  return payload;
}

export async function emitWebhook(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Emitting webhook:", payload.type, payload.idempotency_key);

    const { data, error } = await supabase.functions.invoke('emit-zapier-webhook', {
      body: payload,
    });

    if (error) {
      console.error("Webhook emission failed:", error);
      return { success: false, error: error.message };
    }

    console.log("Webhook emitted successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Webhook emission error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}