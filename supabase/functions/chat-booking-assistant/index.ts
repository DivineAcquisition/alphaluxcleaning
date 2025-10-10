import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, bookingContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    let contextPrompt = `You are Alpha Lux Clean's friendly booking assistant. You help customers with:

**Services Offered:**
- Standard Clean: Regular maintenance cleaning
- Deep Clean: Intensive cleaning (40% more thorough)
- Move-In/Out: Complete property cleaning for moving

**Service Areas:**
- Texas (TX)
- California (CA)
- New York (NY)

**Pricing Info:**
- Based on home size (square footage or bedrooms)
- Frequency discounts: Weekly (15% off), Bi-Weekly (10% off), Monthly (5% off)
- State multipliers apply (CA 1.5x, TX 1.43x)

**Your Role:**
- Answer questions clearly and concisely
- Help users understand their options
- Guide them through the booking process
- Encourage booking completion
- Be friendly, professional, and helpful

Keep responses under 3-4 sentences unless detailed explanation is needed.`;

    // Add current booking context if provided
    if (bookingContext) {
      contextPrompt += `\n\n**Current Booking Context:**`;
      if (bookingContext.currentStep) contextPrompt += `\n- Step: ${bookingContext.currentStep}`;
      if (bookingContext.stateCode) contextPrompt += `\n- State: ${bookingContext.stateCode}`;
      if (bookingContext.serviceType) contextPrompt += `\n- Service Type: ${bookingContext.serviceType}`;
      if (bookingContext.homeSize) contextPrompt += `\n- Home Size: ${bookingContext.homeSize}`;
      if (bookingContext.frequency) contextPrompt += `\n- Frequency: ${bookingContext.frequency}`;
      if (bookingContext.estimatedPrice) contextPrompt += `\n- Current Price: $${bookingContext.estimatedPrice}`;
    }

    console.log('Chat request:', { messageCount: messages.length, hasContext: !!bookingContext });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: contextPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'rate_limit',
          message: 'Our assistant is busy right now. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'payment_required',
          message: 'Service temporarily unavailable. Please try again later.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'ai_error',
        message: 'Unable to reach assistant. Please try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
