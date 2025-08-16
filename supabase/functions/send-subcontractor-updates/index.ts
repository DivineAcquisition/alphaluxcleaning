import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubcontractorUpdateRequest {
  update_type: 'check_in' | 'check_out' | 'status_message' | 'assignment_change';
  subcontractor_id?: string;
  assignment_id?: string;
  order_id?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  message?: string;
  status?: string;
  estimated_arrival_minutes?: number;
  photos?: Array<{ url: string; description: string }>;
  notes?: string;
  testMode?: boolean;
  mockSubcontractor?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  correlationId?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBCONTRACTOR-UPDATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Subcontractor update notification started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const updateData: SubcontractorUpdateRequest = await req.json();
    logStep("Request parsed", { 
      update_type: updateData.update_type, 
      testMode: updateData.testMode,
      correlationId: updateData.correlationId 
    });

    // Get subcontractor details - use mock data in test mode
    let subcontractorData = null;
    if (updateData.testMode && updateData.mockSubcontractor) {
      subcontractorData = updateData.mockSubcontractor;
      logStep("Using mock subcontractor data", { name: subcontractorData.full_name });
    } else if (updateData.subcontractor_id) {
      const { data } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, phone, user_id')
        .eq('id', updateData.subcontractor_id)
        .single();
      subcontractorData = data;
      logStep("Retrieved subcontractor from database", { found: !!data });
    }

    // Get order and assignment details if available - use mock data in test mode
    let orderData = null;
    let assignmentData = null;
    
    if (updateData.testMode) {
      // Use mock order data for testing with comprehensive financial breakdown
      orderData = {
        id: updateData.order_id,
        status: 'in_progress',
        amount: 184.00, // Final cost after tax
        service_details: {
          service_type: 'house_cleaning',
          cleaning_type: 'deep_clean'
        },
        bookings: {
          customer_name: "John Smith",
          customer_email: "john.smith@example.com",
          customer_phone: "(555) 123-4567",
          service_address: "1234 Main Street, San Francisco, CA 94102",
          service_date: new Date().toISOString().split('T')[0],
          service_time: "10:00 AM"
        },
        financial_data: {
          // Base pricing structure
          base_service_cost: 85.00,
          add_ons: [
            { name: "Deep Clean Kitchen", cost: 35.00 },
            { name: "Interior Windows", cost: 25.00 },
            { name: "Inside Oven", cost: 15.00 }
          ],
          add_ons_total: 75.00,
          subtotal_before_discount: 160.00,
          
          // Discount breakdown
          discount_applied: true,
          discount_type: "new_customer",
          discount_description: "New Customer - 10% Off",
          discount_percentage: 10,
          discount_amount_cash: 16.00,
          discounted_subtotal: 144.00,
          
          // Tax calculation
          tax_rate: 0.0875,
          tax_on_original: 14.00, // Tax on $160
          tax_on_discounted: 12.60, // Tax on $144
          tax_amount: 12.60,
          
          // Final totals
          original_total_with_tax: 174.00, // $160 + $14 tax
          final_cost: 156.60, // $144 + $12.60 tax
          total_savings: 17.40, // $174 - $156.60
          
          // Business metrics
          company_fee_percentage: 30,
          company_fee_amount: 43.32, // 30% of $144
          subcontractor_gross_pay: 100.68, // 70% of $144
          subcontractor_hourly_rate: 18.00,
          estimated_hours: 4.5,
          estimated_subcontractor_earnings: 81.00, // $18 * 4.5 hours
          subcontractor_efficiency_bonus: 19.68, // Difference between gross pay and hourly
          
          // Payment processing
          stripe_fee: 4.85, // ~3.1% of final cost
          net_company_revenue: 38.47, // Company fee minus Stripe fee
          
          // Profit margins
          gross_margin: 35.32, // Revenue after subcontractor pay
          net_margin: 30.47, // After all fees
          margin_percentage: 19.46 // Net margin / final cost
        }
      };
      
      assignmentData = {
        id: updateData.assignment_id,
        status: updateData.status || 'accepted',
        assigned_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        completed_at: updateData.update_type === 'check_out' ? new Date().toISOString() : null
      };
      
      logStep("Using mock order and assignment data for test");
    } else {
      if (updateData.order_id) {
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            bookings (
              customer_name,
              customer_email,
              customer_phone,
              service_address,
              service_date,
              service_time
            )
          `)
          .eq('id', updateData.order_id)
          .single();
        orderData = data;
      }

      if (updateData.assignment_id) {
        const { data } = await supabase
          .from('subcontractor_job_assignments')
          .select('*')
          .eq('id', updateData.assignment_id)
          .single();
        assignmentData = data;
      }
    }

    // Build webhook payload with guaranteed subcontractor data
    const webhookPayload = {
      event_type: 'subcontractor_update',
      update_type: updateData.update_type,
      timestamp: new Date().toISOString(),
      subcontractor: subcontractorData ? {
        id: subcontractorData.id,
        name: subcontractorData.full_name,
        email: subcontractorData.email,
        phone: subcontractorData.phone
      } : {
        id: updateData.subcontractor_id || 'unknown',
        name: 'Unknown Subcontractor',
        email: 'unknown@example.com',
        phone: 'Unknown'
      },
      order: orderData ? {
        id: orderData.id,
        customer_name: orderData.bookings?.customer_name,
        customer_email: orderData.bookings?.customer_email,
        customer_phone: orderData.bookings?.customer_phone,
        service_address: orderData.bookings?.service_address,
        service_date: orderData.bookings?.service_date,
        service_time: orderData.bookings?.service_time,
        status: orderData.status,
        amount: orderData.amount,
        service_type: orderData.service_details?.service_type,
        cleaning_type: orderData.service_details?.cleaning_type,
        
        // Comprehensive financial breakdown
        financial_data: orderData.financial_data ? {
          // Pricing structure
          base_service_cost: orderData.financial_data.base_service_cost,
          add_ons: orderData.financial_data.add_ons,
          add_ons_total: orderData.financial_data.add_ons_total,
          subtotal_before_discount: orderData.financial_data.subtotal_before_discount,
          
          // Discount information
          discount_applied: orderData.financial_data.discount_applied,
          discount_type: orderData.financial_data.discount_type,
          discount_description: orderData.financial_data.discount_description,
          discount_percentage: orderData.financial_data.discount_percentage,
          discount_amount_cash: orderData.financial_data.discount_amount_cash,
          discounted_subtotal: orderData.financial_data.discounted_subtotal,
          
          // Tax calculations
          tax_rate: orderData.financial_data.tax_rate,
          tax_on_original: orderData.financial_data.tax_on_original,
          tax_on_discounted: orderData.financial_data.tax_on_discounted,
          tax_amount: orderData.financial_data.tax_amount,
          
          // Final pricing
          original_total_with_tax: orderData.financial_data.original_total_with_tax,
          final_cost: orderData.financial_data.final_cost,
          total_savings: orderData.financial_data.total_savings,
          
          // Business & subcontractor metrics
          company_fee_percentage: orderData.financial_data.company_fee_percentage,
          company_fee_amount: orderData.financial_data.company_fee_amount,
          subcontractor_gross_pay: orderData.financial_data.subcontractor_gross_pay,
          subcontractor_hourly_rate: orderData.financial_data.subcontractor_hourly_rate,
          estimated_hours: orderData.financial_data.estimated_hours,
          estimated_subcontractor_earnings: orderData.financial_data.estimated_subcontractor_earnings,
          subcontractor_efficiency_bonus: orderData.financial_data.subcontractor_efficiency_bonus,
          
          // Payment processing
          stripe_fee: orderData.financial_data.stripe_fee,
          net_company_revenue: orderData.financial_data.net_company_revenue,
          
          // Profit analysis
          gross_margin: orderData.financial_data.gross_margin,
          net_margin: orderData.financial_data.net_margin,
          margin_percentage: orderData.financial_data.margin_percentage
        } : null
      } : null,
      assignment: assignmentData ? {
        id: assignmentData.id,
        status: assignmentData.status,
        assigned_at: assignmentData.assigned_at,
        accepted_at: assignmentData.accepted_at,
        completed_at: assignmentData.completed_at
      } : null,
      location: updateData.location || null,
      message: updateData.message || null,
      status: updateData.status || null,
      estimated_arrival_minutes: updateData.estimated_arrival_minutes || null,
      photos: updateData.photos || null,
      notes: updateData.notes || null,
      metadata: {
        webhook_version: '1.0',
        sent_at: new Date().toISOString(),
        environment: updateData.testMode ? 'test' : 'production',
        correlation_id: updateData.correlationId || null,
        test_mode: updateData.testMode || false
      }
    };

    logStep("Webhook payload built", { 
      has_subcontractor: !!webhookPayload.subcontractor?.name,
      subcontractor_name: webhookPayload.subcontractor?.name,
      subcontractor_email: webhookPayload.subcontractor?.email
    });

    // Send to Zapier webhook
    try {
      const webhookResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/u6v07y3/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (webhookResponse.ok) {
        logStep("Subcontractor update sent to Zapier successfully", { update_type: updateData.update_type });
      } else {
        logStep("Failed to send update to Zapier", { status: webhookResponse.status, update_type: updateData.update_type });
      }
    } catch (webhookError) {
      logStep("Error sending update to Zapier", webhookError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subcontractor update sent to webhook",
      update_type: updateData.update_type,
      subcontractor_name: webhookPayload.subcontractor?.name,
      subcontractor_email: webhookPayload.subcontractor?.email,
      correlation_id: updateData.correlationId,
      webhook_payload_preview: {
        event_type: webhookPayload.event_type,
        update_type: webhookPayload.update_type,
        subcontractor_name: webhookPayload.subcontractor?.name,
        has_photos: !!webhookPayload.photos?.length,
        has_location: !!webhookPayload.location
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subcontractor update", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      correlation_id: updateData?.correlationId || null,
      details: {
        message: "Failed to process subcontractor update",
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});