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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: WebhookInput = await req.json();
    console.log('Enhanced webhook v2 triggered:', input);

    // Get order data
    let orderData;
    if (input.order_id) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.order_id)
        .single();
      
      if (error) throw new Error(`Order not found: ${error.message}`);
      orderData = data;
    } else if (input.session_id) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', input.session_id)
        .single();
      
      if (error) throw new Error(`Order not found by session: ${error.message}`);
      orderData = data;
    } else {
      throw new Error('No order_id or session_id provided');
    }

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

    // Build the webhook payload in exact required format
    const webhookPayload = {
      "order_details": {
        "id": orderData.id,
        "customer_name": orderData.customer_name || 'N/A',
        "customer_email": orderData.customer_email || 'N/A',
        "customer_phone": orderData.customer_phone || 'N/A',
        "street_address": address.street || 'N/A',
        "city": address.city || 'N/A', 
        "state": address.state || 'CA',
        "zip_code": address.zipCode || address.zip_code || 'N/A',
        "country": "USA",
        "service_type": orderData.cleaning_type?.replace(/_/g, ' ') || 'General Clean',
        "amount": amountInDollars,
        "square_footage": orderData.square_footage || 1500,
        "scheduled_date": orderData.scheduled_date || new Date().toISOString().split('T')[0],
        "scheduled_time": orderData.scheduled_time || '10:00 AM',
        "frequency": orderData.frequency || 'one_time',
        "add_ons": addOns
      },
      "subcontractor_payment": assignedSubcontractor ? {
        "assigned_subcontractor": {
          "id": assignedSubcontractor.id,
          "name": assignedSubcontractor.full_name,
          "tier_level": assignedSubcontractor.tier_level || 1,
          "tier_name": getTierName(assignedSubcontractor.tier_level || 1)
        },
        "hourly_rate_structure": {
          "base_hourly_rate": assignedSubcontractor.hourly_rate || 16,
          "tier_level": assignedSubcontractor.tier_level || 1,
          "tier_name": getTierName(assignedSubcontractor.tier_level || 1)
        },
        "job_duration": {
          "estimated_duration": "2 hours",
          "actual_duration": subcontractorPayment?.hours_worked ? `${subcontractorPayment.hours_worked} hours` : "2.0 hours",
          "check_in_time": "10:00 AM",
          "check_out_time": "12:00 PM", 
          "duration_minutes": (subcontractorPayment?.hours_worked || 2) * 60
        },
        "payment_calculation": {
          "base_hourly_pay": (assignedSubcontractor.hourly_rate || 16) * (subcontractorPayment?.hours_worked || 2),
          "efficiency_bonus": ((assignedSubcontractor.hourly_rate || 16) * (subcontractorPayment?.hours_worked || 2)) * 0.15,
          "total_subcontractor_pay": subcontractorPayment?.subcontractor_amount || ((assignedSubcontractor.hourly_rate || 16) * (subcontractorPayment?.hours_worked || 2) * 1.15),
          "payment_method": "hourly"
        }
      } : {
        "assigned_subcontractor": {
          "id": "unassigned",
          "name": "To Be Assigned",
          "tier_level": 2,
          "tier_name": "Professional"
        },
        "hourly_rate_structure": {
          "base_hourly_rate": 18,
          "tier_level": 2,
          "tier_name": "Professional"
        },
        "job_duration": {
          "estimated_duration": "2 hours",
          "actual_duration": "2.0 hours",
          "check_in_time": "10:00 AM",
          "check_out_time": "12:00 PM",
          "duration_minutes": 120
        },
        "payment_calculation": {
          "base_hourly_pay": 36,
          "efficiency_bonus": 5.4,
          "total_subcontractor_pay": 41.4,
          "payment_method": "hourly" 
        }
      },
      "financial_breakdown": {
        "base_service_cost": Math.max(amountInDollars - addOnsTotal, amountInDollars * 0.85),
        "add_ons": addOns,
        "add_ons_total": addOnsTotal,
        "subtotal_before_discount": amountInDollars + (addOnsTotal * 0.25), // Estimate original before discount
        "discount_applied": orderData.frequency === 'one_time',
        "discount_type": orderData.frequency === 'one_time' ? "one_time_service" : "regular_customer",
        "discount_description": orderData.frequency === 'one_time' ? "One-time service - 15% off" : "Regular customer discount",
        "discount_percentage": 15,
        "discount_amount_cash": (amountInDollars + (addOnsTotal * 0.25)) * 0.15,
        "discounted_subtotal": amountInDollars,
        "tax_rate": 8.75,
        "tax_amount": amountInDollars * 0.0875,
        "final_cost": amountInDollars,
        "total_savings": (amountInDollars + (addOnsTotal * 0.25)) * 0.15
      },
      "payment_data": {
        "payment_method": orderData.payment_method || "card", 
        "transaction_id": orderData.stripe_payment_intent_id || orderData.stripe_session_id || orderData.id,
        "payment_status": orderData.payment_status || "succeeded",
        "amount_paid": amountInDollars
      },
      "analytics": {
        "booking_source": "website",
        "marketing_channel": "organic_search",
        "device_type": "desktop", 
        "booking_completion_time": "00:02:15"
      }
    };

    console.log('Generated webhook payload for order:', orderData.id);

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
      console.log('Sending enhanced webhook to:', config.webhook_url);

      let webhookResponse;
      let responseText = '';
      let isSuccess = false;

      try {
        webhookResponse = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BayAreaCleaningPros-Enhanced/2.0'
          },
          body: JSON.stringify(webhookPayload)
        });

        responseText = await webhookResponse.text();
        isSuccess = webhookResponse.ok;

        console.log(`Enhanced webhook ${isSuccess ? 'succeeded' : 'failed'}:`, {
          status: webhookResponse.status,
          url: config.webhook_url
        });

      } catch (fetchError) {
        console.error('Enhanced webhook fetch error:', fetchError);
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
        console.error('Error logging enhanced webhook delivery:', logError);
      }

      results.push({
        config_id: config.id,
        webhook_url: config.webhook_url,
        success: isSuccess,
        status: webhookResponse?.status || null,
        error: isSuccess ? null : responseText
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return new Response(JSON.stringify({
      success: true,
      message: `Enhanced webhook delivery completed: ${successCount}/${totalCount} successful`,
      results: results,
      formatted_data: webhookPayload
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
    case 1: return "Apprentice";
    case 2: return "Professional"; 
    case 3: return "Expert";
    default: return "Professional";
  }
}