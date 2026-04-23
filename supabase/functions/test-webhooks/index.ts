import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { webhook_url } = await req.json();
    console.log("Testing webhook endpoint:", webhook_url);

    // Test all 12 webhook types
    const webhookTypes = [
      {
        type: "order-status-changed",
        data: {
          order_id: "12345678-1234-1234-1234-123456789012",
          new_status: "completed",
          previous_status: "in_progress",
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          notify_customer: true,
          completion_time: new Date().toISOString()
        }
      },
      {
        type: "service-modified",
        data: {
          order_id: "12345678-1234-1234-1234-123456789012",
          request_id: "11111111-1111-1111-1111-111111111111",
          status: "approved",
          changes: {
            scheduled_date: "2024-01-15",
            scheduled_time: "10:00"
          },
          admin_notes: "Reschedule approved for customer convenience",
          reviewed_by: "22222222-2222-2222-2222-222222222222"
        }
      },
      {
        type: "payment-processed",
        data: {
          order_id: "12345678-1234-1234-1234-123456789012",
          payment_successful: true,
          amount: 15000, // $150.00
          tip_amount: 2000, // $20.00
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          payment_method: "stripe",
          transaction_id: "pi_test_123456789"
        }
      },
      {
        type: "customer-message",
        data: {
          order_id: "12345678-1234-1234-1234-123456789012",
          customer_email: "customer@example.com",
          customer_name: "John Doe",
          message: "Could you please use eco-friendly cleaning products?",
          message_type: "special_request",
          priority: "normal"
        }
      },
      {
        type: "booking-updated",
        data: {
          booking_id: "33333333-3333-3333-3333-333333333333",
          assigned_employee_id: "87654321-4321-4321-4321-210987654321",
          service_date: "2024-01-15",
          service_time: "10:00",
          special_instructions: "Key under mat, please lock door when leaving",
          estimated_duration: 120
        }
      },
      {
        type: "quality-check",
        data: {
          booking_id: "33333333-3333-3333-3333-333333333333",
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          customer_email: "customer@example.com",
          customer_name: "John Doe",
          overall_rating: 5,
          cleanliness_rating: 5,
          timeliness_rating: 4,
          professionalism_rating: 5,
          feedback_text: "Excellent service! Very thorough and professional.",
          photos: ["photo1.jpg", "photo2.jpg"]
        }
      },
      {
        type: "staff-activity",
        data: {
          assignment_id: "44444444-4444-4444-4444-444444444444",
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          check_in_time: "2024-01-15T10:00:00Z",
          check_out_time: "2024-01-15T12:30:00Z",
          check_in_location: "123 Main St, San Francisco, CA",
          check_out_location: "123 Main St, San Francisco, CA",
          notes: "Completed deep clean, used customer's preferred products",
          photos: ["before.jpg", "after.jpg"]
        }
      },
      {
        type: "customer-lifecycle",
        data: {
          customer_id: "55555555-5555-5555-5555-555555555555",
          event_type: "milestone_reached",
          milestone: "10_services_completed",
          customer_email: "customer@example.com",
          lifetime_value: 1500,
          referral_count: 2,
          loyalty_status: "gold"
        }
      },
      {
        type: "inventory-update",
        data: {
          location: "warehouse_sf",
          item_type: "cleaning_supplies",
          items: [
            { name: "All-purpose cleaner", quantity_used: 5, remaining: 45 },
            { name: "Microfiber cloths", quantity_used: 10, remaining: 30 }
          ],
          restock_needed: ["vacuum_bags", "glass_cleaner"],
          cost_impact: 45.50
        }
      },
      {
        type: "urgent-alert",
        data: {
          alert_type: "no_show",
          booking_id: "33333333-3333-3333-3333-333333333333",
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          description: "Customer not home, no response after 15 minutes",
          reported_by: "87654321-4321-4321-4321-210987654321",
          location: "123 Main St, San Francisco, CA",
          urgency: "high"
        }
      },
      {
        type: "analytics-event",
        data: {
          metric_type: "performance_update",
          subcontractor_id: "87654321-4321-4321-4321-210987654321",
          month_year: "2024-01",
          jobs_completed: 25,
          customer_rating: 4.8,
          on_time_percentage: 96,
          revenue_generated: 3750,
          complaints_count: 0
        }
      },
      {
        type: "external-sync",
        data: {
          system: "quickbooks",
          sync_type: "revenue_update",
          status: "success",
          records_synced: 45,
          total_amount: 12500,
          sync_time: new Date().toISOString(),
          errors: []
        }
      }
    ];

    const results = [];

    for (const webhook of webhookTypes) {
      try {
        console.log(`Testing webhook type: ${webhook.type}`);
        
        const response = await fetch(webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...webhook,
            timestamp: new Date().toISOString(),
            source: "test_function"
          }),
        });

        results.push({
          type: webhook.type,
          status: response.status,
          success: response.ok,
          response_text: response.ok ? "Success" : await response.text()
        });

      } catch (error) {
        results.push({
          type: webhook.type,
          status: 0,
          success: false,
          error: error.message
        });
      }
    }

    // Log test results
    await supabase.from('webhook_events').insert({
      event_type: 'webhook_test_completed',
      event_data: {
        webhook_url,
        results,
        test_timestamp: new Date().toISOString()
      },
      source: 'test_function'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tested ${webhookTypes.length} webhook types`,
        results,
        summary: {
          total_tests: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook test error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});