import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function logStep(step: string, details?: any) {
  console.log(`[ABANDONED-CHECKOUT] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting abandoned checkout processing');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find partial bookings for 1-hour follow-up
    // Must be: created 1+ hours ago, not completed, not already sent 1h email, past lead_captured step
    const { data: oneHourAbandoned, error: oneHourError } = await supabase
      .from('partial_bookings')
      .select('*')
      .is('completed_at', null)
      .eq('email_sent_1h', false)
      .lt('created_at', oneHourAgo.toISOString())
      .neq('last_step', 'lead_captured') // They must have progressed past lead capture
      .neq('last_step', 'completed')
      .limit(50);

    if (oneHourError) {
      logStep('Error fetching 1h abandoned', { error: oneHourError.message });
    } else {
      logStep(`Found ${oneHourAbandoned?.length || 0} abandoned checkouts for 1h email`);
    }

    // Find partial bookings for 24-hour follow-up
    const { data: twentyFourHourAbandoned, error: twentyFourHourError } = await supabase
      .from('partial_bookings')
      .select('*')
      .is('completed_at', null)
      .eq('email_sent_1h', true) // Must have already sent 1h email
      .eq('email_sent_24h', false)
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .neq('last_step', 'lead_captured')
      .neq('last_step', 'completed')
      .limit(50);

    if (twentyFourHourError) {
      logStep('Error fetching 24h abandoned', { error: twentyFourHourError.message });
    } else {
      logStep(`Found ${twentyFourHourAbandoned?.length || 0} abandoned checkouts for 24h email`);
    }

    const results = {
      oneHourEmails: 0,
      twentyFourHourEmails: 0,
      errors: [] as string[]
    };

    // Process 1-hour abandoned checkouts
    for (const abandoned of (oneHourAbandoned || [])) {
      try {
        // Send abandoned checkout email (variant A - 1 hour)
        const { error: emailError } = await supabase.functions.invoke('send-email-system', {
          body: {
            template: 'abandoned_checkout',
            to: abandoned.email,
            data: {
              first_name: abandoned.first_name || 'there',
              customer_name: abandoned.first_name || 'there',
              service_type: abandoned.service_type || 'Standard Cleaning',
              service_name: abandoned.service_type || 'Standard Cleaning',
              home_size: abandoned.home_size,
              price: abandoned.base_price ? `$${abandoned.base_price}` : 'your quote',
              locked_price: abandoned.base_price ? `$${abandoned.base_price}` : 'Special pricing',
              booking_url: `https://app.alphaluxclean.com/book/start?prefill=${encodeURIComponent(abandoned.email)}`,
              resume_url: `https://app.alphaluxclean.com/book/start?prefill=${encodeURIComponent(abandoned.email)}`
            },
            category: 'marketing',
            subject_variant: 'A'
          }
        });

        if (emailError) {
          logStep('Error sending 1h email', { email: abandoned.email, error: emailError.message });
          results.errors.push(`1h email to ${abandoned.email}: ${emailError.message}`);
        } else {
          // Mark as sent
          await supabase
            .from('partial_bookings')
            .update({ email_sent_1h: true })
            .eq('id', abandoned.id);
          
          results.oneHourEmails++;
          logStep('Sent 1h abandoned email', { email: abandoned.email });
        }
      } catch (err) {
        logStep('Exception sending 1h email', { email: abandoned.email, error: err.message });
        results.errors.push(`1h email to ${abandoned.email}: ${err.message}`);
      }
    }

    // Process 24-hour abandoned checkouts
    for (const abandoned of (twentyFourHourAbandoned || [])) {
      try {
        // Send abandoned checkout email (variant B - 24 hours)
        const { error: emailError } = await supabase.functions.invoke('send-email-system', {
          body: {
            template: 'abandoned_checkout',
            to: abandoned.email,
            data: {
              first_name: abandoned.first_name || 'there',
              customer_name: abandoned.first_name || 'there',
              service_type: abandoned.service_type || 'Standard Cleaning',
              service_name: abandoned.service_type || 'Standard Cleaning',
              home_size: abandoned.home_size,
              price: abandoned.base_price ? `$${abandoned.base_price}` : 'your quote',
              locked_price: abandoned.base_price ? `$${abandoned.base_price}` : 'Special pricing',
              booking_url: `https://app.alphaluxclean.com/book/start?prefill=${encodeURIComponent(abandoned.email)}`,
              resume_url: `https://app.alphaluxclean.com/book/start?prefill=${encodeURIComponent(abandoned.email)}`
            },
            category: 'marketing',
            subject_variant: 'B'
          }
        });

        if (emailError) {
          logStep('Error sending 24h email', { email: abandoned.email, error: emailError.message });
          results.errors.push(`24h email to ${abandoned.email}: ${emailError.message}`);
        } else {
          // Mark as sent
          await supabase
            .from('partial_bookings')
            .update({ email_sent_24h: true })
            .eq('id', abandoned.id);
          
          results.twentyFourHourEmails++;
          logStep('Sent 24h abandoned email', { email: abandoned.email });
        }
      } catch (err) {
        logStep('Exception sending 24h email', { email: abandoned.email, error: err.message });
        results.errors.push(`24h email to ${abandoned.email}: ${err.message}`);
      }
    }

    logStep('Processing complete', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: {
          oneHourEmails: results.oneHourEmails,
          twentyFourHourEmails: results.twentyFourHourEmails
        },
        errors: results.errors.length > 0 ? results.errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Error in process-abandoned-checkouts', { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});