import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-GOHIGHLEVEL-BOOKING] ${step}${detailsStr}`);
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

    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      scheduledDate, 
      scheduledTime, 
      serviceType, 
      address,
      serviceDetails 
    } = await req.json();

    logStep("Request data received", { customerEmail, scheduledDate, scheduledTime, serviceType });

    // Create contact in GoHighLevel first
    const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        firstName: customerName?.split(' ')[0] || '',
        lastName: customerName?.split(' ').slice(1).join(' ') || '',
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address1: address?.street,
        city: address?.city,
        state: address?.state,
        postalCode: address?.zipCode,
        locationId: GHL_LOCATION_ID,
        tags: ["cleaning-customer", serviceType],
        customFields: [
          {
            key: "service_type",
            field_value: serviceType
          },
          {
            key: "scheduled_date",
            field_value: scheduledDate
          },
          {
            key: "scheduled_time", 
            field_value: scheduledTime
          }
        ]
      })
    });

    const contactData = await contactResponse.json();
    logStep("Contact created/updated", { contactId: contactData.contact?.id });

    // Create appointment in GoHighLevel
    const startDateTime = new Date(`${scheduledDate}T${getTimeSlotHour(scheduledTime)}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours default

    const appointmentResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        calendarId: GHL_LOCATION_ID, // Using location ID as calendar ID
        contactId: contactData.contact?.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        title: `${serviceType} - ${customerName}`,
        appointmentStatus: "confirmed",
        assignedUserId: null,
        address: `${address?.street}, ${address?.city}, ${address?.state} ${address?.zipCode}`,
        notes: `Service: ${serviceType}\nSpecial Instructions: ${serviceDetails?.instructions?.special || 'None'}\nAccess Instructions: ${serviceDetails?.instructions?.access || 'None'}\nParking: ${serviceDetails?.instructions?.parking || 'None'}\nPets: ${serviceDetails?.instructions?.pets ? 'Yes' : 'No'}`,
        ignoreDateRange: false
      })
    });

    const appointmentData = await appointmentResponse.json();
    logStep("Appointment created", { appointmentId: appointmentData.id });

    return new Response(JSON.stringify({ 
      success: true, 
      contactId: contactData.contact?.id,
      appointmentId: appointmentData.id,
      message: "Booking created successfully in GoHighLevel"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-gohighlevel-booking", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getTimeSlotHour(timeSlot: string): string {
  switch (timeSlot) {
    case "Early Morning (6-9 AM)":
      return "06";
    case "Morning (9 AM-12 PM)":
      return "09";
    case "Afternoon (12-5 PM)":
      return "12";
    case "Evening (5-8 PM)":
      return "17";
    case "After Hours (8 PM+)":
      return "20";
    default:
      return "09";
  }
}