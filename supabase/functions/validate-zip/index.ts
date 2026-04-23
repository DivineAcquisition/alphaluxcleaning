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
 * New York is always on (that account is primary). California and
 * Texas are gated behind the `STRIPE_ACCOUNT_CATX_ENABLED=true`
 * env var so the Stripe plumbing can ship before the flow opens
 * up to new states.
 */

// --- New York --------------------------------------------------------------
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

function isNewYorkZip(zipCode: number): boolean {
  return NEW_YORK_ZIP_RANGES.some((r) => zipCode >= r.min && zipCode <= r.max);
}

// --- California ------------------------------------------------------------
// 90000–96199 covers the entire state. Within that range there's a small
// pocket (967xx) that belongs to the Northern Mariana Islands; we don't
// service that so it's excluded.
function isCaliforniaZip(zipCode: number): boolean {
  if (zipCode < 90000 || zipCode > 96199) return false;
  if (zipCode >= 96701 && zipCode <= 96899) return false; // HI / territories
  return true;
}

// --- Texas -----------------------------------------------------------------
function isTexasZip(zipCode: number): boolean {
  if (zipCode === 73301) return true; // IRS Austin single-box
  if (zipCode >= 75000 && zipCode <= 79999) return true;
  if (zipCode >= 88510 && zipCode <= 88589) return true; // TX corner of NM
  return false;
}

// --- Kill-switch -----------------------------------------------------------
function flagOn(name: string): boolean {
  const v = (Deno.env.get(name) || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

function catxEnabled(): boolean {
  return flagOn("STRIPE_ACCOUNT_CATX_ENABLED");
}

// --- City labels -----------------------------------------------------------
function getGenericCityFromZip(zipCode: number): string | null {
  if (zipCode >= 10001 && zipCode <= 10299) return "New York";
  if (zipCode >= 10301 && zipCode <= 10314) return "Staten Island";
  if (zipCode >= 10451 && zipCode <= 10475) return "Bronx";
  if (zipCode >= 11201 && zipCode <= 11256) return "Brooklyn";
  if (zipCode >= 11001 && zipCode <= 11109) return "Queens";
  if (zipCode >= 11351 && zipCode <= 11697) return "Queens";
  if (zipCode >= 10501 && zipCode <= 10598) return "Westchester";
  if (zipCode >= 10601 && zipCode <= 10610) return "White Plains";
  if (zipCode >= 10701 && zipCode <= 10710) return "Yonkers";
  if (zipCode >= 10801 && zipCode <= 10805) return "New Rochelle";
  if (zipCode >= 10901 && zipCode <= 10998) return "Rockland County";
  if (zipCode >= 11701 && zipCode <= 11899) return "Nassau County";
  if (zipCode >= 11900 && zipCode <= 11980) return "Suffolk County";
  if (zipCode >= 12000 && zipCode <= 12299) return "Albany";
  if (zipCode >= 12401 && zipCode <= 12499) return "Kingston";
  if (zipCode >= 13201 && zipCode <= 13299) return "Syracuse";
  if (zipCode >= 13501 && zipCode <= 13599) return "Utica";
  if (zipCode >= 13601 && zipCode <= 13699) return "Watertown";
  if (zipCode >= 14201 && zipCode <= 14299) return "Buffalo";
  if (zipCode >= 14601 && zipCode <= 14699) return "Rochester";
  if (zipCode >= 14850 && zipCode <= 14899) return "Ithaca";

  // California generic labels (only used when CA is enabled)
  if (zipCode >= 90001 && zipCode <= 90899) return "Los Angeles";
  if (zipCode >= 91300 && zipCode <= 91399) return "Van Nuys";
  if (zipCode >= 92101 && zipCode <= 92199) return "San Diego";
  if (zipCode >= 94101 && zipCode <= 94199) return "San Francisco";
  if (zipCode >= 94501 && zipCode <= 94502) return "Alameda";
  if (zipCode >= 95101 && zipCode <= 95199) return "San Jose";
  if (zipCode >= 95801 && zipCode <= 95899) return "Sacramento";

  // Texas generic labels
  if (zipCode >= 75001 && zipCode <= 75399) return "Dallas";
  if (zipCode >= 76101 && zipCode <= 76199) return "Fort Worth";
  if (zipCode >= 77001 && zipCode <= 77099) return "Houston";
  if (zipCode >= 78201 && zipCode <= 78299) return "San Antonio";
  if (zipCode >= 78701 && zipCode <= 78799) return "Austin";
  return null;
}

function stateForZip(zipCode: number): string | null {
  if (isNewYorkZip(zipCode)) return "NY";
  if (isCaliforniaZip(zipCode)) return "CA";
  if (isTexasZip(zipCode)) return "TX";
  return null;
}

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
    const serveableStates = new Set<string>(["NY"]);
    if (catxEnabled()) {
      serveableStates.add("CA");
      serveableStates.add("TX");
    }

    if (!state || !serveableStates.has(state)) {
      const coverage = catxEnabled()
        ? "New York, California, and Texas"
        : "New York State";
      return new Response(
        JSON.stringify({
          isValid: false,
          message:
            `Sorry, AlphaLux Cleaning is currently only servicing ${coverage}. ZIP ${zipCode} is outside our service area. Call (857) 754-4557 if you think this is a mistake.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data } = await supabase
      .from("service_areas")
      .select("city, state, active")
      .eq("zip_code", zipCode)
      .eq("active", true)
      .in("state", Array.from(serveableStates))
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
