import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ZIP code range validation functions (matching service-area-validation.ts)
const TEXAS_ZIP_RANGES = [
  { min: 75000, max: 75099 }, // Dallas
  { min: 75201, max: 75398 }, // Dallas Metro
  { min: 76001, max: 76199 }, // Fort Worth
  { min: 77001, max: 77099 }, // Houston Central
  { min: 77201, max: 77299 }, // Houston Metro
  { min: 77301, max: 77599 }, // Houston Extended
  { min: 78701, max: 78799 }, // Austin
];

const CALIFORNIA_ZIP_RANGES = [
  { min: 90001, max: 90899 }, // Los Angeles
  { min: 91001, max: 91899 }, // Pasadena/Glendale
  { min: 92001, max: 92899 }, // San Diego
  { min: 93001, max: 93599 }, // Central Coast
  { min: 94001, max: 94188 }, // San Francisco Bay Area
];

const NEW_YORK_ZIP_RANGES = [
  { min: 10001, max: 10299 }, // Manhattan
  { min: 10301, max: 10314 }, // Staten Island
  { min: 10451, max: 10475 }, // Bronx
  { min: 11001, max: 11697 }, // Queens/Brooklyn
];

function isTexasZip(zipCode: number): boolean {
  return TEXAS_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

function isCaliforniaZip(zipCode: number): boolean {
  return CALIFORNIA_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

function isNewYorkZip(zipCode: number): boolean {
  return NEW_YORK_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

function getStateFromZip(zipCode: number): string | null {
  if (isTexasZip(zipCode)) return "TX";
  if (isCaliforniaZip(zipCode)) return "CA";
  if (isNewYorkZip(zipCode)) return "NY";
  return null;
}

function getGenericCityFromZip(zipCode: number): string | null {
  if (zipCode >= 75000 && zipCode <= 75398) return "Dallas";
  if (zipCode >= 76001 && zipCode <= 76199) return "Fort Worth";
  if (zipCode >= 77001 && zipCode <= 77599) return "Houston";
  if (zipCode >= 78701 && zipCode <= 78799) return "Austin";
  if (zipCode >= 90001 && zipCode <= 90899) return "Los Angeles";
  if (zipCode >= 91001 && zipCode <= 91899) return "Pasadena";
  if (zipCode >= 92001 && zipCode <= 92899) return "San Diego";
  if (zipCode >= 94001 && zipCode <= 94188) return "San Francisco";
  if (zipCode >= 10001 && zipCode <= 10299) return "New York";
  if (zipCode >= 10301 && zipCode <= 10314) return "Staten Island";
  if (zipCode >= 10451 && zipCode <= 10475) return "Bronx";
  if (zipCode >= 11001 && zipCode <= 11697) return "Brooklyn";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode } = await req.json();
    
    console.log("🔍 Validating ZIP code:", zipCode);
    
    const zipNum = parseInt(zipCode, 10);
    
    // Step 1: Check if ZIP is in service area ranges
    const state = getStateFromZip(zipNum);
    
    if (!state) {
      console.log("❌ ZIP not in service area ranges:", zipCode);
      return new Response(
        JSON.stringify({
          isValid: false,
          message: `Sorry, we don't service ${zipCode} yet. Call (972) 559-0223 for options.`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    }
    
    console.log("✅ ZIP in service range:", zipCode, "state:", state);
    
    // Step 2: Try to get specific city/state from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from('service_areas')
      .select('city, state, active')
      .eq('zip_code', zipCode)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ Database query error (using fallback):", error);
    }

    // Step 3: Use database data if available, otherwise use generic city/state
    const city = data?.city || getGenericCityFromZip(zipNum) || "Service Area";
    const finalState = data?.state || state;

    console.log("✅ Valid ZIP:", zipCode, "in", city, finalState, data ? "(from DB)" : "(generic)");
    
    return new Response(
      JSON.stringify({
        isValid: true,
        city: city,
        state: finalState
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("❌ Error in validate-zip:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isValid: false 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
