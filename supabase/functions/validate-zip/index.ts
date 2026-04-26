import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * ZIP allow-list for AlphaLux Cleaning. NY-only.
 *
 * The previous multi-state setup gated CA + TX behind environment
 * flags so a second Stripe account could be onboarded; that account
 * has been removed and AlphaLux now operates on a single Stripe
 * account servicing New York State only. If/when service expands,
 * extend the ZIP ranges and city labels here.
 */

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

    if (!isNewYorkZip(zipNum)) {
      return new Response(
        JSON.stringify({
          isValid: false,
          message:
            `Sorry, AlphaLux Cleaning is currently only servicing New York State. ZIP ${zipCode} is outside our service area. Call (857) 754-4557 if you think this is a mistake.`,
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
      .eq("state", "NY")
      .maybeSingle();

    const city = data?.city || getGenericCityFromZip(zipNum) || "Service Area";
    const state = data?.state || "NY";

    return new Response(
      JSON.stringify({ isValid: true, city, state }),
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
