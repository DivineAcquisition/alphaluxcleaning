import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    customerId,
    customerInfo,
    bookingId,
    frequency,
    serviceType,
    pricePerService,
    discountPercentage,
    paymentMethodId,
    serviceAddress,
    propertyDetails,
    lastCleanedTimeline,
    acknowledgedDeepCleanWarning,
    bundleCode,
    commitmentMonths,
  } = await req.json();

    // Validate service type allows recurring
    const allowedRecurringTypes = ['regular', 'standard', 'deep'];
    if (!allowedRecurringTypes.includes(serviceType?.toLowerCase())) {
      return new Response(
        JSON.stringify({ 
          error: `${serviceType} cleaning is not available for recurring services. Only Standard and Deep cleaning can be recurring.` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    let finalCustomerId = customerId;

    // If no customerId provided, create new customer
    if (!customerId && customerInfo) {
      console.log('Creating new customer:', customerInfo.email);
      
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address_line1: serviceAddress.street,
          address_line2: serviceAddress.street2,
          city: serviceAddress.city,
          state: serviceAddress.state,
          postal_code: serviceAddress.postalCode,
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        throw customerError;
      }

      finalCustomerId = newCustomer.id;
      console.log('New customer created:', finalCustomerId);
    }

    console.log('Creating recurring service for customer:', finalCustomerId);

    // Check if customer already has active recurring service
    const { data: existingService } = await supabase
      .from('recurring_services')
      .select('id')
      .eq('customer_id', finalCustomerId)
      .eq('status', 'active')
      .single();

    if (existingService) {
      return new Response(
        JSON.stringify({ 
          error: 'Customer already has an active recurring service',
          existingServiceId: existingService.id 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Calculate next service date (2 weeks from now)
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + 14);

    // Create recurring service
    const { data: recurringService, error: createError } = await supabase
      .from('recurring_services')
      .insert({
        customer_id: finalCustomerId,
        booking_id: bookingId || null,
        service_type: serviceType,
        frequency: frequency,
        price_per_service: pricePerService,
        discount_percentage: discountPercentage,
        next_service_date: nextServiceDate.toISOString().split('T')[0],
        status: 'active',
        service_address: serviceAddress,
        last_cleaned_timeline: lastCleanedTimeline || null,
        acknowledged_deep_clean_warning: acknowledgedDeepCleanWarning || false,
        bundle_code: bundleCode || null,
        commitment_months: commitmentMonths || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating recurring service:', createError);
      throw createError;
    }

    console.log('Recurring service created:', recurringService.id);

    // Get customer details for email
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, first_name')
      .eq('id', finalCustomerId)
      .single();

    // Send confirmation email
    if (customer) {
      const emailVariables: any = {
        first_name: customer.first_name || customer.name.split(' ')[0],
        frequency: frequency,
        price_per_service: pricePerService.toFixed(2),
        discount_percentage: discountPercentage,
        next_service_date: nextServiceDate.toLocaleDateString(),
        service_type: serviceType,
        app_url: 'https://app.alphaluxclean.com',
      };

      // Add bundle info if applicable
      if (bundleCode && commitmentMonths) {
        emailVariables.bundle_applied = true;
        emailVariables.bundle_code = bundleCode;
        emailVariables.commitment_months = commitmentMonths;
        emailVariables.deep_clean_code = bundleCode; // Will be generated
      }

      const { error: emailError } = await supabase.functions.invoke('send-email-system', {
        body: {
          to: customer.email,
          templateKey: 'recurring_confirmed',
          variables: emailVariables,
        },
      });

      if (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recurringServiceId: recurringService.id,
        nextServiceDate: nextServiceDate.toISOString(),
        bundleCode: bundleCode || null,
        commitmentMonths: commitmentMonths || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in create-recurring-service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
