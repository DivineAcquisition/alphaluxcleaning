import { supabase } from "@/integrations/supabase/client";

export interface WebhookPayload {
  booking_id: string;
  timestamp: string;
  source: string;
  state: "NY";
  service_type: string;
  sq_ft_range: string;
  frequency: string;
  discount_applied: boolean;
  discount_rate: number;
  price_before_discount: number;
  price_after_discount: number;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  job_details: {
    property_type: string;
    flooring: string;
    bedrooms: number;
    bathrooms: number;
    notes: string;
    preferred_date: string;
    preferred_time_window: string;
    service_start_datetime: string;
    service_end_datetime: string;
    est_duration_hours: number;
    labor_rate_per_hour: number;
    labor_cost_total: number;
  };
  payment: {
    payment_method: string;
    payment_status: string;
    transaction_id: string;
    amount_paid: number;
  };
  marketing: {
    campaign: string;
    ad_id: string;
    utm_source: string;
    utm_campaign: string;
  };
  ltv_metrics: {
    expected_ltv: number;
    expected_recurring_frequency: string;
    customer_segment: string;
    ltv_score: string;
  };
  referral_program: {
    referral_code: string;
    referral_link: string;
    referral_incentive: string;
    referral_tracking_id: string;
  };
  system_meta: {
    origin: string;
    environment: string;
    version: string;
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
    dwellingType?: string;
    flooringType?: string;
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
    discountAmount?: number;
    discountRate?: number;
  };
  paymentInfo?: {
    paymentIntentId?: string;
    subscriptionId?: string;
    sessionId?: string;
  };
}

// Helper function to determine square footage range
function getSquareFootageRange(sqft: number): string {
  if (sqft <= 1000) return "Under 1,000";
  if (sqft <= 1500) return "1,001–1,500";
  if (sqft <= 2000) return "1,501–2,000";
  if (sqft <= 2500) return "2,001–2,500";
  if (sqft <= 3000) return "2,501–3,000";
  if (sqft <= 3500) return "3,001–3,500";
  if (sqft <= 4000) return "3,501–4,000";
  if (sqft <= 4500) return "4,001–4,500";
  return "4,501+";
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
function normalizeServiceType(serviceType: string): string {
  const normalized = serviceType.toLowerCase();
  if (normalized.includes('deep')) return "Deep Clean";
  if (normalized.includes('move')) return "Move-In/Out";
  if (normalized.includes('commercial')) return "Commercial";
  return "Standard Clean";
}

// Helper function to normalize frequency
function normalizeFrequency(frequency: string): string {
  const normalized = frequency.toLowerCase();
  if (normalized.includes('week') && normalized.includes('bi')) return "Bi-Weekly";
  if (normalized.includes('week')) return "Weekly";
  if (normalized.includes('month')) return "Monthly";
  return "One-Time";
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

// Helper function to calculate LTV
function calculateLTV(frequency: string, totalAmount: number): number {
  const normalized = frequency.toLowerCase();
  if (normalized.includes('one-time') || normalized.includes('onetime')) {
    return totalAmount;
  }
  
  let multiplier = 0;
  if (normalized.includes('week') && normalized.includes('bi')) {
    multiplier = 26; // Bi-weekly for 1 year
  } else if (normalized.includes('week')) {
    multiplier = 52; // Weekly for 1 year
  } else if (normalized.includes('month')) {
    multiplier = 12; // Monthly for 1 year
  }
  
  return Math.round(totalAmount * multiplier * 100) / 100;
}

// Helper function to calculate estimated duration
function calculateEstimatedDuration(sqft: number, serviceType: string): number {
  const baseHours = sqft / 500; // Base: 500 sqft per hour
  const isDeep = serviceType.toLowerCase().includes('deep');
  return Math.round((baseHours * (isDeep ? 1.5 : 1)) * 10) / 10;
}

// Helper function to parse time slot to 24-hour format
function parseTimeSlot(timeSlot: string): string {
  const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '09:00';
  
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Helper function to generate referral code
function generateReferralCode(firstName: string, zip: string): string {
  const cleanFirst = firstName.toUpperCase().replace(/[^A-Z]/g, '');
  return `${cleanFirst}${zip}`;
}

export function createWebhookPayload(
  bookingData: BookingData,
  bookingId?: string
): WebhookPayload {
  const utms = extractUtmParams();
  const normalizedFrequency = normalizeFrequency(bookingData.serviceDetails.frequency);
  const normalizedServiceType = normalizeServiceType(bookingData.serviceDetails.serviceType);
  
  const totalAmount = bookingData.pricing?.totalAmount || 0;
  const discountAmount = bookingData.pricing?.discountAmount || 0;
  const discountRate = bookingData.pricing?.discountRate || 0;
  const priceBeforeDiscount = discountAmount > 0 ? totalAmount + discountAmount : totalAmount;
  
  const estDurationHours = calculateEstimatedDuration(
    bookingData.serviceDetails.squareFootage,
    normalizedServiceType
  );
  const laborRatePerHour = 25;
  const laborCostTotal = Math.round(estDurationHours * laborRatePerHour * 100) / 100;
  
  const referralCode = generateReferralCode(
    bookingData.customerInfo.firstName,
    bookingData.customerInfo.address.postalCode
  );
  
  const expectedLTV = calculateLTV(normalizedFrequency, totalAmount);
  
  const payload: WebhookPayload = {
    booking_id: bookingId || `BK-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    source: "lovable-booking-ui",
    state: bookingData.customerInfo.address.state as "NY",
    service_type: normalizedServiceType,
    sq_ft_range: getSquareFootageRange(bookingData.serviceDetails.squareFootage),
    frequency: normalizedFrequency,
    discount_applied: discountAmount > 0,
    discount_rate: discountRate,
    price_before_discount: priceBeforeDiscount,
    price_after_discount: totalAmount,
    
    customer: {
      first_name: bookingData.customerInfo.firstName,
      last_name: bookingData.customerInfo.lastName,
      email: bookingData.customerInfo.email,
      phone: formatPhoneToE164(bookingData.customerInfo.phone),
    },
    
    address: {
      street: bookingData.customerInfo.address.line1,
      city: bookingData.customerInfo.address.city,
      state: bookingData.customerInfo.address.state,
      zip: bookingData.customerInfo.address.postalCode,
    },
    
    job_details: {
      property_type: bookingData.serviceDetails.dwellingType || "",
      flooring: bookingData.serviceDetails.flooringType || "",
      bedrooms: bookingData.serviceDetails.bedrooms,
      bathrooms: bookingData.serviceDetails.bathrooms,
      notes: bookingData.serviceDetails.specialInstructions || "",
      preferred_date: bookingData.schedulingInfo?.selectedDate || "",
      preferred_time_window: bookingData.schedulingInfo?.selectedTimeSlot || "",
      service_start_datetime: bookingData.schedulingInfo?.selectedDate && bookingData.schedulingInfo?.selectedTimeSlot
        ? new Date(`${bookingData.schedulingInfo.selectedDate}T${parseTimeSlot(bookingData.schedulingInfo.selectedTimeSlot)}:00`).toISOString()
        : "",
      service_end_datetime: bookingData.schedulingInfo?.selectedDate && bookingData.schedulingInfo?.selectedTimeSlot
        ? new Date(new Date(`${bookingData.schedulingInfo.selectedDate}T${parseTimeSlot(bookingData.schedulingInfo.selectedTimeSlot)}:00`).getTime() + (estDurationHours * 60 * 60 * 1000)).toISOString()
        : "",
      est_duration_hours: estDurationHours,
      labor_rate_per_hour: laborRatePerHour,
      labor_cost_total: laborCostTotal,
    },
    
    payment: {
      payment_method: "Stripe",
      payment_status: bookingData.paymentInfo?.paymentIntentId ? "Authorized" : "Pending",
      transaction_id: bookingData.paymentInfo?.paymentIntentId || "",
      amount_paid: totalAmount,
    },
    
    marketing: {
      campaign: utms.utm_campaign || "Direct",
      ad_id: utms.utm_content || "",
      utm_source: utms.utm_source || "direct",
      utm_campaign: utms.utm_campaign || "",
    },
    
    ltv_metrics: {
      expected_ltv: expectedLTV,
      expected_recurring_frequency: normalizedFrequency,
      customer_segment: "Residential",
      ltv_score: expectedLTV > 1000 ? "A+" : expectedLTV > 500 ? "B+" : "C",
    },
    
    referral_program: {
      referral_code: referralCode,
      referral_link: `https://book.alphaluxclean.com/referral?code=${referralCode}`,
      referral_incentive: "$50 off next cleaning per referral",
      referral_tracking_id: `REF-${Date.now().toString().slice(-5)}`,
    },
    
    system_meta: {
      origin: "lovable.io",
      environment: window.location.hostname.includes('localhost') ? "development" : "production",
      version: "1.5.0",
    },
  };

  return payload;
}

export async function emitWebhook(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Emitting webhook for booking:", payload.booking_id);

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