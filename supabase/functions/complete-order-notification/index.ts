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
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Order completion notification started");

    // Initialize Supabase with service role for full access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId, assignmentId, completionNotes, customerRating }: CompleteOrderRequest = await req.json();
    logStep("Request parsed", { orderId, assignmentId });

    // Check if this is a test request
    const isTestRequest = orderId.startsWith('test_') || assignmentId.startsWith('test_');
    
    if (isTestRequest) {
      logStep("Processing test request");
      
      // Create mock data for test
      const testCompletionData = {
        event_type: 'service_completed',
        order: {
          id: orderId,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '(555) 123-4567',
          service_address: '123 Test Street, Test City, CA 94102',
          service_date: new Date().toISOString().split('T')[0],
          service_time: '10:00 AM',
          amount: 25000, // $250
          status: 'completed',
          completion_notes: completionNotes,
          completed_at: new Date().toISOString()
        },
        assignment: {
          id: assignmentId,
          subcontractor_name: 'Test Subcontractor',
          subcontractor_email: 'testworker@example.com',
          subcontractor_phone: '(555) 987-6543',
          assigned_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date().toISOString(),
          customer_rating: customerRating,
          status: 'completed'
        },
        payment: {
          total_amount: 25000,
          subcontractor_amount: 15000,
          company_amount: 10000,
          split_percentage: 60,
          split_tier: '60_40'
        },
        completion_data: {
          completion_notes: completionNotes,
          customer_rating: customerRating,
          completed_at: new Date().toISOString()
        },
        metadata: {
          webhook_version: '1.0',
          sent_at: new Date().toISOString(),
          environment: 'test'
        }
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

        if (webhookResponse.ok) {
          logStep("Test completion data sent to Zapier successfully");
        } else {
          logStep("Failed to send test completion data to Zapier", { status: webhookResponse.status });
        }
      } catch (webhookError) {
        logStep("Error sending test completion data to Zapier", webhookError);
      }

      logStep("Test order completion process finished successfully");

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Test order completion processed and webhook sent",
        orderId,
        assignmentId,
        webhook_status: "sent",
        test_mode: true
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

    // Create payment record for subcontractor
    const orderAmount = orderData.amount || 10000; // Default $100 if not set
    const splitTier = assignmentData.subcontractors?.split_tier || '60_40';
    const splits = {
      '60_40': { subcontractor: 60, company: 40 },
      '70_30': { subcontractor: 70, company: 30 },
      '80_20': { subcontractor: 80, company: 20 }
    };
    const split = splits[splitTier as keyof typeof splits] || splits['60_40'];
    
    const subcontractorAmount = Math.round((orderAmount * split.subcontractor) / 100);
    const companyAmount = Math.round((orderAmount * split.company) / 100);

    const { error: paymentError } = await supabase
      .from('subcontractor_payments')
      .insert({
        subcontractor_id: assignmentData.subcontractor_id,
        booking_id: orderData.id,
        assignment_id: assignmentId,
        total_amount: orderAmount,
        subcontractor_amount: subcontractorAmount,
        company_amount: companyAmount,
        split_percentage: split.subcontractor,
        payment_status: 'pending'
      });

    if (paymentError) {
      logStep("Payment record creation failed", paymentError);
    } else {
      logStep("Payment record created", { subcontractorAmount, companyAmount });
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

    // Send service completion data to Zapier webhook
    try {
      const completionData = {
        event_type: 'service_completed',
        order: {
          id: orderData.id,
          customer_name: booking?.customer_name,
          customer_email: booking?.customer_email,
          customer_phone: booking?.customer_phone,
          service_address: booking?.service_address,
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
          assigned_at: assignmentData.assigned_at,
          completed_at: new Date().toISOString(),
          customer_rating: customerRating,
          status: 'completed'
        },
        payment: {
          total_amount: orderAmount,
          subcontractor_amount: subcontractorAmount,
          company_amount: companyAmount,
          split_percentage: split.subcontractor,
          split_tier: splitTier
        },
        completion_data: {
          completion_notes: completionNotes,
          customer_rating: customerRating,
          completed_at: new Date().toISOString()
        },
        metadata: {
          webhook_version: '1.0',
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
    logStep("ERROR in order completion", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});