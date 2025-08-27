import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-RECENT-ORDERS-GHL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Send recent orders to GHL function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { limit = 5 } = body;

    logStep("Fetching recent orders", { limit });

    // Fetch recent orders with customer and booking details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        bookings (
          id,
          service_date,
          service_time,
          special_instructions
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No recent orders found',
        ordersSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep("Found orders to send", { count: orders.length });

    const ghlWebhookUrl = "https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/94998e4d-5fcc-45ea-a91f-2585e8f88600";
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each order
    for (const order of orders) {
      try {
        logStep("Processing order", { orderId: order.id });

        // Format order data for GHL
        const ghlPayload = {
          event_type: 'order_sync',
          timestamp: new Date().toISOString(),
          source: 'bay_area_cleaning_pros_sync',
          
          // Customer Information
          customer: {
            name: order.customer_name || 'Unknown Customer',
            email: order.customer_email || '',
            phone: order.customer_phone || '',
            address: {
              street: order.service_address || '',
              city: order.service_city || '',
              state: order.service_state || 'CA',
              zipCode: order.service_zip || ''
            }
          },
          
          // Service Details
          service: {
            type: order.service_details?.service_type || 'residential_cleaning',
            cleaningType: order.service_details?.cleaning_type || '',
            homeSize: order.service_details?.home_size || '',
            frequency: order.service_details?.frequency || 'one-time',
            addOns: order.service_details?.add_ons || [],
            serviceDate: order.bookings?.[0]?.service_date || order.scheduled_date || '',
            serviceTime: order.bookings?.[0]?.service_time || order.scheduled_time || '',
            specialInstructions: order.bookings?.[0]?.special_instructions || order.service_details?.special_instructions || ''
          },
          
          // Payment Information
          payment: {
            amount: order.amount || 0,
            paymentType: order.payment_type || 'pay_after_service',
            paymentAmount: order.payment_amount || 0,
            currency: 'USD',
            paymentIntentId: order.stripe_payment_intent_id || order.id,
            status: order.status === 'paid' ? 'successful' : order.status
          },
          
          // Pricing Breakdown
          pricing: {
            basePrice: order.pricing_details?.base_price || 0,
            addOnsTotal: order.pricing_details?.add_ons_total || 0,
            discounts: order.pricing_details?.discounts || {
              global: 0,
              frequency: 0,
              membership: 0,
              promo: 0
            },
            totalSavings: order.pricing_details?.total_savings || 0,
            finalTotal: order.amount || 0
          },
          
          // Property Details
          property: {
            squareFootage: order.property_details?.square_footage || null,
            bedrooms: order.property_details?.bedrooms || null,
            bathrooms: order.property_details?.bathrooms || null,
            dwellingType: order.property_details?.dwelling_type || null,
            flooringType: order.property_details?.flooring_type || null
          },
          
          // Booking Information
          booking: {
            id: order.bookings?.[0]?.id || order.id,
            isRecurring: order.service_details?.frequency !== 'one-time',
            membershipAdded: order.add_membership || false,
            promoCodeUsed: order.promo_code || null,
            userAuthenticated: order.user_id !== null
          },
          
          // Metadata for GHL workflows
          metadata: {
            platform: 'web',
            processedAt: new Date().toISOString(),
            leadSource: 'recent_orders_sync',
            orderValue: order.amount || 0,
            customerType: order.service_details?.frequency !== 'one-time' ? 'recurring' : 'one-time',
            originalOrderDate: order.created_at,
            syncMode: true
          }
        };

        // Send to GHL webhook with retry logic
        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          attempts++;
          
          try {
            response = await fetch(ghlWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ghlPayload),
            });

            if (response.ok) {
              logStep("Successfully sent order to GHL", { 
                orderId: order.id, 
                status: response.status,
                attempt: attempts 
              });
              successCount++;
              results.push({
                orderId: order.id,
                success: true,
                attempts: attempts
              });
              break;
            } else {
              if (attempts === maxAttempts) {
                throw new Error(`Failed after ${maxAttempts} attempts: ${response.status}`);
              }
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
          } catch (error) {
            if (attempts === maxAttempts) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }

      } catch (error) {
        logStep("Failed to send order to GHL", { 
          orderId: order.id, 
          error: error.message 
        });
        errorCount++;
        results.push({
          orderId: order.id,
          success: false,
          error: error.message
        });
      }

      // Small delay between orders to avoid overwhelming the webhook
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logStep("Completed sending orders to GHL", { 
      total: orders.length,
      success: successCount,
      errors: errorCount 
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${successCount} of ${orders.length} orders to GHL`,
      totalOrders: orders.length,
      successCount,
      errorCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send recent orders to GHL", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});