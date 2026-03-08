import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookInput {
  booking_id?: string;
  session_id?: string;
  payment_intent_id?: string;
  setup_intent_id?: string;
  trigger_event?: string;
  action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: WebhookInput = await req.json();
    console.log('🚀 Enhanced webhook v2 - Processing booking webhook:', {
      input,
      timestamp: new Date().toISOString(),
      function_version: 'v2_booking_format'
    });

    // Get booking data with multiple lookup strategies
    let bookingData = null;
    let lookupMethod = '';
    const lookupAttempts = [];
    
    // Strategy 1: Try booking_id (exact match)
    if (input.booking_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 1: Trying booking_id lookup: ${input.booking_id}`);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers!customer_id(*)
        `)
        .eq('id', input.booking_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'booking_id', identifier: input.booking_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        bookingData = data;
        lookupMethod = 'booking_id';
        console.log(`✅ Found booking by booking_id: ${bookingData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Booking_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Strategy 2: Try session_id (stripe_checkout_session_id)
    if (!bookingData && input.session_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 2: Trying session_id lookup: ${input.session_id}`);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers!customer_id(*)
        `)
        .eq('stripe_checkout_session_id', input.session_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'stripe_checkout_session_id', identifier: input.session_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        bookingData = data;
        lookupMethod = 'stripe_checkout_session_id';
        console.log(`✅ Found booking by session_id: ${bookingData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Session_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Strategy 3: Try payment_intent_id
    if (!bookingData && (input.payment_intent_id || input.session_id)) {
      const identifier = input.payment_intent_id || input.session_id;
      const startLookup = Date.now();
      console.log(`🔍 Strategy 3: Trying payment_intent_id lookup: ${identifier}`);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers!customer_id(*)
        `)
        .eq('stripe_payment_intent_id', identifier)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'stripe_payment_intent_id', identifier, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        bookingData = data;
        lookupMethod = 'stripe_payment_intent_id';
        console.log(`✅ Found booking by payment_intent_id: ${bookingData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Payment_intent_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Helper functions for webhook payload generation
    function normalizeServiceType(serviceType: string): string {
      const normalized = serviceType.toLowerCase();
      if (normalized.includes('deep')) return "Deep Clean";
      if (normalized.includes('move')) return "Move-In/Out";
      if (normalized.includes('commercial')) return "Commercial";
      return "Standard Clean";
    }

    function normalizeFrequency(frequency: string): string {
      const normalized = frequency.toLowerCase();
      if (normalized.includes('week') && normalized.includes('bi')) return "Bi-Weekly";
      if (normalized.includes('week')) return "Weekly";
      if (normalized.includes('month')) return "Monthly";
      return "One-Time";
    }

    function formatSquareFootageRange(sqft: number): string {
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

    function getFirstName(fullName: string): string {
      return fullName.split(' ')[0] || fullName;
    }

    function getLastName(fullName: string): string {
      const parts = fullName.split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : '';
    }

    function formatPhoneToE164(phone: string): string {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) return `+1${cleaned}`;
      if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
      return phone.startsWith('+') ? phone : `+1${cleaned}`;
    }

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

    // GHL-friendly date: MM/DD/YYYY
    function formatDateGHL(dateStr: string): string {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      return `${month}/${day}/${year}`;
    }

    // GHL-friendly time: h:mm AM/PM
    function formatTimeGHL(timeSlot: string): string {
      if (!timeSlot) return '';
      const parts = timeSlot.split('-').map(t => t.trim());
      return parts.map(t => {
        const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return t;
        let hours = parseInt(match[1]);
        const minutes = match[2];
        if (match[3]) return `${match[1]}:${minutes} ${match[3].toUpperCase()}`;
        const period = hours >= 12 ? 'PM' : 'AM';
        if (hours === 0) hours = 12;
        else if (hours > 12) hours -= 12;
        return `${hours}:${minutes} ${period}`;
      }).join(' - ');
    }

    // GHL-friendly datetime: MM/DD/YYYY h:mm AM/PM
    function formatDateTimeGHL(isoStr: string): string {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours === 0) hours = 12;
      else if (hours > 12) hours -= 12;
      return `${month}/${day}/${year} ${hours}:${minutes} ${period}`;
    }

    function calculateServiceStart(date: string, timeSlot: string): string {
      if (!date || !timeSlot) return '';
      return new Date(`${date}T${parseTimeSlot(timeSlot)}:00`).toISOString();
    }

    function calculateServiceEnd(date: string, timeSlot: string, durationHours: number): string {
      if (!date || !timeSlot) return '';
      const startTime = new Date(`${date}T${parseTimeSlot(timeSlot)}:00`);
      return new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000)).toISOString();
    }

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

    function calculateLTVScore(ltv: number): string {
      if (ltv > 1000) return "A+";
      if (ltv > 500) return "B+";
      return "C";
    }

    function generateReferralCode(fullName: string, zip: string): string {
      const firstName = getFirstName(fullName).toUpperCase().replace(/[^A-Z]/g, '');
      return `${firstName}${zip}`;
    }
    
    if (!bookingData) {
      console.error('🚨 All booking lookup strategies failed:', lookupAttempts);
      throw new Error(`Booking not found with provided identifiers. Tried: ${input.booking_id ? 'booking_id, ' : ''}${input.session_id ? 'session_id, payment_intent_id' : ''}`);
    }
    
    console.log(`🎯 Booking lookup successful via ${lookupMethod}: ${bookingData.id}`, { lookupAttempts });

    // Extract customer data
    const customer = bookingData.customers;
    
    console.log('📊 Booking data retrieved:', {
      booking_id: bookingData.id,
      customer_id: bookingData.customer_id || 'not_found',
      service_type: bookingData.service_type || 'not_specified',
      frequency: bookingData.frequency || 'not_specified',
      status: bookingData.status || 'unknown',
      customer_name: customer?.name || 'unknown'
    });

    // Parse service details from booking
    const serviceDetails = {
      type: bookingData.service_type || 'Standard',
      frequency: bookingData.frequency || 'One-time',
      sqft_range: bookingData.sqft_or_bedrooms || 'Unknown',
      date: bookingData.service_date || new Date().toISOString().split('T')[0],
      time: bookingData.time_slot || '09:00-17:00'
    };

    const addressInfo = {
      line1: customer.address_line1 || customer.address || '',
      line2: customer.address_line2 || '',
      city: customer.city || '',
      state: customer.state || '',
      zip: customer.postal_code || ''
    };

    const propertyDetails = bookingData.property_details || {};
    const specialInstructions = bookingData.special_instructions || '';
    const addons = bookingData.addons || [];

    // Extract and map property fields explicitly
    const propertyType = propertyDetails.dwelling_type || propertyDetails.dwellingType || '';
    const flooring = propertyDetails.flooring_type || propertyDetails.flooringType || '';
    
    // Calculate financial values
    let addOnsTotal = 0;
    const processedAddons = [];
    let addOnsTotal = 0;
    
    if (Array.isArray(addons)) {
      for (const addon of addons) {
        if (typeof addon === 'string') {
          const estimatedPrice = addon.toLowerCase().includes('window') ? 25 : 15;
          processedAddons.push({ name: addon, price: estimatedPrice });
          addOnsTotal += estimatedPrice;
        } else if (typeof addon === 'object' && addon.name) {
          processedAddons.push(addon);
          addOnsTotal += addon.price || 0;
        }
      }
    }
    
    // Calculate estimated duration based on sqft
    const sqft = parseInt(bookingData.sqft_or_bedrooms) || 2000;
    const estimatedHours = Math.max(2, Math.ceil(sqft / 1000));

    // Build the webhook payload in STANDARDIZED structure
    const payloadGenerationStart = Date.now();
    
    // Determine webhook type based on trigger event or booking status
    const webhookType = input.trigger_event || 
      (bookingData.frequency !== 'one_time' ? 'booking-confirmed-recurring' : 'booking-confirmed');
    
    // Check if this was an upgrade from one-time to recurring
    const wasUpgraded = bookingData.metadata?.upgraded_from_one_time || input.include_upgrade_metadata;
    
    // Referral code (computed once)
    const refCode = customer.referral_code || generateReferralCode(customer.name || 'Unknown', addressInfo.zip);
    
    // Service start/end (computed once)
    const serviceStartISO = calculateServiceStart(serviceDetails.date, serviceDetails.time);
    const serviceEndISO = calculateServiceEnd(serviceDetails.date, serviceDetails.time, estimatedHours);

    // Build the DEDUPLICATED webhook payload
    const webhookDataPayload = {
      // ── Root-level identifiers ──
      booking_id: `BK-${bookingData.id.slice(0, 5).toUpperCase()}`,
      booking_source: bookingData.source || 'customer_web',
      type: normalizeServiceType(serviceDetails.type),
      frequency: normalizeFrequency(serviceDetails.frequency),
      is_recurring: bookingData.is_recurring || false,
      sq_ft_range: formatSquareFootageRange(sqft),
      
      // ── Customer ──
      customer: {
        first_name: getFirstName(customer.name || 'Unknown'),
        last_name: getLastName(customer.name || 'Unknown'),
        email: customer.email || '',
        phone: formatPhoneToE164(customer.phone || ''),
        stripe_customer_id: customer?.stripe_customer_id || '',
      },
      
      // ── Address (includes property info) ──
      address: {
        street: addressInfo.line1 || '',
        city: addressInfo.city || '',
        state: addressInfo.state || 'TX',
        zip: addressInfo.zip || '',
        property_type: propertyType,
        flooring: flooring,
      },
      
      // ── Schedule (all date/time in one place) ──
      schedule: {
        date: serviceDetails.date,
        date_formatted: formatDateGHL(serviceDetails.date),
        time_window: serviceDetails.time,
        time_formatted: formatTimeGHL(serviceDetails.time),
        start_datetime: serviceStartISO,
        end_datetime: serviceEndISO,
        start_formatted: formatDateTimeGHL(serviceStartISO),
        end_formatted: formatDateTimeGHL(serviceEndISO),
        est_duration_hours: parseFloat(estimatedHours.toFixed(1)),
        recurring_start_date: bookingData.recurring_start_date || serviceDetails.date,
        recurring_start_date_formatted: formatDateGHL(bookingData.recurring_start_date || serviceDetails.date),
      },
      
      // ── Pricing (single source of truth for all money fields) ──
      pricing: {
        base_price: Number(bookingData.base_price) || 0,
        est_price: Number(bookingData.est_price) || 0,
        deposit_amount: Number(bookingData.deposit_amount) || 0,
        deposit_pct: 25,
        balance_due: Number(bookingData.balance_due) || 0,
        promo_code: bookingData.promo_code || '',
        promo_applied: bookingData.promo_applied || '',
        promo_discount_cents: bookingData.promo_discount_cents || 0,
        prepayment_discount_applied: bookingData.prepayment_discount_applied || false,
        prepayment_discount_amount: bookingData.prepayment_discount_amount || 0,
        addons: processedAddons,
        addons_total: addOnsTotal,
        mrr: Number(bookingData.mrr) || 0,
        arr: Number(bookingData.arr) || 0,
        expected_ltv: calculateLTV(serviceDetails.frequency, baseAmount),
        ltv_score: calculateLTVScore(bookingData.arr || 0),
        pricing_breakdown: bookingData.pricing_breakdown || {},
      },
      
      // ── Payment ──
      payment: {
        method: "Stripe",
        status: bookingData.status === 'confirmed' ? "Authorized" : "Pending",
        transaction_id: bookingData.stripe_payment_intent_id || bookingData.square_payment_id || '',
        receipt_url: bookingData.receipt_url || '',
        balance_invoice_url: bookingData.stripe_balance_invoice_id 
          ? `https://dashboard.stripe.com/invoices/${bookingData.stripe_balance_invoice_id}` 
          : '',
        payment_plan: (bookingData.deposit_amount && bookingData.deposit_amount > 0) ? 'deposit_first' : 'full_payment',
      },
      
      // ── Job (non-schedule work details) ──
      job: {
        bedrooms: propertyDetails.bedrooms || parseInt(bookingData.sqft_or_bedrooms) || 3,
        bathrooms: propertyDetails.bathrooms || 2,
        notes: specialInstructions,
        labor_rate_per_hour: 25,
        labor_cost_total: parseFloat((estimatedHours * 25).toFixed(2)),
        offer_name: bookingData.offer_name || 'Custom Service',
        offer_type: bookingData.offer_type || 'one_time',
        visit_count: bookingData.visit_count || 1,
        upgraded_from_onetime: wasUpgraded,
      },
      
      // ── Marketing ──
      marketing: {
        campaign: (bookingData.utms?.utm_campaign) || "Direct",
        ad_id: (bookingData.utms?.utm_content) || "",
        utm_source: (bookingData.utms?.utm_source) || "direct",
        utm_campaign: (bookingData.utms?.utm_campaign) || "",
      },
      
      // ── Referral ──
      referral: {
        code: refCode,
        link: `https://book.alphaluxclean.com/referral?code=${refCode}`,
        incentive: "$50 off next cleaning per referral",
        tracking_id: `REF-${Date.now().toString().slice(-5)}`,
      },
      
      // ── Meta ──
      meta: {
        origin: "lovable.io",
        environment: "production",
        version: "3.0.0",
        timestamp: new Date().toISOString(),
      },
    };
    
    // Wrap in STANDARDIZED format matching test webhooks
    const webhookPayload = {
      type: webhookType,
      data: webhookDataPayload,
      timestamp: new Date().toISOString(),
      source: "alphalux_booking_system"
    };

    const payloadGenerationTime = Date.now() - payloadGenerationStart;
    const payloadString = JSON.stringify(webhookPayload);
    const payloadSizeKb = Math.round(payloadString.length / 1024 * 100) / 100;
    
    console.log('📦 Webhook payload generated (v3 deduplicated):', {
      type: webhookPayload.type,
      booking_id: webhookPayload.data.booking_id,
      customer: webhookPayload.data.customer.email,
      service_type: webhookPayload.data.type,
      frequency: webhookPayload.data.frequency,
      is_recurring: webhookPayload.data.is_recurring,
      upgraded: webhookPayload.data.job.upgraded_from_onetime,
      est_price: webhookPayload.data.pricing.est_price,
      payload_size_kb: payloadSizeKb,
      generation_time_ms: payloadGenerationTime
    });

    // Get active webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('active', true);

    if (configError) {
      console.error('Error fetching webhook configs:', configError);
      throw new Error('Failed to fetch webhook configurations');
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log('No active webhook configurations found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active webhook configurations - data formatted but not sent',
        formatted_data: webhookPayload
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const results = [];
    
    // HARDCODED webhook destinations - always send booking data here
    const GHL_BOOKING_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/Lvvq87zxxbYFnaTEklYX/webhook-trigger/23d225e3-f4d6-4e0e-abf1-95c385b173ba';
    const ZAPIER_BOOKING_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/24603039/uxugxf1/';
    
    const hardcodedWebhooks = [
      { name: 'GoHighLevel_Bookings', url: GHL_BOOKING_WEBHOOK_URL },
      { name: 'Zapier_Bookings', url: ZAPIER_BOOKING_WEBHOOK_URL },
    ];
    
    console.log(`📡 Sending to ${hardcodedWebhooks.length} hardcoded webhook(s) + ${webhookConfigs.length} configured webhook(s)`);
    
    // Send to all hardcoded webhooks
    for (const hw of hardcodedWebhooks) {
      try {
        const hwStartTime = Date.now();
        console.log(`🚀 Sending booking data to ${hw.name}...`);
        
        const hwResponse = await fetch(hw.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AlphaLux-BookingWebhook/2.0'
          },
          body: payloadString
        });
        
        const hwResponseTime = Date.now() - hwStartTime;
        const hwResponseText = await hwResponse.text();
        
        console.log(`${hwResponse.ok ? '✅' : '❌'} ${hw.name}: ${hwResponse.status} (${hwResponseTime}ms)`);
        
        results.push({
          webhook: hw.name,
          url: hw.url,
          success: hwResponse.ok,
          status_code: hwResponse.status,
          response_time: hwResponseTime,
          response_preview: hwResponseText.slice(0, 200)
        });
      } catch (hwError) {
        console.error(`❌ ${hw.name} webhook failed:`, hwError.message);
        results.push({
          webhook: hw.name,
          url: hw.url,
          success: false,
          error: hwError.message
        });
      }
    }

    // Send webhook to each configured endpoint
    for (const config of webhookConfigs) {
      const webhookStartTime = Date.now();
      console.log(`🚀 Sending webhook to: ${config.name} (${config.url})`);
      
      let webhookResponse;
      let responseText = '';
      let isSuccess = false;
      
      try {
        webhookResponse = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AlphaLux-BookingWebhook/2.0',
            ...config.headers
          },
          body: payloadString
        });
        
        responseText = await webhookResponse.text();
        isSuccess = webhookResponse.ok;
        
        const responseTime = Date.now() - webhookStartTime;
        
        console.log(`${isSuccess ? '✅' : '❌'} ${config.name}: ${webhookResponse.status} (${responseTime}ms)`);
        
        // Log delivery result
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            booking_id: bookingData.id,
            payload: webhookPayload,
            response_status: webhookResponse.status,
            response_body: responseText,
            response_headers: Object.fromEntries(webhookResponse.headers.entries()),
            delivered_at: isSuccess ? new Date().toISOString() : null,
            error_message: isSuccess ? null : `HTTP ${webhookResponse.status}: ${responseText}`,
            attempts: 1
          });
        
        results.push({
          webhook: config.name,
          url: config.url,
          success: isSuccess,
          status_code: webhookResponse.status,
          response_time: responseTime,
          response_preview: responseText.slice(0, 200)
        });
        
      } catch (error) {
        const responseTime = Date.now() - webhookStartTime;
        console.error(`❌ ${config.name} failed (${responseTime}ms):`, error.message);
        
        // Log failed delivery
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            booking_id: bookingData.id,
            payload: webhookPayload,
            error_message: error.message,
            attempts: 1
          });
        
        results.push({
          webhook: config.name,
          url: config.url,
          success: false,
          error: error.message,
          response_time: responseTime
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`🏁 Webhook delivery completed: ${successCount}/${results.length} successful (${totalTime}ms total)`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Webhook delivery completed: ${successCount}/${results.length} successful`,
      booking_id: bookingData.id,
      results,
      formatted_data: webhookPayload,
      performance: {
        total_time: totalTime,
        payload_generation_time: payloadGenerationTime,
        payload_size_kb: payloadSizeKb
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Enhanced webhook v2 error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      function: 'enhanced-booking-webhook-v2'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
