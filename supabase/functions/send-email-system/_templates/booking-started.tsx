import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface BookingStartedEmailProps {
  first_name: string;
  booking_id: string;
  app_url: string;
  service_type: string;
  price_final: number;
}

export const BookingStartedEmail = ({
  first_name,
  booking_id,
  app_url,
  service_type,
  price_final,
}: BookingStartedEmailProps) => (
  <EmailBase preview="Complete your cleaning booking in just one click">
    <Heading style={h1}>
      Almost there, {first_name}! 
    </Heading>
    
    <Text style={text}>
      Your {service_type} cleaning quote is ready. Just one more click to secure 
      your time slot and get your home sparkling clean.
    </Text>

    <Section style={highlightSection}>
      <Text style={highlightText}>
        💰 Your price: <strong>${price_final}</strong>
      </Text>
      <Text style={highlightSubtext}>
        Locked in for the next 30 minutes
      </Text>
    </Section>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/checkout?booking=${booking_id}`}>
        Complete My Booking →
      </ActionButton>
    </Section>

    <Section style={benefitsSection}>
      <Text style={benefitTitle}>What happens next:</Text>
      <ul style={list}>
        <li style={listItem}>✅ Instant confirmation</li>
        <li style={listItem}>📅 Calendar reminder sent</li>
        <li style={listItem}>🧹 Professional team arrives on time</li>
        <li style={listItem}>💯 Satisfaction guaranteed</li>
      </ul>
    </Section>

    <Text style={urgencyText}>
      ⏰ Your time slot is popular! Complete your booking now to avoid disappointment.
    </Text>
  </EmailBase>
);

const h1 = {
  color: "#1A1A1A",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
};

const text = {
  color: "#1A1A1A",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const highlightSection = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const highlightText = {
  fontSize: "24px",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
};

const highlightSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const benefitsSection = {
  margin: "32px 0",
};

const benefitTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 16px 0",
};

const list = {
  margin: "0",
  paddingLeft: "20px",
};

const listItem = {
  fontSize: "16px",
  color: "#1A1A1A",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const urgencyText = {
  fontSize: "16px",
  color: "#ECC98B",
  textAlign: "center" as const,
  fontWeight: "bold",
  backgroundColor: "#fff8e1",
  padding: "16px",
  borderRadius: "8px",
  margin: "24px 0",
};