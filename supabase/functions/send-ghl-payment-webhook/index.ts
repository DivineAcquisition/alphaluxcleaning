import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GHL-PAYMENT-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("GHL payment webhook function started");

    const body = await req.json();
    logStep("Request body received", { bodyKeys: Object.keys(body) });

    const ghlWebhookUrl = "https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/94998e4d-5fcc-45ea-a91f-2585e8f88600";

    // Format the payment data for GHL
    const ghlPayload = {
      event_type: 'payment_successful',
      timestamp: new Date().toISOString(),
      source: 'bay_area_cleaning_pros',
      
      // Customer Information
      customer: {
        name: body.customer?.name || body.customerName || 'Unknown Customer',
        email: body.customer?.email || body.customerEmail || '',
        phone: body.customer?.phone || body.contactNumber || '',
        address: {
          street: body.customer?.address || body.address?.street || '',
          city: body.customer?.city || body.address?.city || '',
          state: body.customer?.state || body.address?.state || 'TX',
          zipCode: body.customer?.zipCode || body.address?.zipCode || ''
        }
      },
      
      // Service Details
      service: {
        type: body.serviceType || 'residential_cleaning',
        cleaningType: body.cleaningType || body.homeSize || '',
        homeSize: body.homeSize || '',
        frequency: body.frequency || 'one-time',
        addOns: body.addOns || [],
        serviceDate: body.serviceDate || body.serviceDateSeparate || '',
        serviceTime: body.serviceTime || body.serviceTimeSeparate || '',
        specialInstructions: body.specialInstructions || ''
      },
      
      // Payment Information
      payment: {
        amount: body.finalTotal || body.totalPrice || body.amount || 0,
        paymentType: body.paymentType || 'pay_after_service',
        paymentAmount: body.paymentAmount || 0,
        currency: 'USD',
        paymentIntentId: body.paymentIntentId || body.order_id || '',
        status: 'successful'
      },
      
      // Pricing Breakdown
      pricing: {
        basePrice: body.basePrice || 0,
        addOnsTotal: body.addOnsTotal || 0,
        discounts: body.discounts || {
          global: 0,
          frequency: 0,
          membership: 0,
          promo: 0
        },
        totalSavings: body.totalSavings || 0,
        finalTotal: body.finalTotal || body.totalPrice || 0
      },
      
      // Property Details
      property: {
        squareFootage: body.propertyDetails?.squareFootage || body.squareFootage || null,
        bedrooms: body.propertyDetails?.bedrooms || body.bedrooms || null,
        bathrooms: body.propertyDetails?.bathrooms || body.bathrooms || null,
        dwellingType: body.propertyDetails?.dwellingType || body.dwellingType || null,
        flooringType: body.propertyDetails?.flooringType || body.flooringType || null
      },
      
      // Booking Information
      booking: {
        id: body.booking_id || body.order_id || '',
        isRecurring: body.frequency !== 'one-time',
        membershipAdded: body.addMembership || false,
        promoCodeUsed: body.promoCode || null,
        userAuthenticated: body.userAuthenticated || false
      },
      
      // Metadata for GHL workflows
      metadata: {
        platform: 'web',
        processedAt: new Date().toISOString(),
        leadSource: 'website_booking',
        orderValue: body.finalTotal || body.totalPrice || 0,
        customerType: body.frequency !== 'one-time' ? 'recurring' : 'one-time'
      }
    };

    logStep("Formatted GHL payload", { payloadSize: JSON.stringify(ghlPayload).length });

    // Send to GHL webhook with retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      logStep(`Attempting to send to GHL (attempt ${attempts})`);

      try {
        response = await fetch(ghlWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ghlPayload),
        });

        if (response.ok) {
          logStep("Successfully sent to GHL", { status: response.status });
          break;
        } else {
          logStep(`GHL webhook failed with status ${response.status}`, { 
            status: response.status,
            statusText: response.statusText 
          });
          
          if (attempts === maxAttempts) {
            throw new Error(`GHL webhook failed after ${maxAttempts} attempts: ${response.status}`);
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      } catch (error) {
        logStep(`GHL webhook attempt ${attempts} failed`, { error: error.message });
        
        if (attempts === maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'GHL payment webhook sent successfully',
      attempts: attempts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in GHL payment webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});