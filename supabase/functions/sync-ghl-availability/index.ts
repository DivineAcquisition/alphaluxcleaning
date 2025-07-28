import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-GHL-AVAILABILITY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      throw new Error("GoHighLevel API credentials not configured");
    }

    const { startDate, endDate } = await req.json();
    logStep("Request data received", { startDate, endDate });

    // Get calendars for the location
    const calendarsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    });

    const calendarsData = await calendarsResponse.json();
    logStep("Calendars retrieved", { count: calendarsData.calendars?.length });

    if (!calendarsData.calendars || calendarsData.calendars.length === 0) {
      throw new Error("No calendars found in GoHighLevel");
    }

    // Use the first calendar or find by location
    const calendar = calendarsData.calendars.find(cal => cal.locationId === GHL_LOCATION_ID) || calendarsData.calendars[0];
    logStep("Calendar selected", { calendarId: calendar.id, name: calendar.name });

    // Get availability slots for the date range
    const availabilityResponse = await fetch(`https://services.leadconnectorhq.com/calendars/${calendar.id}/free-slots`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    });

    const availabilityData = await availabilityResponse.json();
    logStep("Availability retrieved", { slotsCount: availabilityData.slots?.length });

    // Get existing appointments to check for conflicts
    const appointmentsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments?calendarId=${calendar.id}&startDate=${startDate}&endDate=${endDate}`, {
      method: "GET", 
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    });

    const appointmentsData = await appointmentsResponse.json();
    logStep("Existing appointments retrieved", { appointmentsCount: appointmentsData.events?.length });

    // Process and format availability data
    const formattedSlots = processAvailabilitySlots(availabilityData.slots || [], appointmentsData.events || []);

    return new Response(JSON.stringify({ 
      success: true,
      calendarId: calendar.id,
      calendarName: calendar.name,
      availableSlots: formattedSlots,
      totalSlots: formattedSlots.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-ghl-availability", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function processAvailabilitySlots(slots: any[], existingAppointments: any[]) {
  const formattedSlots = [];
  
  for (const slot of slots) {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    
    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);
      
      return (startTime < appointmentEnd && endTime > appointmentStart);
    });

    if (!hasConflict) {
      formattedSlots.push({
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60), // minutes
        available: true
      });
    }
  }
  
  return formattedSlots;
}