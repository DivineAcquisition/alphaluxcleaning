import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log('🔄 Processing webhook queue...');

    // Get pending webhooks (not processed, not failed too many times)
    const { data: queueItems, error: queueError } = await supabase
      .from('webhook_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('📭 No pending webhooks to process');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending webhooks',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📦 Found ${queueItems.length} webhooks to process`);

    const results = [];

    for (const item of queueItems) {
      console.log(`🚀 Processing webhook queue item ${item.id} for booking ${item.booking_id}`);

      // Mark as processing
      await supabase
        .from('webhook_queue')
        .update({ 
          status: 'processing',
          attempts: item.attempts + 1
        })
        .eq('id', item.id);

      try {
        // Call enhanced webhook function
        const webhookResponse = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
          body: {
            booking_id: item.booking_id,
            action: item.event_type
          }
        });

        // Call HCP sync function
        const hcpResponse = await supabase.functions.invoke('trigger-hcp-sync', {
          body: {
            booking_id: item.booking_id
          }
        });

        const allSuccess = !webhookResponse.error && !hcpResponse.error;

        if (allSuccess) {
          // Mark as completed
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          console.log(`✅ Webhook processed successfully for booking ${item.booking_id}`);
          results.push({ queue_id: item.id, booking_id: item.booking_id, success: true });
        } else {
          throw new Error(`Webhook failed: ${webhookResponse.error?.message || hcpResponse.error?.message}`);
        }

      } catch (error) {
        console.error(`❌ Webhook processing failed for ${item.booking_id}:`, error.message);

        const nextRetryAt = new Date();
        nextRetryAt.setMinutes(nextRetryAt.getMinutes() + (item.attempts + 1) * 5); // Exponential backoff: 5, 10, 15 mins

        if (item.attempts + 1 >= 3) {
          // Max attempts reached, mark as failed
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'failed',
              last_error: error.message
            })
            .eq('id', item.id);
        } else {
          // Schedule retry
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'pending',
              last_error: error.message,
              next_retry_at: nextRetryAt.toISOString()
            })
            .eq('id', item.id);
        }

        results.push({ 
          queue_id: item.id, 
          booking_id: item.booking_id, 
          success: false, 
          error: error.message 
        });
      }
    }

    console.log(`🏁 Processed ${results.length} webhooks`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Queue processor error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
