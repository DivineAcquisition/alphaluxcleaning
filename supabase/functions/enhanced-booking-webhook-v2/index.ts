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
    
    // Get customer's total booking count for analytics
    const { count: totalCustomerOrders } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', bookingData.customer_id);
    
    // Calculate estimated duration based on sqft
    const sqft = parseInt(bookingData.sqft_or_bedrooms) || 2000;
    const estimatedHours = Math.max(2, Math.ceil(sqft / 1000));
    const numberOfCleaners = 2;
    
    // Generate team assignments
    const cleanerAssignments = generateCleanerAssignments(numberOfCleaners, estimatedHours);
    const totalLaborCost = cleanerAssignments.reduce((sum, c) => sum + c.total_job_pay, 0);

    // Calculate pricing
    const baseAmount = Number(bookingData.est_price) || 0;
    
    // Parse add-ons
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
    
    // Calculate financial breakdown
    const baseServiceCost = Math.max(baseAmount - addOnsTotal, baseAmount * 0.85);
    const subtotalBeforeDiscount = baseAmount + (addOnsTotal * 0.25);
    const discountAmount = subtotalBeforeDiscount * 0.15;
    const taxRate = 8.75;
    const taxAmount = baseAmount * (taxRate / 100);

    // Build the webhook payload in OrderEntry format matching test data structure
    const payloadGenerationStart = Date.now();
    
    const webhookPayload = {
      // Root order object with all core details
      order: {
        id: bookingData.id,
        stripe_session_id: bookingData.stripe_checkout_session_id || '',
        amount: baseAmount,
        currency: "usd",
        status: "completed",
        customer_name: customer.name || 'Unknown Customer',
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        cleaning_type: serviceDetails.type === 'regular' ? 'regular_clean' : 
                       serviceDetails.type === 'deep' ? 'deep_clean' : 
                       serviceDetails.type === 'move' ? 'move_in_out' : 'regular_clean',
        frequency: serviceDetails.frequency,
        square_footage: sqft,
        property_details: {
          property_type: propertyType,
          flooring_type: flooring,
          bedrooms: propertyDetails.bedrooms || parseInt(bookingData.sqft_or_bedrooms) || 3,
          bathrooms: propertyDetails.bathrooms || 2,
          levels: propertyDetails.levels || 1,
          has_basement: propertyDetails.has_basement || false,
          has_garage: propertyDetails.has_garage !== false,
          dwelling_type: propertyType,
          special_instructions: specialInstructions
        },
        service_details: {
          service_type: serviceDetails.type,
          estimated_duration: `${estimatedHours}.0 hours`
        },
        scheduled_date: serviceDetails.date,
        scheduled_time: serviceDetails.time,
        created_at: bookingData.created_at,
        is_recurring: serviceDetails.frequency !== 'One-time' && serviceDetails.frequency !== 'one-time',
        add_ons: processedAddons
      },
      
      // Comprehensive order details section
      order_details: {
        order_id: bookingData.id,
        booking_reference: `ALX-${bookingData.id.slice(0, 8).toUpperCase()}`,
        customer: {
          id: bookingData.customer_id,
          name: customer.name || 'Unknown Customer',
          email: customer.email || '',
          phone: customer.phone || ''
        },
        service: {
          ...serviceDetails,
          special_requirements: specialInstructions ? [specialInstructions] : [],
          access_instructions: "Key under doormat",
          pets_present: false,
          parking_instructions: "Driveway available"
        },
        address: addressInfo,
        property: {
          property_type: propertyType,
          flooring: flooring,
          bedrooms: propertyDetails.bedrooms || parseInt(bookingData.sqft_or_bedrooms) || 3,
          bathrooms: propertyDetails.bathrooms || 2,
          levels: propertyDetails.levels || 1,
          has_basement: propertyDetails.has_basement || false,
          has_garage: propertyDetails.has_garage !== false,
          dwellingType: propertyType,
          flooringType: flooring,
          special_instructions: specialInstructions
        },
        pricing: {
          base_amount: baseServiceCost,
          total_amount: baseAmount,
          currency: 'USD',
          addons: processedAddons,
          discounts: discountAmount > 0 ? [{
            type: "one_time_service",
            description: "One-time service - 15% off",
            amount: discountAmount
          }] : [],
          taxes: taxAmount > 0 ? [{
            type: "sales_tax",
            rate: taxRate,
            amount: taxAmount
          }] : []
        },
        status: bookingData.status || 'confirmed',
        created_at: bookingData.created_at,
        updated_at: bookingData.updated_at || bookingData.created_at
      },

      // Team assignment with full cleaner details
      team_assignment: {
        number_of_cleaners: numberOfCleaners,
        lead_cleaner: cleanerAssignments[0],
        supporting_cleaners: cleanerAssignments.slice(1),
        cleaner_assignments: cleanerAssignments,
        total_labor_cost: parseFloat(totalLaborCost.toFixed(2)),
        labor_distribution: "split_evenly",
        estimated_completion_time: `${estimatedHours}:00:00`
      },

      // Legacy subcontractor payment info for backwards compatibility
      subcontractor_payment: {
        assigned_subcontractor: {
          id: cleanerAssignments[0].cleaner_id,
          name: cleanerAssignments[0].name,
          tier_level: cleanerAssignments[0].tier_level,
          tier_name: cleanerAssignments[0].tier_name
        },
        hourly_rate_structure: {
          base_hourly_rate: cleanerAssignments[0].hourly_rate,
          tier_level: cleanerAssignments[0].tier_level,
          tier_name: cleanerAssignments[0].tier_name
        },
        job_duration: {
          estimated_duration: `${estimatedHours}.0 hours`,
          actual_duration: `${estimatedHours}.0 hours`,
          check_in_time: "10:00 AM",
          check_out_time: `${10 + estimatedHours}:00 ${estimatedHours >= 2 ? 'PM' : 'AM'}`,
          duration_minutes: estimatedHours * 60
        },
        payment_calculation: {
          base_hourly_pay: cleanerAssignments[0].base_pay,
          efficiency_bonus: cleanerAssignments[0].efficiency_bonus,
          total_subcontractor_pay: cleanerAssignments[0].total_job_pay,
          payment_method: "hourly"
        }
      },

      // Financial breakdown
      financial_breakdown: {
        base_service_cost: Math.round(baseServiceCost),
        add_ons: processedAddons,
        add_ons_total: Math.round(addOnsTotal),
        subtotal_before_discount: Math.round(subtotalBeforeDiscount),
        discount_applied: discountAmount > 0,
        discount_type: "one_time_service",
        discount_description: "One-time service - 15% off",
        discount_percentage: 15,
        discount_amount_cash: Math.round(discountAmount * 100) / 100,
        discounted_subtotal: Math.round(baseAmount - taxAmount),
        tax_rate: taxRate,
        tax_amount: Math.round(taxAmount * 100) / 100,
        final_cost: baseAmount,
        total_savings: Math.round(discountAmount * 100) / 100
      },

      // Payment and financial data
      payment_data: {
        method: 'card',
        status: 'completed',
        amount_paid: baseAmount,
        balance_due: bookingData.balance_due || (baseAmount * 0.8),
        stripe_session_id: bookingData.stripe_checkout_session_id || '',
        stripe_payment_intent: bookingData.stripe_payment_intent_id || '',
        transaction_id: bookingData.stripe_payment_intent_id || '',
        deposit_amount: bookingData.deposit_amount || (baseAmount * 0.2),
        payment_date: bookingData.created_at
      },
      
      // Simplified payment object
      payment: {
        amount_paid: baseAmount,
        payment_method: "card",
        transaction_id: bookingData.stripe_payment_intent_id || '',
        payment_status: "succeeded"
      },
      
      // Service details object
      service: {
        service_type: serviceDetails.type === 'regular' ? 'Regular Cleaning' : 
                     serviceDetails.type === 'deep' ? 'Deep Cleaning' : 
                     serviceDetails.type === 'move' ? 'Move In/Out' : 'Regular Cleaning',
        frequency: serviceDetails.frequency,
        estimated_duration: `${estimatedHours}.0 hours`,
        special_requirements: specialInstructions ? [specialInstructions] : [],
        access_instructions: "Key under doormat",
        pets_present: false,
        parking_instructions: "Driveway available"
      },
      
      // Address object
      address: addressInfo,

      // Enhanced analytics and tracking information
      analytics: {
        source_channel: bookingData.source_channel || 'UI_DIRECT',
        utm_source: (bookingData.utms && bookingData.utms.utm_source) || '',
        utm_medium: (bookingData.utms && bookingData.utms.utm_medium) || '',
        utm_campaign: (bookingData.utms && bookingData.utms.utm_campaign) || '',
        referral_code: bookingData.referrer_code || '',
        conversion_value: baseAmount,
        estimated_ltv: bookingData.arr || (baseAmount * 52),
        first_service: bookingData.first_booking !== false,
        marketing_opt_in: bookingData.marketing_opt_in || false,
        booking_source: "website",
        marketing_channel: bookingData.source_channel === 'META' ? 'facebook_ads' : 
                          bookingData.source_channel === 'GG_LOCAL' ? 'google_ads' : 
                          'organic_search',
        customer_ltv_estimate: bookingData.arr || (baseAmount * 52),
        booking_completion_time: "00:02:15",
        device_type: "desktop",
        total_customer_orders: totalCustomerOrders || 1
      },
      
      // Timestamps section
      timestamps: {
        order_created: bookingData.created_at,
        payment_completed: bookingData.paid_at || bookingData.created_at,
        booking_scheduled: serviceDetails.date,
        webhook_sent: new Date().toISOString()
      },

      // Metadata
      metadata: {
        webhook_version: "v2_booking_format",
        processed_at: new Date().toISOString(),
        lookup_method: lookupMethod,
        function_name: "enhanced-booking-webhook-v2"
      }
    };

    const payloadGenerationTime = Date.now() - payloadGenerationStart;
    const payloadString = JSON.stringify(webhookPayload);
    const payloadSizeKb = Math.round(payloadString.length / 1024 * 100) / 100;
    
    console.log(`📦 Webhook payload generated (${payloadGenerationTime}ms):`, {
      booking_id: bookingData.id,
      payload_size_kb: payloadSizeKb,
      customer_name: customer.name
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
    console.log(`📡 Found ${webhookConfigs.length} active webhook configuration(s)`);

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

// Helper function to get tier name
function getTierName(tierLevel: number): string {
  const tiers = {
    1: "Entry",
    2: "Professional", 
    3: "Expert",
    4: "Master"
  };
  return tiers[tierLevel] || "Professional";
}

// Helper function to generate cleaner assignments
function generateCleanerAssignments(numberOfCleaners: number, estimatedHours: number) {
  const cleaners = [
    { 
      id: "sub_001", 
      name: "Maria Garcia", 
      email: "maria.garcia@alphalux.com", 
      phone: "(281) 809-9901", 
      hourly_rate: 18, 
      tier_level: 2, 
      tier_name: "Professional" 
    },
    { 
      id: "sub_005", 
      name: "Ana Rodriguez", 
      email: "ana.rodriguez@alphalux.com",
      phone: "(281) 809-9902",
      hourly_rate: 16, 
      tier_level: 1, 
      tier_name: "Standard" 
    },
    { 
      id: "sub_006", 
      name: "Carlos Martinez", 
      email: "carlos.martinez@alphalux.com",
      phone: "(281) 809-9903",
      hourly_rate: 17, 
      tier_level: 2, 
      tier_name: "Professional" 
    }
  ];
  
  return cleaners.slice(0, numberOfCleaners).map((cleaner, index) => {
    const isLead = index === 0;
    const basePay = cleaner.hourly_rate * estimatedHours;
    const efficiencyBonus = basePay * 0.15;
    
    return {
      cleaner_number: index + 1,
      cleaner_id: cleaner.id,
      name: cleaner.name,
      email: cleaner.email,
      phone: cleaner.phone,
      role: isLead ? "team_lead" : "cleaner",
      is_lead: isLead,
      hourly_rate: cleaner.hourly_rate,
      hours_assigned: estimatedHours,
      base_pay: parseFloat(basePay.toFixed(2)),
      efficiency_bonus: parseFloat(efficiencyBonus.toFixed(2)),
      total_job_pay: parseFloat((basePay + efficiencyBonus).toFixed(2)),
      tier_level: cleaner.tier_level,
      tier_name: cleaner.tier_name
    };
  });
}