import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface RecurringReminderEmailProps {
  first_name: string;
  service_type: string;
  service_date: string;
  service_time: string;
  address: string;
  app_url: string;
  booking_id: string;
}

export const RecurringReminderEmail = ({ 
  first_name, 
  service_type,
  service_date,
  service_time,
  address,
  app_url,
  booking_id
}: RecurringReminderEmailProps) => (
  <EmailBase preview={`Your cleaning is scheduled for ${service_date}`}>
    <Heading style={h1}>Reminder: Cleaning in 2 Days! 🧹</Heading>
    <Text style={text}>
      Hi {first_name},
    </Text>
    <Text style={text}>
      Your {service_type} is scheduled for:
    </Text>
    <Section style={detailsBox}>
      <Text style={detailText}><strong>Date:</strong> {service_date}</Text>
      <Text style={detailText}><strong>Time:</strong> {service_time}</Text>
      <Text style={detailText}><strong>Location:</strong> {address}</Text>
    </Section>
    <Text style={text}>
      Please ensure someone is available to provide access. If you need to reschedule, please let us know ASAP.
    </Text>
    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/order-status?id=${booking_id}`}>
        View Details →
      </ActionButton>
    </Section>
    <Text style={note}>
      Have special instructions? Reply to this email and we'll make note of them!
    </Text>
  </EmailBase>
);

const h1 = { color: "#1A1A1A", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1A1A1A", fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px 0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };
const detailsBox = { 
  backgroundColor: "#F7F7F7", 
  padding: "20px", 
  borderRadius: "8px", 
  margin: "24px 0" 
};
const detailText = { margin: "8px 0", fontSize: "16px", color: "#1A1A1A" };
const note = { color: "#666", fontSize: "14px", margin: "24px 0 0 0" };