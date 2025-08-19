import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending notifications that are ready to be processed
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3) // Don't retry more than 3 times
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process in batches

    if (error) {
      console.error('Error fetching notifications:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${notifications?.length || 0} notifications`);

    const results = [];

    for (const notification of notifications || []) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'processing',
            attempts: notification.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        let success = false;
        let errorMessage = '';

        // Process based on delivery method
        if (notification.delivery_method === 'email') {
          success = await sendEmailNotification(notification);
        } else if (notification.delivery_method === 'sms') {
          success = await sendSMSNotification(notification);
        } else if (notification.delivery_method === 'in_app') {
          success = await createInAppNotification(notification, supabase);
        } else if (notification.delivery_method === 'push') {
          success = await sendPushNotification(notification);
        }

        // Update status
        const updateData = success 
          ? { 
              status: 'sent', 
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : { 
              status: notification.attempts >= 2 ? 'failed' : 'pending',
              error_message: errorMessage || 'Processing failed',
              updated_at: new Date().toISOString()
            };

        await supabase
          .from('notification_queue')
          .update(updateData)
          .eq('id', notification.id);

        // Track analytics
        await supabase
          .from('notification_analytics')
          .insert({
            notification_id: notification.id,
            customer_id: notification.customer_id,
            event_type: success ? 'sent' : 'failed',
            delivery_method: notification.delivery_method,
          });

        results.push({
          id: notification.id,
          success,
          delivery_method: notification.delivery_method,
        });

      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('notification_queue')
          .update({
            status: notification.attempts >= 2 ? 'failed' : 'pending',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        results.push({
          id: notification.id,
          success: false,
          error: error.message,
          delivery_method: notification.delivery_method,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Queue processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmailNotification(notification: any): Promise<boolean> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: notification.customer_id, // Will need customer email lookup
        subject: notification.subject,
        message: notification.message,
        notificationId: notification.id,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

async function sendSMSNotification(notification: any): Promise<boolean> {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Get customer phone from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', notification.customer_id)
      .single();

    if (!profile?.phone) {
      console.error('No phone number found for customer');
      return false;
    }

    // Use the enhanced SMS notification function
    const { data, error } = await supabase.functions.invoke('enhanced-sms-notification', {
      body: {
        to: profile.phone,
        message: notification.message,
        notificationId: notification.id,
        customerId: notification.customer_id,
        templateData: notification.template_data || {}
      }
    });

    if (error) {
      console.error('SMS sending error:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
}

async function createInAppNotification(notification: any, supabase: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_notifications')
      .insert({
        customer_id: notification.customer_id,
        title: notification.subject || 'Notification',
        message: notification.message,
        notification_type: notification.notification_type,
        order_id: notification.order_id,
        booking_id: notification.booking_id,
      });

    return !error;
  } catch (error) {
    console.error('In-app notification error:', error);
    return false;
  }
}

async function sendPushNotification(notification: any): Promise<boolean> {
  // Placeholder for push notification implementation
  // Would integrate with service like Firebase Cloud Messaging
  console.log('Push notification placeholder for:', notification.id);
  return true;
}