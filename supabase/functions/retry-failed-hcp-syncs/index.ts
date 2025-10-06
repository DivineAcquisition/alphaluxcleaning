import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("HCP retry function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find failed syncs ready for retry
    const now = new Date().toISOString();
    const { data: failedSyncs, error: fetchError } = await supabase
      .from('hcp_sync_log')
      .select(`
        *,
        bookings!inner(*)
      `)
      .eq('status', 'failed')
      .lt('retry_count', 5)
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', now)
      .order('next_retry_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!failedSyncs || failedSyncs.length === 0) {
      console.log("No failed syncs ready for retry");
      return new Response(JSON.stringify({
        success: true,
        message: "No syncs to retry",
        retried: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${failedSyncs.length} syncs to retry`);

    const results = [];

    for (const sync of failedSyncs) {
      console.log(`Retrying booking ${sync.booking_id} (attempt ${sync.retry_count + 1})`);
      
      try {
        // Build payload from booking data
        const booking = sync.bookings;
        
        // Fetch customer data
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', booking.customer_id)
          .single();

        if (!customer) {
          console.error(`Customer not found for booking ${booking.id}`);
          continue;
        }

        const payload = {
          booking_id: booking.id,
          customer: {
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email,
            phone: customer.phone
          },
          address: {
            line1: customer.address_line1 || customer.address,
            line2: customer.address_line2 || '',
            city: customer.city || '',
            state: customer.state,
            postal_code: customer.postal_code || booking.zip_code || ''
          },
          service: {
            type: booking.service_type,
            frequency: booking.frequency,
            sqft_range: booking.sqft_or_bedrooms,
            addons: booking.addons ? Object.keys(booking.addons) : []
          },
          schedule: {
            date: booking.service_date,
            time_window: booking.time_slot,
            timezone: booking.timezone || 'America/Chicago'
          },
          pricing: {
            total: parseFloat(booking.est_price),
            mrr_est: booking.mrr ? parseFloat(booking.mrr) : undefined,
            arr_est: booking.arr ? parseFloat(booking.arr) : undefined,
            currency: 'USD'
          },
          source: booking.source_channel || 'UI_DIRECT',
          special_instructions: booking.special_instructions,
          first_booking: booking.first_booking,
          recurring_active: booking.recurring_active
        };

        // Call sync function
        const response = await supabase.functions.invoke('sync-booking-to-hcp', {
          body: payload
        });

        if (response.error) {
          throw response.error;
        }

        results.push({
          booking_id: booking.id,
          success: true
        });

        console.log(`Successfully retried booking ${booking.id}`);

      } catch (error) {
        console.error(`Failed to retry booking ${sync.booking_id}:`, error);
        
        // Update retry count and next retry time
        const newRetryCount = sync.retry_count + 1;
        const shouldRetry = newRetryCount < 5 && 
          ['network_error', 'rate_limit', 'server_error'].includes(sync.error_category);
        
        const nextRetry = shouldRetry ? calculateNextRetry(newRetryCount) : null;

        await supabase
          .from('hcp_sync_log')
          .update({
            retry_count: newRetryCount,
            next_retry_at: nextRetry ? nextRetry.toISOString() : null,
            last_error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', sync.id);

        results.push({
          booking_id: sync.booking_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Retried ${results.length} syncs: ${successCount} succeeded, ${failedCount} failed`,
      retried: results.length,
      succeeded: successCount,
      failed: failedCount,
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Retry function error:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function calculateNextRetry(retryCount: number): Date {
  const delays = [5, 15, 60, 240, 1440]; // minutes: 5m, 15m, 1h, 4h, 24h
  const delayMinutes = delays[Math.min(retryCount, delays.length - 1)];
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}