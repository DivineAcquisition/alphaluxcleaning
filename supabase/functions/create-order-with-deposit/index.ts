import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderCreationRequest {
  bookingData: any;
  paymentIntentId: string;
  depositAmount: number;
  totalAmount: number;
  customerEmail: string;
  customerName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: OrderCreationRequest = await req.json();
    console.log('Creating order with deposit payment:', {
      paymentIntentId: request.paymentIntentId,
      depositAmount: request.depositAmount,
      totalAmount: request.totalAmount,
      customerEmail: request.customerEmail
    });

    // Generate unique order ID
    const orderId = crypto.randomUUID();
    
    // Calculate remaining balance
    const remainingBalance = request.totalAmount - request.depositAmount;

    // Create customer record first
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .upsert({
        name: request.customerName,
        email: request.customerEmail,
        phone: request.bookingData.contactNumber,
        address: `${request.bookingData.address.street}, ${request.bookingData.address.city}, ${request.bookingData.address.state} ${request.bookingData.address.zipCode}`,
        address_line1: request.bookingData.address.street,
        city: request.bookingData.address.city,
        state: request.bookingData.address.state,
        postal_code: request.bookingData.address.zipCode,
        first_name: request.customerName.split(' ')[0] || request.customerName,
        last_name: request.customerName.split(' ').slice(1).join(' ') || '',
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      throw new Error('Failed to create customer record');
    }

    // Create booking record using the correct table
    const bookingData = {
      id: orderId,
      customer_id: customerData.id,
      est_price: Math.round(request.totalAmount * 100), // Convert to cents
      service_type: request.bookingData.serviceType === 'regular' ? 'regular' :
                   request.bookingData.serviceType === 'deep' ? 'deep' : 'moveout',
      frequency: request.bookingData.frequency || 'oneTime',
      sqft_or_bedrooms: request.bookingData.homeSize,
      service_date: request.bookingData.serviceDate,
      time_slot: request.bookingData.serviceTime,
      zip_code: request.bookingData.zipCode || request.bookingData.address?.zipCode,
      stripe_payment_intent_id: request.paymentIntentId,
      status: 'confirmed',
      deposit_amount: Math.round(request.depositAmount * 100), // Convert to cents
      balance_due: Math.round(remainingBalance * 100), // Convert to cents
      special_instructions: request.bookingData.specialInstructions,
      addons: request.bookingData.addOns || [],
      property_details: {
        dwellingType: request.bookingData.dwellingType,
        bedrooms: request.bookingData.bedrooms,
        bathrooms: request.bookingData.bathrooms,
        flooringType: request.bookingData.flooringType,
        address: request.bookingData.address
      },
      pricing_breakdown: {
        basePrice: request.bookingData.basePrice,
        totalPrice: request.totalAmount,
        depositAmount: request.depositAmount,
        remainingBalance: remainingBalance,
        addOns: request.bookingData.addOns || []
      }
    };

    const { data: bookingResult, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error('Failed to create booking record');
    }

    // Create payment record
    const paymentData = {
      booking_id: bookingResult.id,
      stripe_payment_id: request.paymentIntentId,
      amount: Math.round(request.totalAmount * 100), // Convert to cents
      deposit_amount: Math.round(request.depositAmount * 100), // Convert to cents
      balance_due: Math.round(remainingBalance * 100), // Convert to cents
      status: 'completed',
      charge_type: 'deposit'
    };

    const { data: paymentResult, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the booking creation if payment record fails
    }

    console.log('Booking created successfully:', {
      bookingId: bookingResult.id,
      status: bookingResult.status,
      depositAmount: bookingResult.deposit_amount,
      balanceDue: bookingResult.balance_due,
      paymentRecorded: !!paymentResult
    });

    // Trigger external webhooks (non-blocking)
    try {
      console.log('Triggering external webhooks for booking:', bookingResult.id);
      
      const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
        body: {
          order_id: bookingResult.id,
          trigger_event: 'booking_confirmed',
          source: 'create_order_with_deposit',
          booking_data: request.bookingData,
          customer_data: customerData,
          payment_data: paymentResult
        }
      });

      if (webhookError) {
        console.error('Webhook delivery failed:', webhookError);
      } else {
        console.log('External webhooks triggered successfully:', webhookResult);
      }
    } catch (webhookError) {
      console.error('Error triggering webhooks:', webhookError);
      // Don't fail the booking creation if webhooks fail
    }

    // Send booking confirmation email using the email system
    try {
      console.log('Queuing booking confirmation email...');
      
      // Insert email job into the email_jobs table
      const { error: emailJobError } = await supabase
        .from('email_jobs')
        .insert({
          to_email: request.customerEmail,
          to_name: request.customerName,
          template_name: 'booking_confirmed',
          category: 'transactional',
          status: 'queued',
          payload: {
            customer_name: request.customerName,
            booking_id: bookingResult.id,
            service_type: request.bookingData.serviceType,
            service_date: request.bookingData.serviceDate,
            service_time: request.bookingData.serviceTime,
            total_amount: request.totalAmount,
            deposit_amount: request.depositAmount,
            remaining_balance: remainingBalance,
            order_id: orderId,
            service_address: `${request.bookingData.address.street}, ${request.bookingData.address.city}, ${request.bookingData.address.state} ${request.bookingData.address.zipCode}`,
            manage_booking_link: `https://app.alphaluxclean.com/manage/${bookingResult.manage_token || bookingResult.id}`,
            view_receipt_link: `https://app.alphaluxclean.com/receipt/${bookingResult.id}`
          }
        });

      if (emailJobError) {
        console.error('Error queuing email job:', emailJobError);
        
        // Fallback to direct email system call
        await supabase.functions.invoke('send-email-system', {
          body: {
            template: 'booking-confirmed',
            to_email: request.customerEmail,
            to_name: request.customerName,
            template_data: {
              customer_name: request.customerName,
              booking_id: bookingResult.id,
              service_type: request.bookingData.serviceType,
              service_date: request.bookingData.serviceDate,
              service_time: request.bookingData.serviceTime,
              total_amount: request.totalAmount,
              deposit_amount: request.depositAmount,
              remaining_balance: remainingBalance
            }
          }
        });
      } else {
        console.log('Email job queued successfully');
      }
    } catch (emailError) {
      console.error('Error with email system:', emailError);
      // Don't fail the order creation if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: bookingResult.id, // Frontend expects orderId
      bookingId: bookingResult.id,
      booking: bookingResult,
      payment: paymentResult,
      message: 'Booking created successfully with deposit payment'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in create-order-with-deposit:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});