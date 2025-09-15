import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create payment function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);
    
    const { 
      amount, 
      currency,
      booking_data,
      payment_type,
      promo_code,
      payment_method = 'checkout', // Default to checkout for backward compatibility
      // Legacy fields for backward compatibility
      fullAmount,
      paymentType,
      squareFootage, 
      cleaningType, 
      frequency, 
      addOns,
      customerName,
      customerEmail,
      customerPhone,
      serviceAddress,
      bedrooms,
      bathrooms,
      scheduledDate,
      scheduledTime,
      nextDayUpcharge,
      newClientSpecial,
      membershipStatus,
      addonMemberDiscount
    } = requestBody;

    // Extract data from booking_data if provided (new format)
    const finalCustomerEmail = booking_data?.customerEmail || customerEmail;
    const finalCustomerName = booking_data?.customerName || customerName || 'Customer';
    const finalServiceAddress = booking_data?.address ? 
      `${booking_data.address.street}, ${booking_data.address.city}, ${booking_data.address.state} ${booking_data.address.zipCode}` : 
      serviceAddress;

    console.log("Validating required fields...");
    
    // Allow amount = 0 for "Pay After Service" if fullAmount is provided
    const isPayAfterService = (payment_type === 'pay_after_service' || paymentType === 'pay_after_service');
    const hasValidAmount = amount > 0 || (isPayAfterService && (fullAmount > 0));
    
    if (!hasValidAmount || !finalCustomerEmail) {
      console.error("Missing required fields:", { 
        amount, 
        fullAmount, 
        isPayAfterService, 
        hasValidAmount, 
        finalCustomerEmail 
      });
      throw new Error("Missing required fields: valid amount and customerEmail");
    }
    
    console.log("Payment type determined:", {
      isPayAfterService,
      paymentMethod: payment_method,
      amount: isPayAfterService ? 0 : amount,
      fullAmount: fullAmount || amount
    });

    console.log("Initializing Stripe...");
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Checking for existing Stripe customer...");
    // Check if a Stripe customer record exists for this email
    const customers = await stripe.customers.list({ email: finalCustomerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found, will create new one");
    }

    // Handle Payment Intent vs Checkout Session based on payment_method
    if (payment_method === 'payment_intent') {
      console.log("Creating Payment Intent for embedded payment...");
      
      // Check if this is a "pay_after_service" request - use SetupIntent for authorization only
      if (payment_type === 'pay_after_service' || paymentType === 'pay_after_service') {
        console.log("Creating SetupIntent for card authorization...");
        
        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          usage: 'off_session',
          metadata: {
            booking_data: JSON.stringify(booking_data || {}),
            payment_type: 'pay_after_service',
            promo_code: promo_code || '',
            full_amount: Math.round(fullAmount || amount), // Store full amount for later charging
          }
        });

        console.log("SetupIntent created:", setupIntent.id);

        // Create order record with authorization status
        const orderData = {
          stripe_session_id: setupIntent.id,
          amount: Math.round(fullAmount || amount), // Store full amount
          customer_name: finalCustomerName,
          customer_email: finalCustomerEmail,
          customer_phone: booking_data?.contactNumber || customerPhone,
          service_details: booking_data || {
            squareFootage,
            cleaningType,
            frequency,
            addOns,
            totalAmount: (fullAmount || amount) / 100,
            serviceAddress: finalServiceAddress,
            bedrooms,
            bathrooms,
            membershipStatus: membershipStatus || false,
            addonMemberDiscount: addonMemberDiscount || 0,
            paymentType: 'pay_after_service'
          },
          status: "authorized", // Different status for authorized payments
          created_at: new Date().toISOString()
        };

        const { error: orderError } = await supabaseClient.from("orders").insert(orderData);
        
        if (orderError) {
          console.error("Database insert error:", orderError);
          throw new Error(`Database error: ${orderError.message}`);
        }

        return new Response(JSON.stringify({ 
          client_secret: setupIntent.client_secret,
          setup_intent_id: setupIntent.id,
          payment_type: 'pay_after_service'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // amount should already be in cents
        currency: currency || 'usd',
        customer: customerId,
        metadata: {
          booking_data: JSON.stringify(booking_data || {}),
          payment_type: payment_type || paymentType || 'full',
          promo_code: promo_code || '',
          full_amount: Math.round(fullAmount || amount), // Store full amount for 25% payments
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log("Payment Intent created:", paymentIntent.id);

      // Create order record in database
      const orderData = {
        stripe_session_id: paymentIntent.id,
        amount: Math.round(amount),
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: booking_data?.contactNumber || customerPhone,
        service_details: booking_data || {
          squareFootage,
          cleaningType,
          frequency,
          addOns,
          totalAmount: amount / 100,
          serviceAddress: finalServiceAddress,
          bedrooms,
          bathrooms,
          membershipStatus: membershipStatus || false,
          addonMemberDiscount: addonMemberDiscount || 0
        },
        status: "pending",
        created_at: new Date().toISOString()
      };

      const { error: orderError } = await supabaseClient.from("orders").insert(orderData);
      
      if (orderError) {
        console.error("Database insert error:", orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      return new Response(JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle "Pay After Service" with Stripe Checkout in setup mode
    if (isPayAfterService) {
      console.log("Creating Stripe checkout session in setup mode for Pay After Service...");
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : finalCustomerEmail,
        mode: "setup",
        payment_method_types: ["card"],
        success_url: `${req.headers.get("origin")}/service-details?setup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/`,
        metadata: {
          payment_type: 'pay_after_service',
          full_amount: Math.round(fullAmount || amount),
          squareFootage: squareFootage?.toString() || "",
          cleaningType: cleaningType || "",  
          frequency: frequency || "",
          addOns: addOns?.join(",") || "",
          newClientSpecial: newClientSpecial ? "true" : "false",
        }
      });
      
      console.log("Setup checkout session created:", session.id);

      // Create order record with authorized status
      const orderData = {
        stripe_session_id: session.id,
        amount: Math.round(fullAmount || amount), // Store full amount
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: booking_data?.contactNumber || customerPhone,
        service_details: booking_data || {
          squareFootage,
          cleaningType,
          frequency,
          addOns,
          totalAmount: (fullAmount || amount) / 100,
          serviceAddress: finalServiceAddress,
          bedrooms,
          bathrooms,
          membershipStatus: membershipStatus || false,
          addonMemberDiscount: addonMemberDiscount || 0,
          paymentType: 'pay_after_service'
        },
        status: "authorized", // Different status for authorized payments
        created_at: new Date().toISOString()
      };

      console.log("Inserting authorized order:", orderData);
      const { error: orderError } = await supabaseClient.from("orders").insert(orderData);
      
      if (orderError) {
        console.error("Database insert error for authorized order:", orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      console.log("Authorized order created successfully, returning setup URL");
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("Creating Stripe checkout session for payment...");
    // Create a one-time payment session (regular flow)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : finalCustomerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Bay Area Cleaning Pros - ${cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning${newClientSpecial ? ' (New Client Special)' : ''}${membershipStatus ? ' (Member)' : ''}`,
              description: `${paymentType === 'half' ? '50% Payment' : paymentType === 'prepayment' ? '$150 Prepayment' : 'Full Payment'} • ${squareFootage} sq ft • ${frequency?.replace(/_/g, ' ')} service${addOns?.length ? ` • Add-ons: ${addOns.join(', ')}` : ''}${newClientSpecial ? ' • $71 Discount Applied' : ''}${addonMemberDiscount > 0 ? ` • $${addonMemberDiscount} Member Addon Discount` : ''}`
            },
            unit_amount: Math.round(amount * 100), // Convert all amounts to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/service-details?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        squareFootage: squareFootage?.toString() || "",
        cleaningType: cleaningType || "",
        frequency: frequency || "",
        addOns: addOns?.join(",") || "",
        newClientSpecial: newClientSpecial ? "true" : "false",
      }
    });
    
    console.log("Checkout session created:", session.id);

    console.log("Creating order record in database...");
    // Create order record in Supabase
    const orderData = {
      stripe_session_id: session.id,
      amount: Math.round(amount), // amount should already be in cents
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      customer_phone: booking_data?.contactNumber || customerPhone,
      square_footage: squareFootage,
      cleaning_type: cleaningType,
      frequency: frequency,
      add_ons: addOns,
      service_details: {
        squareFootage,
        cleaningType,
        frequency,
        addOns,
        totalAmount: amount, // Store amount in dollars for display
        serviceAddress,
        bedrooms,
        bathrooms,
        membershipStatus: membershipStatus || false,
        addonMemberDiscount: addonMemberDiscount || 0
      },
      status: "pending",
      created_at: new Date().toISOString()
    };

    const { data: orderResult, error: orderError } = await supabaseClient.from("orders").insert(orderData);
    
    if (orderError) {
      console.error("Database insert error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }
    
    console.log("Order created successfully, sending data to GoHighLevel");

    // Send data to GoHighLevel
    try {
      const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
      if (ghlApiKey) {
        const ghlPayload = {
          firstName: customerName?.split(' ')[0] || '',
          lastName: customerName?.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          phone: customerPhone || '',
          tags: [
            'Bay Area Cleaning Pros',
            cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          ].filter(Boolean),
          customFields: {
            square_footage: squareFootage?.toString() || '',
            cleaning_type: cleaningType || '',
            frequency: frequency || '',
            add_ons: addOns?.join(', ') || '',
            total_amount: paymentType === "prepayment" ? amount.toString() : (amount * 100).toString(), // in cents
            payment_type: paymentType || 'full',
            stripe_session_id: session.id,
            service_scheduled: scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime}` : '',
            next_day_booking: nextDayUpcharge > 0 ? 'Yes' : 'No'
          }
        };

        console.log("Sending to GoHighLevel:", JSON.stringify(ghlPayload, null, 2));

        const ghlResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ghlPayload)
        });

        if (ghlResponse.ok) {
          console.log("Successfully sent data to GoHighLevel");
        } else {
          const errorText = await ghlResponse.text();
          console.error("GoHighLevel API error:", ghlResponse.status, errorText);
        }
      }
    } catch (ghlError) {
      console.error("Error sending to GoHighLevel:", ghlError);
      // Don't fail the payment process if GoHighLevel fails
    }

    // Send transaction data to Zapier webhook
    try {
      const transactionData = {
        transaction_id: session.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service_date: scheduledDate,
        service_time: scheduledTime,
        cleaning_type: cleaningType,
        frequency: frequency,
        amount: paymentType === "prepayment" ? amount / 100 : amount, // Amount in dollars
        currency: 'USD',
        payment_status: 'pending',
        stripe_session_id: session.id,
        add_ons: addOns || [],
        square_footage: squareFootage,
        next_day_booking: nextDayUpcharge > 0,
        payment_type: paymentType,
        new_client_special: newClientSpecial || false,
        discount_applied: newClientSpecial ? 71 : 0,
        membership_status: membershipStatus || false,
        addon_member_discount: addonMemberDiscount || 0
      };

      const zapierResponse = await fetch("https://hooks.zapier.com/hooks/catch/5011258/uusrlmn/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          transaction_type: 'customer_payment',
          ...transactionData,
          source: 'bay_area_cleaning_pros'
        }),
      });

      if (zapierResponse.ok) {
        console.log('Transaction sent to Zapier successfully');
      } else {
        console.log('Warning: Failed to send transaction to Zapier:', zapierResponse.status);
      }
    } catch (zapierError) {
      console.log('Warning: Zapier webhook error:', zapierError);
    }

    console.log("Returning checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});