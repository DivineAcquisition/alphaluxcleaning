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
        amount: 156.60, // Final cost after tax
        service_details: {
          service_type: 'house_cleaning',
          cleaning_type: 'deep_clean'
        },
        bookings: {
          customer_name: "John Smith",
          customer_email: "john.smith@example.com",
          customer_phone: "(857) 754-4557",
          service_address: "1234 Main Street, New York, NY 10001",
          service_date: new Date().toISOString().split('T')[0],
          service_time: "10:00 AM"
        },
        financial_data: {
          // Essential Financial Data
          base_service_cost: 85.00,
          add_ons: [
            { name: "Deep Clean Kitchen", cost: 35.00 },
            { name: "Interior Windows", cost: 25.00 },
            { name: "Inside Oven", cost: 15.00 }
          ],
          add_ons_total: 75.00,
          subtotal_before_discount: 160.00,
          
          // Discount & Membership Effects
          discount_applied: true,
          discount_type: "membership_discount",
          discount_description: "CleanCovered Membership - 10% Off",
          discount_percentage: 10,
          discount_amount_cash: 16.00,
          discounted_subtotal: 144.00,
          membership_pricing_effect: {
            is_member: true,
            membership_type: "premium",
            non_member_price: 174.00,
            member_price: 156.60,
            membership_savings: 17.40
          },
          
          // Tax calculation
          tax_rate: 0.0875,
          tax_amount: 12.60,
          final_cost: 156.60, // Final amount customer paid
          total_savings: 17.40,
          
          // Subcontractor Payment Breakdown (Hour-based)
          subcontractor_payment: {
            tier_level: 2,
            hourly_rate: 18.00,
            job_duration_hours: 4.25, // Actual check-in to check-out time
            check_in_time: "2024-01-15T10:00:00Z",
            check_out_time: "2024-01-15T14:15:00Z",
            base_hourly_pay: 76.50, // $18 × 4.25 hours
            efficiency_bonus: 12.00, // Bonus for completing faster than estimated
            total_subcontractor_payment: 88.50,
            payment_method: "hourly_plus_bonus"
          },
          
          // Stripe Payment Data
          stripe_data: {
            customer_id: "cus_P1a2B3c4D5e6F7g8",
            payment_intent_id: "pi_3OQk1vL2P3r4S5t6U7v8W9x0",
            payment_method: {
              type: "card",
              card_brand: "visa",
              last_four: "4242"
            },
            payment_status: "succeeded",
            processing_fee: 4.85, // Stripe fees (3.1% + $0.30)
            payment_date: new Date().toISOString()
          },
          
          // Profit Margins (After Subcontractor Payment)
          profit_analysis: {
            gross_revenue: 156.60,
            subcontractor_cost: 88.50,
            stripe_fees: 4.85,
            operating_costs: 8.00, // Overhead, supplies, etc.
            total_costs: 101.35, // Subcontractor + Stripe + Operating
            net_profit: 55.25, // Revenue - Total Costs
            profit_margin_percentage: 35.27 // Net profit / Gross revenue
          }
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
        
        // Get subcontractor tier info for payment calculations
        if (assignmentData && updateData.subcontractor_id) {
          const { data: subcontractorTier } = await supabase
            .from('subcontractors')
            .select('tier_level, hourly_rate, monthly_fee')
            .eq('id', updateData.subcontractor_id)
            .single();
          
          if (subcontractorTier && orderData) {
            // Calculate job duration if check-in/out times are available
            const checkInTime = assignmentData.accepted_at;
            const checkOutTime = assignmentData.completed_at;
            let jobDurationHours = 4.0; // Default estimate
            
            if (checkInTime && checkOutTime) {
              const duration = (new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60);
              jobDurationHours = Math.round(duration * 4) / 4; // Round to nearest 15 minutes
            }
            
            // Calculate subcontractor payment
            const baseHourlyPay = (subcontractorTier.hourly_rate || 16.00) * jobDurationHours;
            const totalSubcontractorPayment = baseHourlyPay;
            const processingFee = orderData.amount * 0.031 + 0.30; // Stripe fee estimate
            const operatingCosts = orderData.amount * 0.05; // 5% overhead estimate
            
            // Add calculated financial data to order
            orderData.financial_data = {
              final_cost: orderData.amount,
              subcontractor_payment: {
                tier_level: subcontractorTier.tier_level,
                hourly_rate: subcontractorTier.hourly_rate || 16.00,
                job_duration_hours: jobDurationHours,
                check_in_time: checkInTime,
                check_out_time: checkOutTime,
                base_hourly_pay: baseHourlyPay,
                total_subcontractor_payment: totalSubcontractorPayment,
                payment_method: "hourly"
              },
              stripe_data: {
                processing_fee: processingFee,
                payment_status: "succeeded"
              },
              profit_analysis: {
                gross_revenue: orderData.amount,
                subcontractor_cost: totalSubcontractorPayment,
                stripe_fees: processingFee,
                operating_costs: operatingCosts,
                total_costs: totalSubcontractorPayment + processingFee + operatingCosts,
                net_profit: orderData.amount - (totalSubcontractorPayment + processingFee + operatingCosts),
                profit_margin_percentage: ((orderData.amount - (totalSubcontractorPayment + processingFee + operatingCosts)) / orderData.amount) * 100
              }
            };
          }
        }
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
        
        // Essential financial breakdown
        financial_data: orderData.financial_data ? {
          // Service Pricing
          base_service_cost: orderData.financial_data.base_service_cost,
          add_ons: orderData.financial_data.add_ons,
          add_ons_total: orderData.financial_data.add_ons_total,
          subtotal_before_discount: orderData.financial_data.subtotal_before_discount,
          
          // Discount & Membership Effects
          discount_applied: orderData.financial_data.discount_applied,
          discount_type: orderData.financial_data.discount_type,
          discount_description: orderData.financial_data.discount_description,
          discount_percentage: orderData.financial_data.discount_percentage,
          discount_amount_cash: orderData.financial_data.discount_amount_cash,
          discounted_subtotal: orderData.financial_data.discounted_subtotal,
          membership_pricing_effect: orderData.financial_data.membership_pricing_effect,
          
          // Tax & Final Cost
          tax_rate: orderData.financial_data.tax_rate,
          tax_amount: orderData.financial_data.tax_amount,
          final_cost: orderData.financial_data.final_cost,
          total_savings: orderData.financial_data.total_savings,
          
          // Subcontractor Payment Breakdown (Hour-based)
          subcontractor_payment: orderData.financial_data.subcontractor_payment,
          
          // Stripe Payment Data
          stripe_data: orderData.financial_data.stripe_data,
          
          // Profit Analysis (After Subcontractor Payment)
          profit_analysis: orderData.financial_data.profit_analysis
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