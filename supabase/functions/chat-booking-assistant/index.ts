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
      return 'For homes 5,000+ sq ft, we provide custom quotes. Please call us at (857) 754-4557 or email hello@alphaluxclean.com';
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
    return `Unfortunately, we don't currently service ZIP code ${zipCode}. AlphaLux Cleaning is currently only servicing New York State (NYC, Long Island, Westchester, Hudson Valley, Capital Region, Central NY, and Western NY). Please check if you're in one of our service areas!`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, bookingContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // Log incoming request for debugging
    console.log('Chat request:', { 
      messageCount: messages.length, 
      hasContext: !!bookingContext,
      collectedData: bookingContext?.collectedData 
    });
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Concise system prompt
    let contextPrompt = `You are a booking assistant for Alpha Lux Clean. Collect info step-by-step to complete bookings.

**OUTPUT RULES:**
- For interactive questions: Output ONLY "INTERACTIVE:{...}" with no extra text before or after
- For plain responses: One sentence max, no emojis, no marketing
- Never echo system state or debug info to user
- After responding or running a tool, immediately ask the next missing field. Do not pause or wait for extra user confirmation unless the step is 'Confirmation'

**INTERACTIVE FORMATS:**
Single-select: INTERACTIVE:{"type":"options","question":"...","options":[{"id":"...","label":"..."}]}
Multi-select: INTERACTIVE:{"type":"multiselect","question":"...","multiSelectOptions":[...]}
Text input: INTERACTIVE:{"type":"input","question":"...","inputType":"text|email|phone|date|time","placeholder":"..."}
Confirmation: INTERACTIVE:{"type":"confirmation","question":"...","confirmationData":{...}}

**BOOKING FLOW (Ask one at a time):**
1. Service type (options: Regular Clean, Deep Clean, Move-In/Out)
2. Home size (options: 1000-1500 sq ft, 1501-2000, etc.)
3. Frequency (options: Weekly 15% off, Bi-Weekly 10% off, Monthly 5% off, One-Time)
4. State (input: two-letter code like NY)
5. Show pricing (use calculate_price tool, display result in one sentence)
6. First name (input)
7. Last name (input)
8. Email (input)
9. Phone (input)
10. Street address (input)
11. City (input)
12. ZIP code (input, then use check_availability tool)
13. Preferred date (input)
14. Preferred time (options: Morning 8-12, Afternoon 12-4, Evening 4-8)
15. Add-ons (multiselect: Oven +$25, Fridge +$25, Windows +$35, Baseboards +$15, Inside Cabinets +$20)
16. Confirmation (show all collected data)
17. Create booking (use create_booking tool after confirmation)

**PRICING:**
1000-1500 sqft: Regular $140, Deep $250, Move-In/Out $265
1501-2000 sqft: Regular $175, Deep $315, Move-In/Out $332
2001-2500 sqft: Regular $206, Deep $370, Move-In/Out $390
2501-3000 sqft: Regular $237, Deep $426, Move-In/Out $449
3001-3500 sqft: Regular $268, Deep $482, Move-In/Out $507
3501-4000 sqft: Regular $299, Deep $537, Move-In/Out $566
4001-4500 sqft: Regular $330, Deep $593, Move-In/Out $624
4501-5000 sqft: Regular $361, Deep $649, Move-In/Out $683
5000+ sqft: Custom quote

State multipliers: TX 1.0x, CA 1.5x, NY 1.3x
Frequency discounts: Weekly 15%, Bi-Weekly 10%, Monthly 5%
Deep Clean and Move-In/Out are ONE-TIME ONLY (no recurring)`;

    // Add current booking state tracking (internal only, never shown to user)
    const collectedData = bookingContext?.collectedData || {};
    const userMsgCount = messages.filter((m: any) => m.role === 'user').length;
    const collectedFieldCount = Object.values(collectedData).filter(v => v).length;
    
    contextPrompt += `\n\n**STATE (internal - never show to user):**
Service: ${collectedData.serviceType || 'MISSING'}
Size: ${collectedData.homeSize || 'MISSING'}
Frequency: ${collectedData.frequency || 'MISSING'}
State: ${collectedData.stateCode || 'MISSING'}
First: ${collectedData.firstName || 'MISSING'}
Last: ${collectedData.lastName || 'MISSING'}
Email: ${collectedData.email || 'MISSING'}
Phone: ${collectedData.phone || 'MISSING'}
Address: ${collectedData.streetAddress || 'MISSING'}
City: ${collectedData.city || 'MISSING'}
ZIP: ${collectedData.zipCode || 'MISSING'}
Time: ${collectedData.preferredTime || 'MISSING'}
Add-ons: ${collectedData.addOns?.length ? collectedData.addOns.join(', ') : 'MISSING'}

Ask for FIRST missing field in order. After general questions, redirect to booking.`;

    // Fallback if stuck
    if (userMsgCount > 10 && collectedFieldCount < 3) {
      contextPrompt += `\n\nCRITICAL: Ask for next missing field NOW. No general talk.`;
    }
    
    // Add legacy context if provided
    if (bookingContext) {
      if (bookingContext.currentStep) contextPrompt += `\n- Current Step: ${bookingContext.currentStep}`;
      if (bookingContext.stateCode) contextPrompt += `\n- State: ${bookingContext.stateCode}`;
      if (bookingContext.zipCode) contextPrompt += `\n- ZIP Code: ${bookingContext.zipCode}`;
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

    // Iterative tool-calling loop with streaming
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Maintain conversation state across tool call iterations
          const conversation = [
            { role: 'system', content: contextPrompt },
            ...messages
          ];
          
          let loopCount = 0;
          const maxLoops = 10; // Safety limit
          
          while (loopCount < maxLoops) {
            loopCount++;
            console.log(`🔄 Loop iteration ${loopCount}`, { messageCount: conversation.length });
            
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: conversation,
                tools: tools,
                tool_choice: "auto",
                stream: true,
              }),
            });

            if (!response.ok) {
              if (response.status === 429) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  choices: [{
                    delta: { content: 'Our assistant is busy right now. Please try again in a moment.' },
                    index: 0,
                    finish_reason: 'stop'
                  }]
                })}\n\n`));
                break;
              }
              if (response.status === 402) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  choices: [{
                    delta: { content: 'Service temporarily unavailable. Please try again later.' },
                    index: 0,
                    finish_reason: 'stop'
                  }]
                })}\n\n`));
                break;
              }
              
              const errorText = await response.text();
              console.error('AI gateway error:', response.status, errorText);
              throw new Error('AI gateway error');
            }

            // Stream the response
            const reader = response.body?.getReader();
            let buffer = '';
            let toolCalls: any[] = [];
            let assistantContent = '';
            let finishReason = '';
            
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
                  
                  // Capture finish reason
                  if (parsed.choices?.[0]?.finish_reason) {
                    finishReason = parsed.choices[0].finish_reason;
                  }
                  
                  // Check for tool calls
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    const toolCallDelta = parsed.choices[0].delta.tool_calls[0];
                    
                    if (!toolCalls[toolCallDelta.index]) {
                      toolCalls[toolCallDelta.index] = {
                        id: toolCallDelta.id || `call_${Date.now()}_${toolCallDelta.index}`,
                        type: toolCallDelta.type || 'function',
                        function: { name: toolCallDelta.function?.name || '', arguments: '' }
                      };
                    }
                    
                    if (toolCallDelta.function?.name) {
                      toolCalls[toolCallDelta.index].function.name = toolCallDelta.function.name;
                    }
                    
                    if (toolCallDelta.function?.arguments) {
                      toolCalls[toolCallDelta.index].function.arguments += toolCallDelta.function.arguments;
                    }
                  } else if (parsed.choices?.[0]?.delta?.content) {
                    // Regular content - stream to client and accumulate
                    const content = parsed.choices[0].delta.content;
                    assistantContent += content;
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing SSE:', e);
                }
              }
            }

            // Handle tool calls if finish_reason is 'tool_calls'
            if (finishReason === 'tool_calls' && toolCalls.length > 0) {
              console.log(`🔧 Executing ${toolCalls.length} tool(s)`, toolCalls.map(tc => tc.function.name));
              
              // Append assistant message with tool_calls to conversation
              conversation.push({
                role: 'assistant',
                content: null,
                tool_calls: toolCalls.map(tc => ({
                  id: tc.id,
                  type: tc.type,
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                  }
                }))
              });
              
              // Execute each tool and append tool messages
              for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                let args;
                try {
                  args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                  console.error('Failed to parse tool arguments:', e);
                  continue;
                }
                
                console.log(`  → ${functionName}(${JSON.stringify(args).substring(0, 100)}...)`);
                
                let result = '';
                
                if (functionName === 'calculate_price') {
                  result = calculateChatPricing(args);
                } else if (functionName === 'check_availability') {
                  result = await checkAvailability(args.zipCode);
                } else if (functionName === 'create_booking') {
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
                
                console.log(`  ✓ ${functionName} result:`, result.substring(0, 100));
                
                // Append tool result message to conversation
                conversation.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  name: functionName,
                  content: result
                });
              }
              
              // Loop again - call LLM with updated conversation including tool results
              continue;
            } else {
              // Normal completion - we're done
              console.log(`✅ Completed with finish_reason: ${finishReason}`);
              break;
            }
          }
          
          if (loopCount >= maxLoops) {
            console.warn('⚠️ Max loop iterations reached');
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
