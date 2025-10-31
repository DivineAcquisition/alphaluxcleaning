import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, zipCode } = await req.json();
    
    console.log("📅 Fetching available slots for:", { date, zipCode });
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Query availability_schedule table
    const { data, error } = await supabase
      .from('availability_schedule')
      .select('*')
      .eq('date', date)
      .eq('active', true)
      .gte('available_slots', 1)
      .order('time_slot');

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    // Filter available slots (where booked < available)
    const availableSlots = (data || []).filter(
      slot => slot.booked_slots < slot.available_slots
    );

    console.log(`✅ Found ${availableSlots.length} available slots for ${date}`);
    
    return new Response(
      JSON.stringify({ 
        slots: availableSlots,
        count: availableSlots.length 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("❌ Error in get-available-slots:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        slots: [] 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
