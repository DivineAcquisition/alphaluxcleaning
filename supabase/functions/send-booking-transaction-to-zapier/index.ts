import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingTransactionData {
  // Order Information
  order: {
    id: string;
    stripe_session_id: string;
    amount: number;
    currency: string;
    status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    cleaning_type: string;
    frequency: string;
    square_footage: number;
    service_details: any;
    scheduled_date: string;
    scheduled_time: string;
    created_at: string;
  };
  
  // Booking Information
  booking?: {
    id: string;
    service_date: string;
    service_time: string;
    service_address: string;
    status: string;
    priority: string;
    estimated_duration: number;
    special_instructions: string;
  };
  
  // Payment Information
  payment: {
    amount_paid: number;
    payment_method: string;
    transaction_id: string;
    payment_status: string;
    processing_fee?: number;
  };
  
  // Service Details
  service: {
    service_type: string;
    frequency: string;
    estimated_duration: string;
    special_requirements: string[];
    access_instructions: string;
    pets_present: boolean;
    alarm_code?: string;
    parking_instructions: string;
  };
  
  // Address Information
  address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    dwelling_type: string;
    flooring_types: string[];
  };
  
  // Business Intelligence
  analytics: {
    booking_source: string;
    referral_code?: string;
    marketing_channel: string;
    customer_ltv_estimate: number;
    booking_completion_time: string;
    device_type: string;
  };
  
  // Timestamps
  timestamps: {
    order_created: string;
    payment_completed: string;
    booking_scheduled: string;
    webhook_sent: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, send_sample_data = false } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let transactionData: BookingTransactionData;

    if (send_sample_data) {
      // Send comprehensive sample data
      transactionData = {
        order: {
          id: "sample-order-123",
          stripe_session_id: "cs_test_sample123",
          amount: 15999, // $159.99
          currency: "usd",
          status: "paid",
          customer_name: "Sarah Johnson",
          customer_email: "sarah.johnson@email.com",
          customer_phone: "(555) 234-5678",
          cleaning_type: "deep_clean",
          frequency: "one_time",
          square_footage: 2500,
          service_details: {
            bedrooms: 3,
            bathrooms: 2,
            kitchen: true,
            living_areas: 2
          },
          scheduled_date: "2025-08-03",
          scheduled_time: "10:00 AM",
          created_at: new Date().toISOString()
        },
        booking: {
          id: "booking-sample-456",
          service_date: "2025-08-03",
          service_time: "10:00 AM",
          service_address: "123 Oak Street, San Francisco, CA 94102",
          status: "scheduled",
          priority: "normal",
          estimated_duration: 180, // 3 hours
          special_instructions: "Please use eco-friendly products only"
        },
        payment: {
          amount_paid: 15999,
          payment_method: "credit_card",
          transaction_id: "pi_sample_transaction_123",
          payment_status: "succeeded",
          processing_fee: 479 // 3% processing fee
        },
        service: {
          service_type: "Deep Cleaning",
          frequency: "One-time",
          estimated_duration: "3-4 hours",
          special_requirements: ["eco_friendly_products", "pet_safe_cleaning"],
          access_instructions: "Key under front door mat",
          pets_present: true,
          alarm_code: "1234",
          parking_instructions: "Driveway available, no street parking restrictions"
        },
        address: {
          street: "123 Oak Street",
          apartment: "Apt 2B",
          city: "San Francisco",
          state: "CA",
          zip_code: "94102",
          dwelling_type: "apartment",
          flooring_types: ["hardwood", "tile", "carpet"]
        },
        analytics: {
          booking_source: "website",
          referral_code: "FRIEND20",
          marketing_channel: "google_ads",
          customer_ltv_estimate: 850.00,
          booking_completion_time: "00:04:32",
          device_type: "desktop"
        },
        timestamps: {
          order_created: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          payment_completed: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
          booking_scheduled: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          webhook_sent: new Date().toISOString()
        }
      };
    } else {
      if (!session_id) {
        throw new Error('Session ID is required when not sending sample data');
      }

      // Fetch real data from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', session_id)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Fetch related booking if exists
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('order_id', order.id)
        .single();

      // Build transaction data from real order
      const serviceDetails = order.service_details || {};
      const address = serviceDetails.serviceAddress || serviceDetails.address || {};
      const instructions = serviceDetails.instructions || {};
      const property = serviceDetails.property || {};

      transactionData = {
        order: {
          id: order.id,
          stripe_session_id: order.stripe_session_id,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          cleaning_type: order.cleaning_type,
          frequency: order.frequency,
          square_footage: order.square_footage,
          service_details: serviceDetails,
          scheduled_date: order.scheduled_date,
          scheduled_time: order.scheduled_time,
          created_at: order.created_at
        },
        booking: booking ? {
          id: booking.id,
          service_date: booking.service_date,
          service_time: booking.service_time,
          service_address: booking.service_address,
          status: booking.status,
          priority: booking.priority,
          estimated_duration: booking.estimated_duration,
          special_instructions: booking.special_instructions
        } : undefined,
        payment: {
          amount_paid: order.amount,
          payment_method: "stripe",
          transaction_id: order.stripe_session_id,
          payment_status: order.status
        },
        service: {
          service_type: order.cleaning_type || "Standard Cleaning",
          frequency: order.frequency || "one_time",
          estimated_duration: "2-3 hours",
          special_requirements: order.add_ons || [],
          access_instructions: instructions.access || "",
          pets_present: instructions.pets || false,
          alarm_code: instructions.alarmCode || "",
          parking_instructions: instructions.parking || ""
        },
        address: {
          street: address.street || "",
          apartment: address.apartment || "",
          city: address.city || "",
          state: address.state || "",
          zip_code: address.zipCode || "",
          dwelling_type: property.dwellingType || "",
          flooring_types: property.flooringTypes || []
        },
        analytics: {
          booking_source: serviceDetails.source || "website",
          marketing_channel: "direct",
          customer_ltv_estimate: order.amount / 100 * 5, // Estimate 5x first order
          booking_completion_time: "unknown",
          device_type: "unknown"
        },
        timestamps: {
          order_created: order.created_at,
          payment_completed: order.created_at,
          booking_scheduled: order.scheduled_date ? new Date().toISOString() : "",
          webhook_sent: new Date().toISOString()
        }
      };
    }

    // Send to Zapier webhook
    const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/u4d3bsb/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'customer_data_collection',
        'BACP Data': transactionData,
        metadata: {
          webhook_version: '1.0',
          sent_at: new Date().toISOString(),
          environment: 'production'
        }
      }),
    });

    console.log('Zapier webhook response status:', zapierResponse.status);
    console.log('Transaction data sent:', JSON.stringify(transactionData, null, 2));

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed with status: ${zapierResponse.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Booking transaction sent to Zapier successfully',
      transaction_id: transactionData.order.id,
      webhook_status: zapierResponse.status,
      data_sent: transactionData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending booking transaction to Zapier:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});