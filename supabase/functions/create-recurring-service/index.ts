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
    } = await req.json();

    console.log('Creating recurring service for customer:', customerId);

    // Check if customer already has active recurring service
    const { data: existingService } = await supabase
      .from('recurring_services')
      .select('id')
      .eq('customer_id', customerId)
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
        customer_id: customerId,
        booking_id: bookingId,
        service_type: serviceType,
        frequency: frequency,
        price_per_service: pricePerService,
        discount_percentage: discountPercentage,
        next_service_date: nextServiceDate.toISOString().split('T')[0],
        status: 'active',
        service_address: serviceAddress,
        last_cleaned_timeline: lastCleanedTimeline || null,
        acknowledged_deep_clean_warning: acknowledgedDeepCleanWarning || false,
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
      .eq('id', customerId)
      .single();

    // Send confirmation email
    if (customer) {
      const { error: emailError } = await supabase.functions.invoke('send-email-system', {
        body: {
          to: customer.email,
          templateKey: 'recurring_confirmed',
          variables: {
            first_name: customer.first_name || customer.name.split(' ')[0],
            frequency: frequency,
            price_per_service: pricePerService.toFixed(2),
            discount_percentage: discountPercentage,
            next_service_date: nextServiceDate.toLocaleDateString(),
            service_type: serviceType,
            app_url: 'https://app.alphaluxclean.com',
          },
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
