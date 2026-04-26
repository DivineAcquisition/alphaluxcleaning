import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * ZIP allow-list for AlphaLux Cleaning.
 *
 * Service area: New York State, California, and Texas. The previous
 * dual-Stripe-account router that gated CA + TX behind environment
 * flags is gone — every booking lands on the single AlphaLux Stripe
 * account, so all three states are always on. Ranges are USPS
 * canonical ZIP-3 / ZIP-5 blocks.
 */

// New York covers the entire state, expressed as the public ZIP-3
// blocks the USPS issues.
const NEW_YORK_ZIP_RANGES = [
  { min: 10001, max: 10299 }, // Manhattan
  { min: 10301, max: 10314 }, // Staten Island
  { min: 10451, max: 10475 }, // Bronx
  { min: 10501, max: 10598 }, // Westchester
  { min: 10601, max: 10710 }, // White Plains / Yonkers
  { min: 10801, max: 10805 }, // New Rochelle
  { min: 10901, max: 10998 }, // Rockland / Orange County
  { min: 11001, max: 11697 }, // Queens / Brooklyn
  { min: 11701, max: 11980 }, // Long Island (Nassau / Suffolk)
  { min: 12000, max: 12999 }, // Albany, Hudson Valley
  { min: 13000, max: 13999 }, // Central / Northern NY
  { min: 14000, max: 14999 }, // Western NY
];

function isNewYorkZip(zip: number): boolean {
  return NEW_YORK_ZIP_RANGES.some((r) => zip >= r.min && zip <= r.max);
}

/**
 * California: 90000–96199 covers the state. We exclude 967xx, which
 * the USPS uses for Hawaii / Pacific territories that share the
 * upper end of this block.
 */
function isCaliforniaZip(zip: number): boolean {
  if (zip < 90000 || zip > 96199) return false;
  if (zip >= 96701 && zip <= 96899) return false; // HI / Pacific territories
  return true;
}

/**
 * Texas: the canonical 750–799 ZIP-3 block, plus 73301 (the IRS
 * Austin single-box code) and 88510–88589 (the El Paso "TX corner of
 * NM" block USPS folds into Texas).
 */
function isTexasZip(zip: number): boolean {
  if (zip === 73301) return true;
  if (zip >= 75000 && zip <= 79999) return true;
  if (zip >= 88510 && zip <= 88589) return true;
  return false;
}

function stateForZip(zip: number): "NY" | "CA" | "TX" | null {
  if (isNewYorkZip(zip)) return "NY";
  if (isCaliforniaZip(zip)) return "CA";
  if (isTexasZip(zip)) return "TX";
  return null;
}

function getGenericCityFromZip(zip: number): string | null {
  // New York
  if (zip >= 10001 && zip <= 10299) return "New York";
  if (zip >= 10301 && zip <= 10314) return "Staten Island";
  if (zip >= 10451 && zip <= 10475) return "Bronx";
  if (zip >= 11201 && zip <= 11256) return "Brooklyn";
  if (zip >= 11001 && zip <= 11109) return "Queens";
  if (zip >= 11351 && zip <= 11697) return "Queens";
  if (zip >= 10501 && zip <= 10598) return "Westchester";
  if (zip >= 10601 && zip <= 10610) return "White Plains";
  if (zip >= 10701 && zip <= 10710) return "Yonkers";
  if (zip >= 10801 && zip <= 10805) return "New Rochelle";
  if (zip >= 10901 && zip <= 10998) return "Rockland County";
  if (zip >= 11701 && zip <= 11899) return "Nassau County";
  if (zip >= 11900 && zip <= 11980) return "Suffolk County";
  if (zip >= 12000 && zip <= 12299) return "Albany";
  if (zip >= 12401 && zip <= 12499) return "Kingston";
  if (zip >= 13201 && zip <= 13299) return "Syracuse";
  if (zip >= 13501 && zip <= 13599) return "Utica";
  if (zip >= 13601 && zip <= 13699) return "Watertown";
  if (zip >= 14201 && zip <= 14299) return "Buffalo";
  if (zip >= 14601 && zip <= 14699) return "Rochester";
  if (zip >= 14850 && zip <= 14899) return "Ithaca";

  // California
  if (zip >= 90001 && zip <= 90899) return "Los Angeles";
  if (zip >= 91300 && zip <= 91399) return "Van Nuys";
  if (zip >= 92101 && zip <= 92199) return "San Diego";
  if (zip >= 94101 && zip <= 94199) return "San Francisco";
  if (zip >= 94501 && zip <= 94502) return "Alameda";
  if (zip >= 95101 && zip <= 95199) return "San Jose";
  if (zip >= 95801 && zip <= 95899) return "Sacramento";

  // Texas
  if (zip >= 75001 && zip <= 75399) return "Dallas";
  if (zip >= 76101 && zip <= 76199) return "Fort Worth";
  if (zip >= 77001 && zip <= 77099) return "Houston";
  if (zip >= 78201 && zip <= 78299) return "San Antonio";
  if (zip >= 78701 && zip <= 78799) return "Austin";
  return null;
}

const SERVICEABLE_STATES = ["NY", "CA", "TX"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode } = await req.json();
    const zipNum = parseInt(String(zipCode || "").trim().slice(0, 5), 10);

    if (!zipNum) {
      return new Response(
        JSON.stringify({
          isValid: false,
          message: `Please enter a valid 5-digit ZIP code.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const state = stateForZip(zipNum);
    if (!state) {
      return new Response(
        JSON.stringify({
          isValid: false,
          message:
            `Sorry, AlphaLux Cleaning is currently servicing New York, California, and Texas. ZIP ${zipCode} is outside our service area. Call (857) 754-4557 if you think this is a mistake.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // service_areas can override the city / display label per-ZIP
    // for cases where USPS-block heuristics aren't quite right (e.g.
    // hyper-local naming). We restrict to the three serviceable
    // states so a row mistakenly entered for another state can't
    // sneak through the allow-list.
    const { data } = await supabase
      .from("service_areas")
      .select("city, state, active")
      .eq("zip_code", zipCode)
      .eq("active", true)
      .in("state", Array.from(SERVICEABLE_STATES))
      .maybeSingle();

    const city = data?.city || getGenericCityFromZip(zipNum) || "Service Area";
    const finalState = data?.state || state;

    return new Response(
      JSON.stringify({ isValid: true, city, state: finalState }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("validate-zip error:", error);
    return new Response(
      JSON.stringify({ error: error.message, isValid: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
