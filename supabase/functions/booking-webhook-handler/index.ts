import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BookingWebhookEvent {
  event_type: 'booking_confirmed' | 'booking_created' | 'payment_succeeded';
  booking_id: string;
  customer_id: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, booking_id, customer_id, metadata }: BookingWebhookEvent = await req.json();
    
    console.log(`Processing ${event_type} for booking ${booking_id}`);

    switch (event_type) {
      case 'booking_created':
        await handleBookingCreated(booking_id, metadata);
        break;
        
      case 'booking_confirmed':
        await handleBookingConfirmed(booking_id);
        break;
        
      case 'payment_succeeded':
        await handlePaymentSucceeded(booking_id, customer_id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in booking webhook handler:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function handleBookingCreated(bookingId: string, metadata: any) {
  // Check for referral attribution
  const refCode = metadata?.ref_code || getCookieValue('ref_code');
  
  if (refCode) {
    try {
      const utms = metadata?.utms || {};
      const attributionMethod = metadata?.attribution_method || 'COOKIE';
      
      await supabase.functions.invoke('referral-system', {
        body: {
          action: 'attribute',
          booking_id: bookingId,
          ref_code: refCode,
          utms,
          attribution_method: attributionMethod
        }
      });
      
      console.log(`Referral attributed for booking ${bookingId} with code ${refCode}`);
    } catch (error) {
      console.error('Failed to attribute referral:', error);
    }
  }

  // Send booking started email
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id, 
        service_type, 
        est_price,
        customers!inner(first_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (booking) {
      await supabase.functions.invoke('send-email-system', {
        body: {
          template: 'booking_started',
          to: booking.customers.email,
          data: {
            first_name: booking.customers.first_name,
            booking_id: bookingId,
            service_type: booking.service_type,
            price_final: booking.est_price
          },
          category: 'transactional',
          event_id: `booking_started_${bookingId}`
        }
      });
    }
  } catch (error) {
    console.error('Failed to send booking started email:', error);
  }
}

async function handleBookingConfirmed(bookingId: string) {
  try {
    // Generate referral code for customer if they don't have one
    const { data: booking } = await supabase
      .from('bookings')
      .select('customer_id, customers!inner(id, marketing_opt_in)')
      .eq('id', bookingId)
      .single();

    if (booking && booking.customers.marketing_opt_in) {
      await supabase.functions.invoke('referral-system', {
        body: {
          action: 'issue',
          customer_id: booking.customer_id
        }
      });
    }

    // Send booking confirmation email
    await sendBookingConfirmationEmail(bookingId);
    
  } catch (error) {
    console.error('Error in handleBookingConfirmed:', error);
  }
}

async function handlePaymentSucceeded(bookingId: string, customerId: string) {
  try {
    // Issue referral rewards if applicable
    await supabase.functions.invoke('referral-system', {
      body: {
        action: 'reward',
        booking_id: bookingId
      }
    });

    // Send payment success email
    await sendPaymentSuccessEmail(bookingId);
    
    console.log(`Payment processed and referral rewards issued for booking ${bookingId}`);
    
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

async function sendBookingConfirmationEmail(bookingId: string) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        service_type,
        frequency,
        service_date,
        time_slot,
        est_price,
        manage_token,
        receipt_url,
        customers!inner(first_name, email, phone, address_line1, city, state, postal_code)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    const manageLink = `https://app.alphaluxclean.com/manage/${booking.manage_token}`;
    
    await supabase.functions.invoke('send-email-system', {
      body: {
        template: 'booking_confirmed',
        to: booking.customers.email,
        data: {
          first_name: booking.customers.first_name,
          service_type: booking.service_type,
          frequency: booking.frequency,
          service_date: booking.service_date,
          time_window: booking.time_slot,
          address_line1: booking.customers.address_line1,
          city: booking.customers.city,
          state: booking.customers.state,
          postal_code: booking.customers.postal_code,
          price_final: booking.est_price,
          manage_link: manageLink,
          receipt_link: booking.receipt_url || '#'
        },
        category: 'transactional',
        event_id: `booking_confirmed_${bookingId}`
      }
    });

    // Queue SMS notification via OpenPhone
    if (booking.customers.phone) {
      console.log('Queueing booking confirmation SMS');
      
      await supabase
        .from('notification_queue')
        .insert({
          delivery_method: 'sms',
          recipient_phone: booking.customers.phone,
          message: '', // Will be rendered from template
          template_id: 'booking_confirmed',
          variables: {
            first_name: booking.customers.first_name || 'there',
            service_type: booking.service_type,
            service_date: booking.service_date,
            time_window: booking.time_slot || 'TBD',
            manage_link: manageLink
          },
          customer_id: booking.customer_id,
          booking_id: booking.id,
          priority: 1,
          metadata: { source: 'booking_webhook_handler' }
        });
      
      console.log('SMS notification queued successfully');
    }
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }
}

async function sendPaymentSuccessEmail(bookingId: string) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        service_type,
        service_date,
        est_price,
        receipt_url,
        customers!inner(first_name, email, referral_code, referral_link)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) return;
    
    await supabase.functions.invoke('send-email-system', {
      body: {
        template: 'payment_succeeded',
        to: booking.customers.email,
        data: {
          first_name: booking.customers.first_name,
          amount: booking.est_price,
          service_type: booking.service_type,
          service_date: booking.service_date,
          receipt_link: booking.receipt_url || '#',
          referral_code: booking.customers.referral_code || '',
          referral_link: booking.customers.referral_link || ''
        },
        category: 'transactional',
        event_id: `payment_succeeded_${bookingId}`
      }
    });
  } catch (error) {
    console.error('Failed to send payment success email:', error);
  }
}

function getCookieValue(name: string): string | null {
  // This would be implemented to read cookies from the request
  // For now, returning null as we'll handle this in the frontend
  return null;
}

serve(handler);