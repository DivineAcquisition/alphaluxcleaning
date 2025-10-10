import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pricing data structure
const HOME_SIZE_RANGES = [
  { id: '1000_1500', label: '1,000-1,500 sq ft (1-2 BR)', minSqft: 1000, maxSqft: 1500, regularClean: 140, deepClean: 250, moveInOut: 265 },
  { id: '1501_2000', label: '1,501-2,000 sq ft (2-3 BR)', minSqft: 1501, maxSqft: 2000, regularClean: 175, deepClean: 315, moveInOut: 332 },
  { id: '2001_2500', label: '2,001-2,500 sq ft (3 BR)', minSqft: 2001, maxSqft: 2500, regularClean: 206, deepClean: 370, moveInOut: 390 },
  { id: '2501_3000', label: '2,501-3,000 sq ft (3-4 BR)', minSqft: 2501, maxSqft: 3000, regularClean: 237, deepClean: 426, moveInOut: 449 },
  { id: '3001_3500', label: '3,001-3,500 sq ft (4 BR)', minSqft: 3001, maxSqft: 3500, regularClean: 268, deepClean: 482, moveInOut: 507 },
  { id: '3501_4000', label: '3,501-4,000 sq ft (4-5 BR)', minSqft: 3501, maxSqft: 4000, regularClean: 299, deepClean: 537, moveInOut: 566 },
  { id: '4001_4500', label: '4,001-4,500 sq ft (5 BR)', minSqft: 4001, maxSqft: 4500, regularClean: 330, deepClean: 593, moveInOut: 624 },
  { id: '4501_5000', label: '4,501-5,000 sq ft (5+ BR)', minSqft: 4501, maxSqft: 5000, regularClean: 361, deepClean: 649, moveInOut: 683 },
  { id: '5000_plus', label: '5,000+ sq ft', minSqft: 5001, maxSqft: 999999, regularClean: 0, deepClean: 0, moveInOut: 0 }
];

const FREQUENCY_DISCOUNTS = {
  weekly: 0.15,
  bi_weekly: 0.10,
  monthly: 0.05,
  one_time: 0
};

// Helper: Calculate pricing dynamically
function calculateChatPricing(params: {
  sqft?: number;
  homeSizeId?: string;
  serviceType: string;
  frequency: string;
  stateCode: string;
}): string {
  try {
    // Map service type from natural language
    const serviceMap: Record<string, string> = {
      'regular': 'regular',
      'standard': 'regular',
      'regular clean': 'regular',
      'standard clean': 'regular',
      'deep': 'deep',
      'deep clean': 'deep',
      'move in': 'move_in_out',
      'move out': 'move_in_out',
      'move-in/out': 'move_in_out',
      'move in out': 'move_in_out'
    };
    
    const mappedService = serviceMap[serviceType.toLowerCase()] || 'regular';
    
    // Map frequency
    const freqMap: Record<string, string> = {
      'one time': 'one_time',
      'onetime': 'one_time',
      'one-time': 'one_time',
      'weekly': 'weekly',
      'bi weekly': 'bi_weekly',
      'biweekly': 'bi_weekly',
      'bi-weekly': 'bi_weekly',
      'monthly': 'monthly'
    };
    
    const mappedFreq = freqMap[frequency.toLowerCase()] || 'one_time';
    
    // Determine home size
    let homeSize = null;
    if (params.homeSizeId) {
      homeSize = HOME_SIZE_RANGES.find(r => r.id === params.homeSizeId);
    } else if (params.sqft) {
      homeSize = HOME_SIZE_RANGES.find(r => 
        params.sqft! >= r.minSqft && params.sqft! <= r.maxSqft
      );
    }
    
    if (!homeSize) return 'Unable to calculate pricing - need valid home size or square footage';
    
    // Check for custom quote (5000+)
    if (homeSize.id === '5000_plus') {
      return 'For homes 5,000+ sq ft, we provide custom quotes. Please call us at (555) 123-4567 or email hello@alphaluxclean.com';
    }
    
    // Get base price
    let basePrice = 0;
    if (mappedService === 'regular') basePrice = homeSize.regularClean;
    else if (mappedService === 'deep') basePrice = homeSize.deepClean;
    else if (mappedService === 'move_in_out') basePrice = homeSize.moveInOut;
    
    // State multipliers
    const stateMultipliers: Record<string, number> = {
      'TX': 1.0,
      'CA': 1.5,
      'NY': 1.3
    };
    
    const stateMultiplier = stateMultipliers[params.stateCode] || 1.0;
    basePrice = basePrice * stateMultiplier;
    
    // Apply frequency discount for recurring services
    if (mappedFreq !== 'one_time') {
      if (mappedService === 'deep' || mappedService === 'move_in_out') {
        return `${mappedService === 'deep' ? 'Deep Clean' : 'Move-In/Out'} service is only available as a one-time service. The price is $${Math.round(basePrice)}.`;
      }
      
      const discount = FREQUENCY_DISCOUNTS[mappedFreq as keyof typeof FREQUENCY_DISCOUNTS];
      const discountedPrice = basePrice * (1 - discount);
      
      // Calculate per-clean and monthly pricing
      const cleansPerMonth = mappedFreq === 'weekly' ? 4 : mappedFreq === 'bi_weekly' ? 2 : 1;
      const perClean = discountedPrice;
      const monthlyTotal = perClean * cleansPerMonth;
      const savings = (basePrice - discountedPrice).toFixed(0);
      
      return `$${Math.round(perClean)}/clean ($${Math.round(monthlyTotal)}/month for ${cleansPerMonth} cleans). You save $${savings} per clean (${Math.round(discount * 100)}% discount)!`;
    } else {
      return `$${Math.round(basePrice)} for one-time service`;
    }
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return 'Unable to calculate pricing at this time.';
  }
}

// Helper: Check service availability
async function checkAvailability(zipCode: string): Promise<string> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('service_areas')
    .select('*')
    .eq('zip_code', zipCode)
    .eq('active', true)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking availability:', error);
    return 'Unable to check availability at this time.';
  }
  
  if (data) {
    return `Yes! We service ${data.city}, ${data.state} (${zipCode}).`;
  } else {
    return `Unfortunately, we don't currently service ZIP code ${zipCode}. We serve areas in Texas (Houston, Austin, Dallas, San Antonio), California (Los Angeles, San Diego), and New York (NYC, Brooklyn). Please check if you're in one of our service areas!`;
  }
}

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

    // Build comprehensive system prompt with complete pricing data
    let contextPrompt = `You are Alpha Lux Clean's conversational booking assistant. 

**CRITICAL: Interactive Communication Style**

When asking questions or presenting options, use this EXACT format:

For questions with options (service type, home size, frequency):
INTERACTIVE:{"type":"options","question":"What type of cleaning do you need?","icon":"Sparkles","options":[{"id":"regular","label":"Regular Clean","description":"Weekly or bi-weekly service","badge":"Most Popular"},{"id":"deep","label":"Deep Clean","description":"Thorough detailed cleaning"},{"id":"move_in_out","label":"Move-In/Out","description":"Pre/post move cleaning"}]}

For input requests (name, email, phone, address):
INTERACTIVE:{"type":"input","question":"What's your email address?","inputType":"email","placeholder":"you@example.com","icon":"Mail"}

For date/time:
INTERACTIVE:{"type":"input","question":"When would you like your first cleaning?","inputType":"date","icon":"Calendar"}

For confirmations (before booking):
INTERACTIVE:{"type":"confirmation","question":"Does everything look correct?","confirmationData":{"Name":"John Doe","Email":"john@example.com","Service":"Regular Clean","Size":"2,001-2,500 sq ft","Frequency":"Weekly","Price":"$70/clean ($280/month)","Address":"123 Main St, Houston, TX 77002","Date":"Tuesday, Nov 12","Time":"9:00 AM"}}

For progress tracking:
INTERACTIVE:{"type":"progress","progress":{"current":3,"total":7}}

For plain text responses (pricing info, general answers):
Just respond normally without any special format.

**Conversation Flow (7 Steps):**
1. Ask service type (use options format)
2. Ask home size (use options format with sqft ranges)
3. Ask frequency (use options format)
4. Show pricing quote (plain text with breakdown)
5. Ask for contact info: name, email, phone (use input format one at a time)
6. Ask for address: street, city, zip (use input format)
7. Ask for preferred date/time (use input format)
8. Show confirmation (use confirmation format)
9. Create booking and provide next steps

**Home Size Options for Interactive Selection:**
Use these exact options when asking about home size:
[
  {"id":"1000-1500","label":"1,000-1,500 sq ft","description":"1-2 bedrooms"},
  {"id":"1501-2000","label":"1,501-2,000 sq ft","description":"2-3 bedrooms"},
  {"id":"2001-2500","label":"2,001-2,500 sq ft","description":"3-4 bedrooms"},
  {"id":"2501-3000","label":"2,501-3,000 sq ft","description":"4-5 bedrooms"},
  {"id":"3001-3500","label":"3,001-3,500 sq ft","description":"5+ bedrooms"},
  {"id":"3501-4000","label":"3,501-4,000 sq ft","description":"Large home"},
  {"id":"4001-4500","label":"4,001-4,500 sq ft","description":"Very large home"},
  {"id":"4501-5000","label":"4,501-5,000 sq ft","description":"Estate home"}
]

**Frequency Options:**
[
  {"id":"weekly","label":"Weekly","badge":"Save 15%","description":"52 cleans per year"},
  {"id":"bi_weekly","label":"Bi-Weekly","badge":"Save 10%","description":"26 cleans per year"},
  {"id":"monthly","label":"Monthly","badge":"Save 5%","description":"12 cleans per year"},
  {"id":"one_time","label":"One-Time","description":"Single cleaning"}
]

**COMPLETE PRICING TABLE:**

**1,000-1,500 sq ft (1-2 BR):**
- Regular Clean: $140 one-time
- Weekly: $47.60/clean ($190/month) - Save 15%!
- Bi-Weekly: $69.30/clean ($138/month) - Save 10%
- Monthly: $73.15/clean ($73/month) - Save 5%
- Deep Clean: $250 (one-time only)
- Move-In/Out: $265 (one-time only)

**1,501-2,000 sq ft (2-3 BR):**
- Regular Clean: $175 one-time
- Weekly: $59.50/clean ($238/month) - Save 15%!
- Bi-Weekly: $86.63/clean ($173/month) - Save 10%
- Monthly: $91.44/clean ($91/month) - Save 5%
- Deep Clean: $315 (one-time only)
- Move-In/Out: $332 (one-time only)

**2,001-2,500 sq ft (3 BR):**
- Regular Clean: $206 one-time
- Weekly: $70.04/clean ($280/month) - Save 15%!
- Bi-Weekly: $101.97/clean ($204/month) - Save 10%
- Monthly: $107.61/clean ($108/month) - Save 5%
- Deep Clean: $370 (one-time only)
- Move-In/Out: $390 (one-time only)

**2,501-3,000 sq ft (3-4 BR):**
- Regular Clean: $237 one-time
- Weekly: $80.58/clean ($322/month) - Save 15%!
- Bi-Weekly: $117.32/clean ($235/month) - Save 10%
- Monthly: $123.79/clean ($124/month) - Save 5%
- Deep Clean: $426 (one-time only)
- Move-In/Out: $449 (one-time only)

**3,001-3,500 sq ft (4 BR):**
- Regular Clean: $268 one-time
- Weekly: $91.12/clean ($364/month) - Save 15%!
- Bi-Weekly: $132.66/clean ($265/month) - Save 10%
- Monthly: $139.96/clean ($140/month) - Save 5%
- Deep Clean: $482 (one-time only)
- Move-In/Out: $507 (one-time only)

**3,501-4,000 sq ft (4-5 BR):**
- Regular Clean: $299 one-time
- Weekly: $101.66/clean ($407/month) - Save 15%!
- Bi-Weekly: $148.01/clean ($296/month) - Save 10%
- Monthly: $156.14/clean ($156/month) - Save 5%
- Deep Clean: $537 (one-time only)
- Move-In/Out: $566 (one-time only)

**4,001-4,500 sq ft (5 BR):**
- Regular Clean: $330 one-time
- Weekly: $112.20/clean ($449/month) - Save 15%!
- Bi-Weekly: $163.35/clean ($327/month) - Save 10%
- Monthly: $172.43/clean ($172/month) - Save 5%
- Deep Clean: $593 (one-time only)
- Move-In/Out: $624 (one-time only)

**4,501-5,000 sq ft (5+ BR):**
- Regular Clean: $361 one-time
- Weekly: $122.74/clean ($491/month) - Save 15%!
- Bi-Weekly: $178.70/clean ($357/month) - Save 10%
- Monthly: $188.43/clean ($188/month) - Save 5%
- Deep Clean: $649 (one-time only)
- Move-In/Out: $683 (one-time only)

**5,000+ sq ft:**
- Custom quotes - call (555) 123-4567

**STATE PRICING:**
- Texas (TX): Standard pricing (shown above)
- California (CA): 1.5x multiplier
- New York (NY): 1.3x multiplier

**SERVICE AREAS:**
- Texas: Houston (77xxx), Austin (78xxx), Dallas (75xxx, 76xxx), San Antonio (78xxx)
- California: Los Angeles (90xxx, 91xxx), San Diego (92xxx)
- New York: NYC (10xxx, 11xxx), Brooklyn (112xx)

**SERVICES OFFERED:**
1. **Regular Clean** - Standard maintenance cleaning (recurring or one-time)
2. **Deep Clean** - 40% more intensive, ONE-TIME ONLY
3. **Move-In/Out** - Complete property cleaning, ONE-TIME ONLY

**KEY INFORMATION:**
- Deep Clean and Move-In/Out are NOT available as recurring services
- First-time customers often start with Deep Clean, then switch to Regular recurring
- All recurring services include frequency discounts
- We provide all cleaning supplies and equipment
- Professional, insured, background-checked cleaners
- Satisfaction guaranteed

**YOUR ROLE:**
1. Answer pricing questions accurately using the table above
2. Help customers choose the right service and frequency
3. Check ZIP code availability when asked
4. Guide users through booking conversationally using interactive formats
5. Be friendly, professional, and concise
6. When ready to book, collect info one field at a time using input format
7. Always confirm booking details before creating

**CONVERSATION GUIDELINES:**
- Always use interactive formats for questions with clear choices
- Present one question at a time for better UX
- Use progress indicators to show booking completion
- Be friendly, concise, and conversational
- Explain pricing clearly with breakdowns and savings
- Highlight benefits of recurring services
- Use tools (calculate_price, check_availability, create_booking) when needed
- Collect info systematically: service → size → frequency → pricing → contact → address → scheduling → confirm

**IMPORTANT RULES:**
- NEVER offer Deep Clean or Move-In/Out as recurring - they are ONE-TIME ONLY
- Always mention the discount percentage for recurring services
- For 5,000+ sq ft homes, always say "custom quote needed"
- If ZIP code is not in service areas, politely explain where we do serve
- Keep responses under 3-4 sentences unless user asks for detailed info`;

    // Add current booking context if provided
    if (bookingContext) {
      contextPrompt += `\n\n**CURRENT BOOKING CONTEXT:**`;
      if (bookingContext.currentStep) contextPrompt += `\n- Current Step: ${bookingContext.currentStep}`;
      if (bookingContext.stateCode) contextPrompt += `\n- State: ${bookingContext.stateCode}`;
      if (bookingContext.zipCode) contextPrompt += `\n- ZIP Code: ${bookingContext.zipCode}`;
      if (bookingContext.serviceType) contextPrompt += `\n- Service Type: ${bookingContext.serviceType}`;
      if (bookingContext.homeSize) contextPrompt += `\n- Home Size: ${bookingContext.homeSize}`;
      if (bookingContext.frequency) contextPrompt += `\n- Frequency: ${bookingContext.frequency}`;
      if (bookingContext.estimatedPrice) contextPrompt += `\n- Current Price Estimate: $${bookingContext.estimatedPrice}`;
    }

    console.log('Chat request:', { messageCount: messages.length, hasContext: !!bookingContext });

    // Define tools for function calling
    const tools = [
      {
        type: "function",
        function: {
          name: "calculate_price",
          description: "Calculate exact pricing for a cleaning service based on home size, service type, and frequency. Use this when user asks about specific pricing.",
          parameters: {
            type: "object",
            properties: {
              sqft: { type: "number", description: "Square footage of the home (optional if homeSizeId provided)" },
              homeSizeId: { type: "string", description: "Home size ID like '2001_2500'" },
              serviceType: { type: "string", enum: ["regular", "deep", "move_in_out"], description: "Type of cleaning service" },
              frequency: { type: "string", enum: ["one_time", "weekly", "bi_weekly", "monthly"], description: "Service frequency" },
              stateCode: { type: "string", enum: ["TX", "CA", "NY"], description: "State code" }
            },
            required: ["serviceType", "frequency", "stateCode"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Check if cleaning service is available in a specific ZIP code",
          parameters: {
            type: "object",
            properties: {
              zipCode: { type: "string", description: "5-digit ZIP code to check" }
            },
            required: ["zipCode"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_booking",
          description: "Create a new cleaning service booking when user has provided all required information and confirmed they want to book",
          parameters: {
            type: "object",
            properties: {
              firstName: { type: "string", description: "Customer's first name" },
              lastName: { type: "string", description: "Customer's last name" },
              email: { type: "string", format: "email", description: "Customer's email address" },
              phone: { type: "string", description: "Customer's phone number" },
              address: { type: "string", description: "Street address" },
              city: { type: "string", description: "City" },
              state: { type: "string", enum: ["TX", "CA", "NY"], description: "State" },
              zipCode: { type: "string", description: "5-digit ZIP code" },
              serviceType: { type: "string", enum: ["regular", "deep", "move_in_out"], description: "Service type" },
              homeSizeId: { type: "string", description: "Home size ID" },
              sqft: { type: "number", description: "Square footage (optional)" },
              frequency: { type: "string", enum: ["one_time", "weekly", "bi_weekly", "monthly"], description: "Service frequency" },
              preferredDate: { type: "string", format: "date", description: "Preferred service date (YYYY-MM-DD)" },
              preferredTime: { type: "string", description: "Preferred time slot like '8:00 AM', '12:00 PM', or '4:00 PM'" },
              specialInstructions: { type: "string", description: "Any special instructions (optional)" }
            },
            required: ["firstName", "lastName", "email", "phone", "zipCode", "serviceType", "frequency", "preferredDate"]
          }
        }
      }
    ];

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
        tools: tools,
        tool_choice: "auto",
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

    // Handle streaming with tool call support
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          let toolCalls: any[] = [];
          
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                
                // Check for tool calls
                if (parsed.choices?.[0]?.delta?.tool_calls) {
                  const toolCallDelta = parsed.choices[0].delta.tool_calls[0];
                  
                  if (!toolCalls[toolCallDelta.index]) {
                    toolCalls[toolCallDelta.index] = {
                      id: toolCallDelta.id,
                      type: toolCallDelta.type,
                      function: { name: toolCallDelta.function?.name || '', arguments: '' }
                    };
                  }
                  
                  if (toolCallDelta.function?.arguments) {
                    toolCalls[toolCallDelta.index].function.arguments += toolCallDelta.function.arguments;
                  }
                } else if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                  // Execute tool calls
                  for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    let result = '';
                    
                    if (functionName === 'calculate_price') {
                      result = calculateChatPricing(args);
                    } else if (functionName === 'check_availability') {
                      result = await checkAvailability(args.zipCode);
                    } else if (functionName === 'create_booking') {
                      // Call booking creation endpoint
                      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
                      const bookingResponse = await fetch(`${SUPABASE_URL}/functions/v1/chat-create-booking`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                        },
                        body: JSON.stringify(args)
                      });
                      
                      const bookingResult = await bookingResponse.json();
                      if (bookingResult.error) {
                        result = `Error creating booking: ${bookingResult.error}`;
                      } else {
                        result = `Booking created successfully! Booking ID: ${bookingResult.bookingId}. ${bookingResult.message}`;
                      }
                    }
                    
                    // Send tool result as a message
                    const toolResultMessage = {
                      role: 'assistant',
                      content: result
                    };
                    
                    const chunk = encoder.encode(`data: ${JSON.stringify({
                      choices: [{
                        delta: { content: result },
                        index: 0,
                        finish_reason: null
                      }]
                    })}\n\n`);
                    controller.enqueue(chunk);
                  }
                  
                  toolCalls = [];
                } else {
                  // Regular content streaming
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
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
