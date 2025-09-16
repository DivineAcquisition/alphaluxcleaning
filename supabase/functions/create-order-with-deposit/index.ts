import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Create order record
    const orderData = {
      id: orderId,
      customer_id: customerData.id,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.bookingData.contactNumber,
      amount: Math.round(request.totalAmount * 100), // Convert to cents
      cleaning_type: request.bookingData.serviceType === 'regular' ? 'regular_clean' : 
                   request.bookingData.serviceType === 'deep' ? 'deep_clean' : 'move_out_clean',
      frequency: request.bookingData.frequency || 'one_time',
      square_footage: parseInt(request.bookingData.homeSize.split('-')[1]) || 2000,
      service_details: {
        serviceAddress: request.bookingData.address,
        property: {
          dwellingType: request.bookingData.dwellingType,
          bedrooms: request.bookingData.bedrooms,
          bathrooms: request.bookingData.bathrooms,
          primaryFlooringType: request.bookingData.flooringType,
        },
        instructions: {
          special: request.bookingData.specialInstructions,
        },
        pricing: {
          basePrice: request.bookingData.basePrice,
          totalPrice: request.totalAmount,
          depositAmount: request.depositAmount,
          remainingBalance: remainingBalance
        }
      },
      add_ons: request.bookingData.addOns || [],
      scheduled_date: request.bookingData.serviceDate,
      scheduled_time: request.bookingData.serviceTime,
      stripe_payment_intent_id: request.paymentIntentId,
      payment_status: 'deposit_paid',
      status: 'confirmed',
      deposit_amount: Math.round(request.depositAmount * 100), // Convert to cents
      balance_due: Math.round(remainingBalance * 100), // Convert to cents
      booking_source: 'website',
      created_at: new Date().toISOString(),
    };

    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order record');
    }

    console.log('Order created successfully:', {
      orderId: orderResult.id,
      status: orderResult.status,
      paymentStatus: orderResult.payment_status,
      depositAmount: orderResult.deposit_amount,
      balanceDue: orderResult.balance_due
    });

    // Send booking confirmation email
    try {
      await supabase.functions.invoke('send-order-confirmation', {
        body: {
          customerEmail: request.customerEmail,
          customerName: request.customerName,
          serviceDate: request.bookingData.serviceDate,
          serviceTime: request.bookingData.serviceTime,
          totalAmount: request.totalAmount,
          depositAmount: request.depositAmount,
          remainingBalance: remainingBalance,
          orderId: orderId,
          serviceType: request.bookingData.serviceType
        }
      });
      console.log('Booking confirmation email sent');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: orderResult.id,
      order: orderResult,
      message: 'Order created successfully with deposit payment'
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