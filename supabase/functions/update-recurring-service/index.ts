import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { recurring_service_id, action, new_frequency, pause_until, cancellation_reason } = await req.json();

    if (!recurring_service_id || !action) {
      return new Response(
        JSON.stringify({ error: 'recurring_service_id and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the recurring service
    const { data: service, error: serviceError } = await supabase
      .from('recurring_services')
      .select('*')
      .eq('id', recurring_service_id)
      .single();

    if (serviceError) throw serviceError;

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'change_frequency':
        if (!new_frequency) {
          throw new Error('new_frequency is required for change_frequency action');
        }
        
        // Calculate new discount
        const discounts: any = { 'weekly': 0.15, 'bi-weekly': 0.10, 'monthly': 0.05 };
        const newDiscount = discounts[new_frequency] || 0;
        
        updateData = {
          ...updateData,
          frequency: new_frequency,
          discount_percentage: newDiscount
        };

        // Update Stripe subscription if exists
        if (service.stripe_subscription_id) {
          await stripe.subscriptions.update(service.stripe_subscription_id, {
            metadata: { frequency: new_frequency }
          });
        }

        // Queue email notification
        await supabase.from('email_jobs').insert({
          to_email: service.customer_email,
          to_name: service.customer_name,
          template_name: 'recurring_frequency_changed',
          payload: { service, new_frequency },
          category: 'transactional'
        });
        break;

      case 'pause':
        updateData = {
          ...updateData,
          status: 'paused',
          pause_start_date: new Date().toISOString(),
          pause_end_date: pause_until || null
        };

        if (service.stripe_subscription_id) {
          await stripe.subscriptions.update(service.stripe_subscription_id, {
            pause_collection: { behavior: 'void' }
          });
        }

        await supabase.from('email_jobs').insert({
          to_email: service.customer_email,
          to_name: service.customer_name,
          template_name: 'recurring_service_paused',
          payload: { service, pause_until },
          category: 'transactional'
        });
        break;

      case 'resume':
        updateData = {
          ...updateData,
          status: 'active',
          pause_start_date: null,
          pause_end_date: null
        };

        if (service.stripe_subscription_id) {
          await stripe.subscriptions.update(service.stripe_subscription_id, {
            pause_collection: null
          });
        }

        await supabase.from('email_jobs').insert({
          to_email: service.customer_email,
          to_name: service.customer_name,
          template_name: 'recurring_service_resumed',
          payload: { service },
          category: 'transactional'
        });
        break;

      case 'cancel':
        updateData = {
          ...updateData,
          status: 'cancelled',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: cancellation_reason || 'No reason provided'
        };

        if (service.stripe_subscription_id) {
          await stripe.subscriptions.cancel(service.stripe_subscription_id);
        }

        await supabase.from('email_jobs').insert({
          to_email: service.customer_email,
          to_name: service.customer_name,
          template_name: 'recurring_service_cancelled',
          payload: { service, cancellation_reason },
          category: 'transactional'
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update the recurring service
    const { data: updatedService, error: updateError } = await supabase
      .from('recurring_services')
      .update(updateData)
      .eq('id', recurring_service_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, service: updatedService }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating recurring service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});