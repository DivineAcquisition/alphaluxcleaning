import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ZIP code range validation functions - Comprehensive coverage for TX, CA, NY
const TEXAS_ZIP_RANGES = [
  { min: 75000, max: 75099 }, // Dallas
  { min: 75201, max: 75398 }, // Dallas Metro
  { min: 76001, max: 76199 }, // Fort Worth
  { min: 76201, max: 76299 }, // Denton
  { min: 77001, max: 77099 }, // Houston Central
  { min: 77201, max: 77299 }, // Houston Metro
  { min: 77301, max: 77599 }, // Houston Extended
  { min: 78000, max: 78299 }, // San Antonio
  { min: 78701, max: 78799 }, // Austin
  { min: 79901, max: 79999 }, // El Paso
  { min: 78401, max: 78499 }, // Corpus Christi
  { min: 79401, max: 79499 }, // Lubbock
  { min: 79101, max: 79199 }, // Amarillo
  { min: 78501, max: 78599 }, // McAllen
  { min: 78040, max: 78049 }, // Laredo
  { min: 76501, max: 76599 }, // Temple/Killeen
  { min: 76701, max: 76799 }, // Waco
  { min: 79601, max: 79699 }, // Abilene
  { min: 75600, max: 75799 }, // Tyler/Longview
  { min: 77801, max: 77899 }, // Bryan/College Station
];

const CALIFORNIA_ZIP_RANGES = [
  { min: 90001, max: 90089 }, // Los Angeles Central
  { min: 90201, max: 90899 }, // Los Angeles Metro
  { min: 91001, max: 91899 }, // Pasadena/Glendale
  { min: 92101, max: 92199 }, // San Diego Central
  { min: 92201, max: 92899 }, // San Diego Extended
  { min: 93001, max: 93599 }, // Central Coast (Ventura/Santa Barbara)
  { min: 94002, max: 94188 }, // San Francisco/Peninsula
  { min: 94501, max: 94709 }, // Oakland/East Bay
  { min: 95001, max: 95199 }, // San Jose/South Bay
  { min: 93601, max: 93799 }, // Fresno
  { min: 95814, max: 95899 }, // Sacramento
  { min: 92301, max: 92399 }, // San Bernardino
  { min: 92501, max: 92599 }, // Riverside
  { min: 92701, max: 92899 }, // Orange County
  { min: 93301, max: 93399 }, // Bakersfield
  { min: 95201, max: 95299 }, // Stockton
  { min: 95350, max: 95389 }, // Modesto
  { min: 92003, max: 92099 }, // North San Diego County
];

const NEW_YORK_ZIP_RANGES = [
  { min: 10001, max: 10299 }, // Manhattan
  { min: 10301, max: 10314 }, // Staten Island
  { min: 10451, max: 10475 }, // Bronx
  { min: 11001, max: 11697 }, // Queens/Brooklyn
  { min: 11701, max: 11980 }, // Long Island (Suffolk/Nassau)
  { min: 12201, max: 12299 }, // Albany
  { min: 13201, max: 13299 }, // Syracuse
  { min: 14201, max: 14299 }, // Buffalo
  { min: 14601, max: 14699 }, // Rochester
  { min: 10701, max: 10710 }, // Yonkers
  { min: 12401, max: 12499 }, // Kingston
  { min: 13601, max: 13699 }, // Watertown
  { min: 14850, max: 14899 }, // Ithaca
  { min: 13501, max: 13599 }, // Utica
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
  // Texas cities
  if (zipCode >= 75000 && zipCode <= 75398) return "Dallas";
  if (zipCode >= 76001 && zipCode <= 76199) return "Fort Worth";
  if (zipCode >= 76201 && zipCode <= 76299) return "Denton";
  if (zipCode >= 77001 && zipCode <= 77599) return "Houston";
  if (zipCode >= 78000 && zipCode <= 78299) return "San Antonio";
  if (zipCode >= 78701 && zipCode <= 78799) return "Austin";
  if (zipCode >= 79901 && zipCode <= 79999) return "El Paso";
  if (zipCode >= 78401 && zipCode <= 78499) return "Corpus Christi";
  if (zipCode >= 79401 && zipCode <= 79499) return "Lubbock";
  if (zipCode >= 79101 && zipCode <= 79199) return "Amarillo";
  if (zipCode >= 78501 && zipCode <= 78599) return "McAllen";
  if (zipCode >= 78040 && zipCode <= 78049) return "Laredo";
  if (zipCode >= 76501 && zipCode <= 76599) return "Temple";
  if (zipCode >= 76701 && zipCode <= 76799) return "Waco";
  if (zipCode >= 79601 && zipCode <= 79699) return "Abilene";
  if (zipCode >= 75600 && zipCode <= 75799) return "Tyler";
  if (zipCode >= 77801 && zipCode <= 77899) return "College Station";
  
  // California cities
  if (zipCode >= 90001 && zipCode <= 90899) return "Los Angeles";
  if (zipCode >= 91001 && zipCode <= 91899) return "Pasadena";
  if (zipCode >= 92101 && zipCode <= 92899) return "San Diego";
  if (zipCode >= 93001 && zipCode <= 93599) return "Santa Barbara";
  if (zipCode >= 94002 && zipCode <= 94188) return "San Francisco";
  if (zipCode >= 94501 && zipCode <= 94709) return "Oakland";
  if (zipCode >= 95001 && zipCode <= 95199) return "San Jose";
  if (zipCode >= 93601 && zipCode <= 93799) return "Fresno";
  if (zipCode >= 95814 && zipCode <= 95899) return "Sacramento";
  if (zipCode >= 92301 && zipCode <= 92399) return "San Bernardino";
  if (zipCode >= 92501 && zipCode <= 92599) return "Riverside";
  if (zipCode >= 92701 && zipCode <= 92899) return "Anaheim";
  if (zipCode >= 93301 && zipCode <= 93399) return "Bakersfield";
  if (zipCode >= 95201 && zipCode <= 95299) return "Stockton";
  if (zipCode >= 95350 && zipCode <= 95389) return "Modesto";
  if (zipCode >= 92003 && zipCode <= 92099) return "Carlsbad";
  
  // New York cities
  if (zipCode >= 10001 && zipCode <= 10299) return "New York";
  if (zipCode >= 10301 && zipCode <= 10314) return "Staten Island";
  if (zipCode >= 10451 && zipCode <= 10475) return "Bronx";
  if (zipCode >= 11001 && zipCode <= 11697) return "Brooklyn";
  if (zipCode >= 11701 && zipCode <= 11980) return "Long Island";
  if (zipCode >= 12201 && zipCode <= 12299) return "Albany";
  if (zipCode >= 13201 && zipCode <= 13299) return "Syracuse";
  if (zipCode >= 14201 && zipCode <= 14299) return "Buffalo";
  if (zipCode >= 14601 && zipCode <= 14699) return "Rochester";
  if (zipCode >= 10701 && zipCode <= 10710) return "Yonkers";
  if (zipCode >= 12401 && zipCode <= 12499) return "Kingston";
  if (zipCode >= 13601 && zipCode <= 13699) return "Watertown";
  if (zipCode >= 14850 && zipCode <= 14899) return "Ithaca";
  if (zipCode >= 13501 && zipCode <= 13599) return "Utica";
  
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
          message: `Sorry, we don't service ${zipCode} yet. Call (857) 754-4557 for options.`
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
