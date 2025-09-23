import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ReferralRequest {
  action: 'issue' | 'attribute' | 'reward' | 'redeem';
  customer_id?: string;
  booking_id?: string;
  ref_code?: string;
  utms?: Record<string, any>;
  attribution_method?: 'COOKIE' | 'LAST_CLICK' | 'MANUAL';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, customer_id, booking_id, ref_code, utms, attribution_method }: ReferralRequest = await req.json();

    switch (action) {
      case 'issue':
        if (!customer_id) {
          throw new Error('customer_id required for issue action');
        }
        return await issueReferralCode(customer_id);

      case 'attribute':
        if (!booking_id || !ref_code) {
          throw new Error('booking_id and ref_code required for attribute action');
        }
        return await attributeReferral(booking_id, ref_code, utms || {}, attribution_method || 'COOKIE');

      case 'reward':
        if (!booking_id) {
          throw new Error('booking_id required for reward action');
        }
        return await issueReferralRewards(booking_id);

      case 'redeem':
        if (!customer_id) {
          throw new Error('customer_id required for redeem action');
        }
        return await redeemReferralCredits(customer_id);

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error("Error in referral-system:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function issueReferralCode(customerId: string) {
  const { data, error } = await supabase.rpc('issue_referral_code', {
    input_customer_id: customerId
  });

  if (error) {
    throw new Error(`Failed to issue referral code: ${error.message}`);
  }

  // Queue referral invite email
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, email, referral_code, referral_link')
      .eq('id', customerId)
      .single();

    if (customer && customer.referral_code) {
      await supabase.functions.invoke('send-email-system', {
        body: {
          template: 'referral_invite',
          to: customer.email,
          data: {
            first_name: customer.first_name,
            referral_code: customer.referral_code,
            referral_link: customer.referral_link
          },
          category: 'marketing',
          event_id: `referral_invite_${customerId}`
        }
      });
    }
  } catch (emailError) {
    console.error('Failed to send referral invite email:', emailError);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    referral_code: data,
    message: 'Referral code issued and email sent'
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function attributeReferral(bookingId: string, refCode: string, utms: any, attributionMethod: string) {
  // Check for fraud controls
  const fraudCheck = await performFraudChecks(bookingId, refCode);
  if (!fraudCheck.allowed) {
    throw new Error(`Referral blocked: ${fraudCheck.reason}`);
  }

  const { data, error } = await supabase.rpc('attribute_referral', {
    input_booking_id: bookingId,
    input_ref_code: refCode,
    input_utms: utms,
    input_attribution_method: attributionMethod
  });

  if (error) {
    throw new Error(`Failed to attribute referral: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    referral_id: data,
    message: 'Referral attributed successfully'
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function issueReferralRewards(bookingId: string) {
  // Check if booking has been paid
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, referrer_customer_id, status')
    .eq('id', bookingId)
    .single();

  if (!booking || booking.status !== 'confirmed') {
    throw new Error('Booking must be confirmed to issue rewards');
  }

  if (!booking.referrer_customer_id) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No referral to reward'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { error } = await supabase.rpc('issue_referral_rewards', {
    input_booking_id: bookingId
  });

  if (error) {
    throw new Error(`Failed to issue rewards: ${error.message}`);
  }

  // Send reward notification emails
  try {
    await sendRewardEmails(booking.customer_id, booking.referrer_customer_id);
  } catch (emailError) {
    console.error('Failed to send reward emails:', emailError);
  }

  // Chain reaction: Issue referral code to the new customer if they don't have one
  try {
    await supabase.functions.invoke('referral-system', {
      body: {
        action: 'issue',
        customer_id: booking.customer_id
      }
    });
  } catch (chainError) {
    console.error('Failed to issue chain reaction referral:', chainError);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Referral rewards issued and emails sent'
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function redeemReferralCredits(customerId: string) {
  // Get available credits
  const { data: credits } = await supabase
    .from('referral_rewards')
    .select('id, amount_cents')
    .eq('customer_id', customerId)
    .eq('status', 'EARNED');

  if (!credits || credits.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      credits_applied: 0,
      message: 'No credits available to redeem'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount_cents, 0);

  // Mark credits as applied
  const creditIds = credits.map(c => c.id);
  await supabase
    .from('referral_rewards')
    .update({ 
      status: 'APPLIED', 
      redeemed_at: new Date().toISOString() 
    })
    .in('id', creditIds);

  return new Response(JSON.stringify({ 
    success: true, 
    credits_applied: totalCredits,
    credits_dollar: (totalCredits / 100).toFixed(2),
    message: `$${(totalCredits / 100).toFixed(2)} in credits applied`
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function performFraudChecks(bookingId: string, refCode: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, 
      customer_id,
      customers!inner(email, address_line1)
    `)
    .eq('id', bookingId)
    .single();

  const { data: referrer } = await supabase
    .from('customers')
    .select('id, email, address_line1')
    .eq('referral_code', refCode)
    .single();

  if (!booking || !referrer) {
    return { allowed: false, reason: 'Invalid booking or referral code' };
  }

  // Check self-referral
  if (booking.customer_id === referrer.id) {
    return { allowed: false, reason: 'Self-referrals not allowed' };
  }

  // Check same email domain (basic fraud check)
  const customerDomain = booking.customers.email.split('@')[1];
  const referrerDomain = referrer.email.split('@')[1];
  
  if (customerDomain === referrerDomain && customerDomain !== 'gmail.com' && customerDomain !== 'yahoo.com' && customerDomain !== 'outlook.com') {
    return { allowed: false, reason: 'Same domain referrals require manual review' };
  }

  // Check same address (basic household check)
  if (booking.customers.address_line1 && referrer.address_line1 &&
      booking.customers.address_line1.toLowerCase() === referrer.address_line1.toLowerCase()) {
    return { allowed: false, reason: 'Same address referrals require manual review' };
  }

  return { allowed: true };
}

async function sendRewardEmails(referredCustomerId: string, referrerCustomerId: string) {
  // Get customer details
  const { data: customers } = await supabase
    .from('customers')
    .select('id, first_name, email')
    .in('id', [referredCustomerId, referrerCustomerId]);

  if (!customers || customers.length !== 2) {
    throw new Error('Could not find customer details for reward emails');
  }

  const referredCustomer = customers.find(c => c.id === referredCustomerId);
  const referrerCustomer = customers.find(c => c.id === referrerCustomerId);

  // Send email to referrer
  await supabase.functions.invoke('send-email-system', {
    body: {
      template: 'referral_reward_earned',
      to: referrerCustomer?.email,
      data: {
        first_name: referrerCustomer?.first_name,
        amount: '$25.00',
        referred_name: referredCustomer?.first_name
      },
      category: 'transactional'
    }
  });

  // Send email to referred customer
  await supabase.functions.invoke('send-email-system', {
    body: {
      template: 'referral_welcome_credit',
      to: referredCustomer?.email,
      data: {
        first_name: referredCustomer?.first_name,
        amount: '$25.00',
        referrer_name: referrerCustomer?.first_name
      },
      category: 'transactional'
    }
  });
}

serve(handler);