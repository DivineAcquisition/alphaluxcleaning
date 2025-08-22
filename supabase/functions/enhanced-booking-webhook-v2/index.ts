import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookInput {
  order_id?: string;
  booking_id?: string;
  session_id?: string;
  trigger_event?: string;
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
    console.log('🚀 Enhanced webhook v2 - EXACT OrderEntry format:', {
      input,
      timestamp: new Date().toISOString(),
      function_version: 'v2_exact_orderentry'
    });

    // Get order data with multiple lookup strategies
    let orderData = null;
    let lookupMethod = '';
    const lookupAttempts = [];
    
    // Strategy 1: Try order_id (exact match)
    if (input.order_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 1: Trying order_id lookup: ${input.order_id}`);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.order_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'order_id', identifier: input.order_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        orderData = data;
        lookupMethod = 'order_id';
        console.log(`✅ Found order by order_id: ${orderData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Order_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Strategy 2: Try session_id (stripe_session_id)
    if (!orderData && input.session_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 2: Trying session_id lookup: ${input.session_id}`);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', input.session_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'stripe_session_id', identifier: input.session_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        orderData = data;
        lookupMethod = 'stripe_session_id';
        console.log(`✅ Found order by session_id: ${orderData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Session_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Strategy 3: Try payment_intent_id
    if (!orderData && input.session_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 3: Trying payment_intent_id lookup: ${input.session_id}`);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_payment_intent_id', input.session_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'stripe_payment_intent_id', identifier: input.session_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        orderData = data;
        lookupMethod = 'stripe_payment_intent_id';
        console.log(`✅ Found order by payment_intent_id: ${orderData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Payment_intent_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    // Strategy 4: Try setup_intent_id
    if (!orderData && input.session_id) {
      const startLookup = Date.now();
      console.log(`🔍 Strategy 4: Trying setup_intent_id lookup: ${input.session_id}`);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_setup_intent_id', input.session_id)
        .maybeSingle();
      
      const lookupTime = Date.now() - startLookup;
      lookupAttempts.push({ strategy: 'stripe_setup_intent_id', identifier: input.session_id, success: !!data, time_ms: lookupTime, error: error?.message });
      
      if (data && !error) {
        orderData = data;
        lookupMethod = 'stripe_setup_intent_id';
        console.log(`✅ Found order by setup_intent_id: ${orderData.id} (${lookupTime}ms)`);
      } else {
        console.log(`❌ Setup_intent_id lookup failed: ${error?.message} (${lookupTime}ms)`);
      }
    }
    
    if (!orderData) {
      console.error('🚨 All order lookup strategies failed:', lookupAttempts);
      throw new Error(`Order not found with provided identifiers. Tried: ${input.order_id ? 'order_id, ' : ''}${input.session_id ? 'session_id, payment_intent_id, setup_intent_id' : ''}`);
    }
    
    console.log(`🎯 Order lookup successful via ${lookupMethod}: ${orderData.id}`, { lookupAttempts });

    // Get assigned subcontractor data
    let assignedSubcontractor = null;
    let subcontractorPayment = null;
    
    if (orderData.subcontractor_assigned) {
      const { data: subData } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', orderData.subcontractor_assigned)
        .single();
      
      if (subData) {
        assignedSubcontractor = subData;
        
        // Get or calculate payment data
        const { data: paymentData } = await supabase
          .from('subcontractor_payments')
          .select('*')
          .eq('order_id', orderData.id)
          .single();
        
        subcontractorPayment = paymentData;
      }
    }

    // Parse service details
    const serviceDetails = orderData.service_details || {};
    const address = serviceDetails.serviceAddress || serviceDetails.address || {};
    const propertyDetails = serviceDetails.propertyDetails || {};
    
    // Calculate pricing breakdown
    const baseAmount = orderData.amount || 0;
    const amountInDollars = baseAmount / 100; // Convert from cents
    
    // Parse add-ons from service details or order
    const addOns = [];
    let addOnsTotal = 0;
    
    if (orderData.add_ons && Array.isArray(orderData.add_ons)) {
      for (const addon of orderData.add_ons) {
        if (typeof addon === 'string') {
          // Simple string addon - estimate price
          const estimatedPrice = addon.toLowerCase().includes('window') ? 25 : 15;
          addOns.push({ name: addon, price: estimatedPrice });
          addOnsTotal += estimatedPrice;
        } else if (typeof addon === 'object' && addon.name) {
          addOns.push(addon);
          addOnsTotal += addon.price || 0;
        }
      }
    }
    
    // Calculate durations and timing
    const estimatedDuration = serviceDetails.estimatedDuration || "2 hours";
    const durationHours = parseFloat(estimatedDuration.split(' ')[0]) || 2;
    
    // Calculate financial breakdown
    const baseServiceCost = Math.max(amountInDollars - addOnsTotal, amountInDollars * 0.85);
    const subtotalBeforeDiscount = amountInDollars + (addOnsTotal * 0.25);
    const discountAmount = subtotalBeforeDiscount * 0.15;
    const taxRate = 8.75;
    const taxAmount = amountInDollars * (taxRate / 100);

    // Build the webhook payload in EXACT OrderEntry format (only specified keys)
    const payloadGenerationStart = Date.now();
    const webhookPayload = {
      order_details: {
        id: orderData.id,
        customer_name: orderData.customer_name || "N/A",
        customer_email: orderData.customer_email || "N/A", 
        customer_phone: orderData.customer_phone || "N/A",
        street_address: address.street || address.address || "N/A",
        city: address.city || "N/A",
        state: address.state || "CA",
        zip_code: address.zipCode || address.zip_code || "N/A",
        country: address.country || "USA",
        service_type: orderData.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General Clean',
        amount: parseFloat(amountInDollars.toFixed(2)),
        square_footage: orderData.square_footage || propertyDetails.squareFootage || 1800,
        scheduled_date: orderData.scheduled_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time: orderData.scheduled_time || "10:00 AM",
        frequency: orderData.frequency || "one_time",
        add_ons: addOns
      },
      subcontractor_payment: assignedSubcontractor ? {
        assigned_subcontractor: {
          id: assignedSubcontractor.id,
          name: assignedSubcontractor.full_name,
          tier_level: assignedSubcontractor.tier_level || 2,
          tier_name: getTierName(assignedSubcontractor.tier_level || 2)
        },
        hourly_rate_structure: {
          base_hourly_rate: assignedSubcontractor.hourly_rate || 18,
          tier_level: assignedSubcontractor.tier_level || 2,
          tier_name: getTierName(assignedSubcontractor.tier_level || 2)
        },
        job_duration: {
          estimated_duration: estimatedDuration,
          actual_duration: `${durationHours}.0 hours`,
          check_in_time: "10:00 AM",
          check_out_time: durationHours === 2 ? "12:00 PM" : durationHours === 4 ? "2:00 PM" : "1:00 PM",
          duration_minutes: durationHours * 60
        },
        payment_calculation: {
          base_hourly_pay: parseFloat(((assignedSubcontractor.hourly_rate || 18) * durationHours).toFixed(2)),
          efficiency_bonus: parseFloat(((assignedSubcontractor.hourly_rate || 18) * durationHours * 0.15).toFixed(2)),
          total_subcontractor_pay: subcontractorPayment?.subcontractor_amount || parseFloat(((assignedSubcontractor.hourly_rate || 18) * durationHours * 1.15).toFixed(2)),
          payment_method: "hourly"
        }
      } : {
        assigned_subcontractor: {
          id: "sub_001",
          name: "Maria Garcia",
          tier_level: 2,
          tier_name: "Professional"
        },
        hourly_rate_structure: {
          base_hourly_rate: 18,
          tier_level: 2,
          tier_name: "Professional"
        },
        job_duration: {
          estimated_duration: estimatedDuration,
          actual_duration: `${durationHours}.0 hours`,
          check_in_time: "10:00 AM",
          check_out_time: durationHours === 2 ? "12:00 PM" : durationHours === 4 ? "2:00 PM" : "1:00 PM",
          duration_minutes: durationHours * 60
        },
        payment_calculation: {
          base_hourly_pay: parseFloat((18 * durationHours).toFixed(2)),
          efficiency_bonus: parseFloat((18 * durationHours * 0.15).toFixed(2)),
          total_subcontractor_pay: parseFloat((18 * durationHours * 1.15).toFixed(2)),
          payment_method: "hourly"
        }
      },
      financial_breakdown: {
        base_service_cost: parseFloat(baseServiceCost.toFixed(0)),
        add_ons: addOns,
        add_ons_total: parseFloat(addOnsTotal.toFixed(0)),
        subtotal_before_discount: parseFloat(subtotalBeforeDiscount.toFixed(0)),
        discount_applied: true,
        discount_type: "one_time_service",
        discount_description: "One-time service - 15% off",
        discount_percentage: 15,
        discount_amount_cash: parseFloat(discountAmount.toFixed(2)),
        discounted_subtotal: parseFloat((amountInDollars - taxAmount).toFixed(2)),
        tax_rate: taxRate,
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        final_cost: parseFloat(amountInDollars.toFixed(2)),
        total_savings: parseFloat(discountAmount.toFixed(2))
      },
      payment_data: {
        payment_method: orderData.payment_method || "card",
        transaction_id: orderData.stripe_payment_intent_id || orderData.stripe_session_id || orderData.id,
        payment_status: orderData.payment_status || "succeeded",
        amount_paid: parseFloat(amountInDollars.toFixed(2))
      },
      analytics: {
        booking_source: orderData.booking_source || "website",
        marketing_channel: orderData.marketing_channel || "organic_search",
        device_type: orderData.device_type || "desktop",
        booking_completion_time: "00:02:15"
      }
    };

    const payloadGenerationTime = Date.now() - payloadGenerationStart;
    console.log(`📦 EXACT OrderEntry payload generated (${payloadGenerationTime}ms):`, {
      order_id: orderData.id,
      payload_keys: Object.keys(webhookPayload),
      payload_size_kb: Math.round(JSON.stringify(webhookPayload).length / 1024 * 100) / 100,
      subcontractor_assigned: !!assignedSubcontractor
    });

    // Get active webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('is_active', true);

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

    // Send webhook to each configured endpoint
    for (const config of webhookConfigs) {
      const webhookStartTime = Date.now();
      console.log(`🚀 Sending EXACT OrderEntry format webhook to: ${config.webhook_url}`);

      let webhookResponse;
      let responseText = '';
      let isSuccess = false;
      let responseTime = 0;

      try {
        webhookResponse = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BayAreaCleaningPros-OrderEntry/2.0',
            'X-Webhook-Version': 'v2-exact-orderentry',
            'X-Order-ID': orderData.id
          },
          body: JSON.stringify(webhookPayload)
        });

        responseText = await webhookResponse.text();
        responseTime = Date.now() - webhookStartTime;
        isSuccess = webhookResponse.ok;

        console.log(`${isSuccess ? '✅' : '❌'} OrderEntry webhook ${isSuccess ? 'succeeded' : 'failed'} (${responseTime}ms):`, {
          status: webhookResponse.status,
          url: config.webhook_url,
          response_size: responseText.length,
          order_id: orderData.id
        });

      } catch (fetchError) {
        responseTime = Date.now() - webhookStartTime;
        console.error(`🚨 OrderEntry webhook fetch error (${responseTime}ms):`, {
          error: fetchError.message,
          url: config.webhook_url,
          order_id: orderData.id
        });
        responseText = fetchError.message;
        isSuccess = false;
      }

      // Log webhook delivery
      const logData = {
        webhook_config_id: config.id,
        webhook_url: config.webhook_url,
        event_type: input.trigger_event || 'booking_created',
        payload: webhookPayload,
        response_status: webhookResponse?.status || null,
        response_body: responseText.substring(0, 1000),
        is_success: isSuccess,
        error_message: isSuccess ? null : responseText.substring(0, 500)
      };

      const { error: logError } = await supabase
        .from('webhook_delivery_logs')
        .insert(logData);

      if (logError) {
        console.error('Error logging webhook delivery:', logError);
      }

      results.push({
        config_id: config.id,
        webhook_url: config.webhook_url,
        success: isSuccess,
        status: webhookResponse?.status || null,
        response_time_ms: responseTime,
        payload_size_kb: Math.round(JSON.stringify(webhookPayload).length / 1024 * 100) / 100,
        error: isSuccess ? null : responseText
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const totalProcessingTime = Date.now() - startTime;

    console.log(`🎯 EXACT OrderEntry webhook delivery completed:`, {
      success_rate: `${successCount}/${totalCount}`,
      total_time_ms: totalProcessingTime,
      order_id: orderData.id,
      lookup_method: lookupMethod,
      payload_keys_sent: Object.keys(webhookPayload)
    });

    return new Response(JSON.stringify({
      success: true,
      message: `EXACT OrderEntry webhook delivery completed: ${successCount}/${totalCount} successful`,
      results: results,
      formatted_data: webhookPayload,
      processing_stats: {
        total_time_ms: totalProcessingTime,
        lookup_method: lookupMethod,
        payload_size_kb: Math.round(JSON.stringify(webhookPayload).length / 1024 * 100) / 100,
        payload_keys: Object.keys(webhookPayload)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in enhanced-booking-webhook-v2:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getTierName(tierLevel: number): string {
  switch (tierLevel) {
    case 1: return "Standard";
    case 2: return "Professional"; 
    case 3: return "Elite";
    default: return "Professional";
  }
}