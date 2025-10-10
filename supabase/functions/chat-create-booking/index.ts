import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatBookingRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state: string;
  zipCode: string;
  serviceType: string;
  homeSizeId?: string;
  sqft?: number;
  frequency: string;
  preferredDate: string;
  preferredTime?: string;
  specialInstructions?: string;
}

// Pricing calculation (same as in chat-booking-assistant)
const HOME_SIZE_RANGES = [
  { id: '1000_1500', minSqft: 1000, maxSqft: 1500, regularClean: 140, deepClean: 250, moveInOut: 265 },
  { id: '1501_2000', minSqft: 1501, maxSqft: 2000, regularClean: 175, deepClean: 315, moveInOut: 332 },
  { id: '2001_2500', minSqft: 2001, maxSqft: 2500, regularClean: 206, deepClean: 370, moveInOut: 390 },
  { id: '2501_3000', minSqft: 2501, maxSqft: 3000, regularClean: 237, deepClean: 426, moveInOut: 449 },
  { id: '3001_3500', minSqft: 3001, maxSqft: 3500, regularClean: 268, deepClean: 482, moveInOut: 507 },
  { id: '3501_4000', minSqft: 3501, maxSqft: 4000, regularClean: 299, deepClean: 537, moveInOut: 566 },
  { id: '4001_4500', minSqft: 4001, maxSqft: 4500, regularClean: 330, deepClean: 593, moveInOut: 624 },
  { id: '4501_5000', minSqft: 4501, maxSqft: 5000, regularClean: 361, deepClean: 649, moveInOut: 683 },
  { id: '5000_plus', minSqft: 5001, maxSqft: 999999, regularClean: 0, deepClean: 0, moveInOut: 0 }
];

function calculatePrice(homeSizeId: string, serviceType: string, frequency: string, stateCode: string): number {
  const homeSize = HOME_SIZE_RANGES.find(r => r.id === homeSizeId);
  if (!homeSize || homeSize.id === '5000_plus') return 0;

  let basePrice = 0;
  if (serviceType === 'regular') basePrice = homeSize.regularClean;
  else if (serviceType === 'deep') basePrice = homeSize.deepClean;
  else if (serviceType === 'move_in_out') basePrice = homeSize.moveInOut;

  const stateMultipliers: Record<string, number> = { TX: 1.0, CA: 1.5, NY: 1.3 };
  basePrice *= (stateMultipliers[stateCode] || 1.0);

  if (frequency !== 'one_time' && serviceType === 'regular') {
    const discounts: Record<string, number> = { weekly: 0.15, bi_weekly: 0.10, monthly: 0.05 };
    basePrice *= (1 - (discounts[frequency] || 0));
  }

  return Math.round(basePrice);
}

function calculateMRR(price: number, frequency: string): number {
  if (frequency === 'weekly') return price * 4;
  if (frequency === 'bi_weekly') return price * 2;
  if (frequency === 'monthly') return price;
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: ChatBookingRequest = await req.json();
    
    console.log('Creating booking from chat:', bookingData);

    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'phone', 'zipCode', 'serviceType', 'frequency', 'preferredDate'];
    for (const field of required) {
      if (!bookingData[field as keyof ChatBookingRequest]) {
        return new Response(JSON.stringify({
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Determine home size ID
    let homeSizeId = bookingData.homeSizeId;
    if (!homeSizeId && bookingData.sqft) {
      const homeSize = HOME_SIZE_RANGES.find(r => 
        bookingData.sqft! >= r.minSqft && bookingData.sqft! <= r.maxSqft
      );
      homeSizeId = homeSize?.id;
    }

    if (!homeSizeId) {
      return new Response(JSON.stringify({
        error: 'Unable to determine home size. Please provide homeSizeId or square footage.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate pricing
    const estPrice = calculatePrice(homeSizeId, bookingData.serviceType, bookingData.frequency, bookingData.state);
    
    if (estPrice === 0) {
      return new Response(JSON.stringify({
        error: 'Unable to calculate pricing. Please contact us for custom quote.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mrr = calculateMRR(estPrice, bookingData.frequency);
    const arr = mrr * 12;

    // Check if customer exists
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', bookingData.email)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      // Update customer info
      await supabase
        .from('customers')
        .update({
          name: `${bookingData.firstName} ${bookingData.lastName}`,
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          phone: bookingData.phone,
          address: bookingData.address,
          city: bookingData.city || '',
          state: bookingData.state,
          postal_code: bookingData.zipCode
        })
        .eq('id', customerId);
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: `${bookingData.firstName} ${bookingData.lastName}`,
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          address: bookingData.address,
          city: bookingData.city || '',
          state: bookingData.state,
          postal_code: bookingData.zipCode
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return new Response(JSON.stringify({
          error: 'Failed to create customer record'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      customerId = newCustomer.id;
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        service_type: bookingData.serviceType,
        sqft_or_bedrooms: homeSizeId,
        frequency: bookingData.frequency,
        est_price: estPrice,
        mrr: mrr > 0 ? mrr : null,
        arr: arr > 0 ? arr : null,
        service_date: bookingData.preferredDate,
        time_slot: bookingData.preferredTime || 'Not specified',
        zip_code: bookingData.zipCode,
        special_instructions: bookingData.specialInstructions || '',
        status: 'pending',
        source_channel: 'AI_CHAT',
        first_booking: true
      })
      .select('id')
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(JSON.stringify({
        error: 'Failed to create booking'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Booking created successfully:', booking.id);

    // Return success with booking details
    return new Response(JSON.stringify({
      success: true,
      bookingId: booking.id,
      message: `Your booking has been created! We've sent a confirmation email to ${bookingData.email}. Please complete payment to confirm your ${bookingData.frequency === 'one_time' ? 'one-time' : 'recurring'} service.`,
      booking: {
        id: booking.id,
        price: estPrice,
        serviceDate: bookingData.preferredDate,
        serviceType: bookingData.serviceType,
        frequency: bookingData.frequency
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat booking creation error:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
