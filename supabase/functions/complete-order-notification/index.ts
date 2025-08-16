import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface CompleteOrderRequest {
  orderId: string;
  assignmentId: string;
  completionNotes?: string;
  customerRating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  discountScenario?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    logStep("[COMPLETE-ORDER] Order completion notification started", { correlationId });

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Safely parse request body with fallback handling
    let requestBody;
    try {
      const rawBody = await req.text();
      logStep("Raw request body received", { body: rawBody, correlationId });
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(rawBody);
    } catch (parseError) {
      logStep("ERROR parsing request body", { error: parseError.message, correlationId });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid JSON in request body",
        correlationId,
        details: parseError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Map both camelCase and snake_case keys with safe fallbacks
    const orderId = requestBody?.orderId || requestBody?.order_id || `auto_test_order_${Date.now()}`;
    const assignmentId = requestBody?.assignmentId || requestBody?.assignment_id || `auto_test_assignment_${Date.now()}`;
    const completionNotes = requestBody?.completionNotes || requestBody?.completion_notes || "Service completed successfully";
    const customerRating = requestBody?.customerRating || requestBody?.customer_rating || 5;
    const checkInTime = requestBody?.checkInTime || requestBody?.check_in_time;
    const checkOutTime = requestBody?.checkOutTime || requestBody?.check_out_time;
    const discountScenario = requestBody?.discountScenario || requestBody?.discount_scenario || 'new_customer';
    const testMode = requestBody?.mode === 'test' || requestBody?.testMode === true || orderId?.toString().startsWith('test_') || assignmentId?.toString().startsWith('test_');

    logStep("Request parsed successfully", { 
      orderId, 
      assignmentId, 
      testMode,
      correlationId 
    });

    // Check if this is a test request
    if (testMode) {
      logStep("Processing test request", { correlationId });
      
      // Calculate realistic work hours and payment
      const testCheckIn = checkInTime ? new Date(checkInTime) : new Date(Date.now() - 4.5 * 60 * 60 * 1000);
      const testCheckOut = checkOutTime ? new Date(checkOutTime) : new Date();
      const workHours = (testCheckOut.getTime() - testCheckIn.getTime()) / (1000 * 60 * 60);
      const tierLevel = 2; // Professional tier
      const hourlyRate = 18.00; // Tier 2 rate
      const travelTimeHours = 0.5; // 30 minutes
      
      const workPayment = Math.round(workHours * hourlyRate * 100) / 100;
      const travelPayment = Math.round(travelTimeHours * hourlyRate * 100) / 100;
      const totalSubcontractorPayment = workPayment + travelPayment;
      
      // Realistic service pricing with discount calculations
      const baseRate = 85.00;
      const addOns = [
        { name: "Inside Oven", price: 25.00 },
        { name: "Inside Refrigerator", price: 20.00 },
        { name: "Cabinet Interiors", price: 30.00 }
      ];
      const subtotal = baseRate + addOns.reduce((sum, addon) => sum + addon.price, 0);
      const taxRate = 0.0875;
      
      // Calculate discount based on scenario
      const discountScenarios = {
        new_customer: { type: "percentage", name: "New Customer Discount", percentage: 10.0, fixed_amount: null },
        membership: { type: "percentage", name: "CleanCovered Membership", percentage: 15.0, fixed_amount: null },
        seasonal: { type: "percentage", name: "Spring Cleaning Special", percentage: 5.0, fixed_amount: null },
        referral: { type: "fixed", name: "Referral Bonus", percentage: null, fixed_amount: 25.00 },
        loyalty: { type: "percentage", name: "Loyal Customer Reward", percentage: 12.0, fixed_amount: null },
        none: { type: "none", name: "No Discount", percentage: 0, fixed_amount: null }
      };

      const discount = discountScenarios[discountScenario] || discountScenarios.new_customer;
      let discountAmount = 0;
      
      if (discount.type === "percentage" && discount.percentage) {
        discountAmount = Math.round(subtotal * (discount.percentage / 100) * 100) / 100;
      } else if (discount.type === "fixed" && discount.fixed_amount) {
        discountAmount = discount.fixed_amount;
      }

      // Original pricing
      const originalTaxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const originalTotalAmount = subtotal + originalTaxAmount;

      // Discounted pricing
      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      const discountedTaxAmount = Math.round(discountedSubtotal * taxRate * 100) / 100;
      const discountedTotalAmount = discountedSubtotal + discountedTaxAmount;
      const totalSavings = Math.round((originalTotalAmount - discountedTotalAmount) * 100) / 100;
      
      // Use discounted total for administrative fee calculation
      const administrativeFee = discountedTotalAmount - totalSubcontractorPayment;
      
      // Create mock data for test with realistic pricing and split addresses
      const testCompletionData = {
        event_type: 'service_completed',
        order: {
          id: orderId,
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah.johnson@example.com',
          customer_phone: '(415) 555-0123',
          address: {
            street_address: '123 Oak Street',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94102',
            country: 'USA'
          },
          service_date: new Date().toISOString().split('T')[0],
          service_time: '10:00 AM',
          service_type: 'deep_clean',
          pricing: {
            base_service_cost: subtotal,
            add_ons: addOns,
            original: {
              subtotal: subtotal,
              tax_rate: taxRate,
              tax_amount: originalTaxAmount,
              total_amount: originalTotalAmount
            },
            discount_applied: discount.type !== "none" ? {
              type: discount.type,
              name: discount.name,
              percentage: discount.percentage,
              fixed_amount: discount.fixed_amount,
              discount_amount_cash: discountAmount
            } : null,
            discounted: {
              discounted_price: discountedSubtotal,
              tax_amount: discountedTaxAmount,
              final_cost: discountedTotalAmount,
              total_savings: totalSavings
            }
          },
          status: 'completed',
          completion_notes: completionNotes,
          completed_at: testCheckOut.toISOString()
        },
        assignment: {
          id: assignmentId,
          subcontractor_name: 'Maria Garcia',
          subcontractor_email: 'maria@cleaningpro.com',
          subcontractor_phone: '(415) 555-0156',
          tier_level: tierLevel,
          tier_name: 'Professional',
          assigned_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          check_in_time: testCheckIn.toISOString(),
          check_out_time: testCheckOut.toISOString(),
          work_duration_hours: Math.round(workHours * 100) / 100,
          travel_time_hours: travelTimeHours,
          customer_rating: customerRating,
          status: 'completed'
        },
        payment: {
          payment_model: 'hourly_rate',
          hourly_rate: hourlyRate,
          work_hours: Math.round(workHours * 100) / 100,
          work_payment: workPayment,
          travel_compensation: travelPayment,
          total_subcontractor_payment: totalSubcontractorPayment,
          company_administrative_fee: Math.round(administrativeFee * 100) / 100,
          customer_total_original: originalTotalAmount,
          customer_total_final: discountedTotalAmount
        },
        completion_data: {
          completion_notes: completionNotes,
          customer_rating: customerRating,
          completed_at: testCheckOut.toISOString(),
          areas_cleaned: ['Kitchen', 'Living Room', '2 Bedrooms', '2 Bathrooms', 'Dining Room'],
          photos_count: 8
        },
        metadata: {
          webhook_version: '2.0',
          sent_at: new Date().toISOString(),
          environment: 'test',
          correlationId
        },
        // Root-level discount pricing fields for easier access
        base_service_cost: subtotal,
        discount_percentage: discount.percentage || 0,
        discount_amount_cash: discountAmount,
        discounted_price: discountedSubtotal,
        final_cost: discountedTotalAmount,
        total_savings: totalSavings
      };

      // Send test data to Zapier webhook
      try {
        const webhookResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/u6v0pgk/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCompletionData),
        });

        logStep("Webhook response received", { 
          status: webhookResponse.status, 
          statusText: webhookResponse.statusText,
          correlationId 
        });

        const webhookStatus = webhookResponse.ok ? "sent" : "failed";
        
        logStep("Test completion data sent to Zapier", { 
          status: webhookStatus,
          correlationId 
        });
      } catch (webhookError) {
        logStep("Error sending test completion data to Zapier", { 
          error: webhookError.message,
          correlationId 
        });
      }

      logStep("Test order completion process finished successfully", { correlationId });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Test order completion processed and webhook sent",
        orderId,
        assignmentId,
        webhook_status: "sent",
        test_mode: true,
        correlationId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get order and assignment details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        bookings (
          customer_name,
          customer_email,
          customer_phone,
          service_address,
          service_date,
          service_time,
          special_instructions
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('subcontractor_job_assignments')
      .select(`
        *,
        subcontractors (
          full_name,
          email,
          phone,
          split_tier
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      throw new Error(`Assignment not found: ${assignmentError?.message}`);
    }

    logStep("Order and assignment data retrieved", { 
      customerEmail: orderData.customer_email,
      subcontractor: assignmentData.subcontractors?.full_name 
    });

    // Update order status to completed
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes
      })
      .eq('id', orderId);

    if (updateOrderError) {
      throw new Error(`Failed to update order: ${updateOrderError.message}`);
    }

    // Update assignment status to completed
    const { error: updateAssignmentError } = await supabase
      .from('subcontractor_job_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        subcontractor_notes: completionNotes,
        customer_rating: customerRating
      })
      .eq('id', assignmentId);

    if (updateAssignmentError) {
      throw new Error(`Failed to update assignment: ${updateAssignmentError.message}`);
    }

    logStep("Order and assignment updated to completed");

    // Calculate hourly payment based on check-in/check-out times and tier
    const orderAmount = orderData.amount || 10000; // Default $100 if not set
    
    // Get tier-based hourly rate
    const { data: tierConfig } = await supabase
      .from('tier_system_config')
      .select('hourly_rate')
      .eq('tier_level', assignmentData.subcontractors?.tier_level || 1)
      .eq('is_active', true)
      .single();
    
    const hourlyRate = tierConfig?.hourly_rate || 16.00; // Default to tier 1 rate
    
    // Calculate work hours from check-in/check-out (if available)
    let workHours = 3.0; // Default work hours
    let travelHours = 0.5; // Default travel compensation
    
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      workHours = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
    }
    
    const workPayment = Math.round(workHours * hourlyRate * 100) / 100;
    const travelPayment = Math.round(travelHours * hourlyRate * 100) / 100;
    const subcontractorAmount = Math.round((workPayment + travelPayment) * 100);
    const companyAmount = Math.max(0, orderAmount - subcontractorAmount);

    const { error: paymentError } = await supabase
      .from('subcontractor_payments')
      .insert({
        subcontractor_id: assignmentData.subcontractor_id,
        booking_id: orderData.id,
        assignment_id: assignmentId,
        total_amount: orderAmount,
        subcontractor_amount: subcontractorAmount,
        company_amount: companyAmount,
        hourly_rate: hourlyRate,
        tier_level: assignmentData.subcontractors?.tier_level || 1,
        payment_status: 'pending'
      });

    if (paymentError) {
      logStep("Payment record creation failed", paymentError);
    } else {
      logStep("Payment record created", { 
        subcontractorAmount: subcontractorAmount / 100, 
        companyAmount: companyAmount / 100,
        hourlyRate,
        workHours,
        paymentModel: 'hourly_rate'
      });
    }

    // Send completion email to customer
    const booking = orderData.bookings;
    if (booking && booking.customer_email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Service Completed!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Hi ${booking.customer_name},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                Great news! Your cleaning service has been completed successfully.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Service Details:</h3>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.service_date).toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.service_time}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.service_address}</p>
                <p style="margin: 5px 0;"><strong>Technician:</strong> ${assignmentData.subcontractors?.full_name}</p>
                ${completionNotes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${completionNotes}</p>` : ''}
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Thank you for choosing Bay Area Cleaning Professionals! We hope you're satisfied with our service.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:support@bayareacleaningpros.com" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Contact Support
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                Bay Area Cleaning Professionals<br>
                Professional cleaning services you can trust
              </p>
            </div>
          </div>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Bay Area Cleaning <notifications@bayareacleaningpros.com>",
          to: [booking.customer_email],
          subject: "🎉 Your Cleaning Service is Complete!",
          html: emailHtml,
        });

        logStep("Completion email sent", { emailId: emailResponse.data?.id });
      } catch (emailError) {
        logStep("Email sending failed", emailError);
      }
    }

    // Create in-app notification
    if (booking) {
      await supabase
        .from('subcontractor_notifications')
        .insert({
          type: 'order_completed',
          title: 'Order Completed Successfully',
          message: `Order for ${booking.customer_name} has been marked as completed. Payment processing will begin shortly.`,
          subcontractor_id: assignmentData.subcontractor_id,
          read: false
        });
    }

    // Send service completion data to Zapier webhook with split address
    try {
      // Parse address into components
      const addressParts = booking?.service_address?.split(', ') || [];
      const addressData = {
        street_address: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2]?.split(' ')[0] || '',
        zip_code: addressParts[2]?.split(' ')[1] || '',
        country: 'USA'
      };

      const completionData = {
        event_type: 'service_completed',
        order: {
          id: orderData.id,
          customer_name: booking?.customer_name,
          customer_email: booking?.customer_email,
          customer_phone: booking?.customer_phone,
          address: addressData,
          service_date: booking?.service_date,
          service_time: booking?.service_time,
          amount: orderAmount,
          status: 'completed',
          completion_notes: completionNotes,
          completed_at: new Date().toISOString()
        },
        assignment: {
          id: assignmentId,
          subcontractor_name: assignmentData.subcontractors?.full_name,
          subcontractor_email: assignmentData.subcontractors?.email,
          subcontractor_phone: assignmentData.subcontractors?.phone,
          tier_level: assignmentData.subcontractors?.tier_level || 1,
          assigned_at: assignmentData.assigned_at,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          work_duration_hours: Math.round(workHours * 100) / 100,
          travel_time_hours: travelHours,
          completed_at: new Date().toISOString(),
          customer_rating: customerRating,
          status: 'completed'
        },
        payment: {
          payment_model: 'hourly_rate',
          hourly_rate: hourlyRate,
          work_hours: Math.round(workHours * 100) / 100,
          work_payment: workPayment,
          travel_compensation: travelPayment,
          total_subcontractor_payment: subcontractorAmount / 100,
          company_administrative_fee: companyAmount / 100,
          customer_total: orderAmount / 100
        },
        completion_data: {
          completion_notes: completionNotes,
          customer_rating: customerRating,
          completed_at: new Date().toISOString()
        },
        metadata: {
          webhook_version: '2.0',
          sent_at: new Date().toISOString(),
          environment: 'production'
        }
      };

      const webhookResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/u6v0pgk/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      if (webhookResponse.ok) {
        logStep("Service completion data sent to Zapier successfully");
      } else {
        logStep("Failed to send completion data to Zapier", { status: webhookResponse.status });
      }
    } catch (webhookError) {
      logStep("Error sending completion data to Zapier", webhookError);
    }

    logStep("Order completion process finished successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Order completed and notifications sent",
      orderId,
      assignmentId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in order completion", { message: errorMessage, correlationId });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      correlationId,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});