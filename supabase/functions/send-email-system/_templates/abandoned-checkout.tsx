import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface AbandonedCheckoutEmailProps {
  first_name: string;
  booking_id: string;
  app_url: string;
  service_type: string;
  service_date: string;
  time_window: string;
  price_final: number;
}

export const AbandonedCheckoutEmail = ({
  first_name,
  booking_id,
  app_url,
  service_type,
  service_date,
  time_window,
  price_final,
}: AbandonedCheckoutEmailProps) => (
  <EmailBase preview="Your cleaning time slot is still available" isMarketing>
    <Heading style={h1}>
      Still interested, {first_name}?
    </Heading>
    
    <Text style={text}>
      Your {service_type} cleaning for {service_date} ({time_window}) is still 
      available, but time slots are filling up fast.
    </Text>

    <Section style={offerSection}>
      <Text style={offerTitle}>🔒 Your price is locked:</Text>
      <Text style={priceText}>${price_final}</Text>
      <Text style={offerSubtext}>Valid for the next 24 hours</Text>
    </Section>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/checkout?booking=${booking_id}`}>
        Complete My Booking Now
      </ActionButton>
    </Section>

    <Section style={socialProofSection}>
      <Text style={socialProofTitle}>
        ⭐⭐⭐⭐⭐ Join 1,000+ happy customers
      </Text>
      <Text style={testimonial}>
        "Best cleaning service in Dallas! They're always on time and do an 
        incredible job. My house has never looked better." - Sarah M.
      </Text>
    </Section>

    <Section style={reassuranceSection}>
      <Text style={reassuranceTitle}>Why choose AlphaLux Cleaning:</Text>
      <div style={reassuranceGrid}>
        <div style={reassuranceItem}>
          <Text style={reassuranceEmoji}>🛡️</Text>
          <Text style={reassuranceText}>Fully bonded & insured</Text>
        </div>
        <div style={reassuranceItem}>
          <Text style={reassuranceEmoji}>⚡</Text>
          <Text style={reassuranceText}>Same-day booking available</Text>
        </div>
        <div style={reassuranceItem}>
          <Text style={reassuranceEmoji}>💯</Text>
          <Text style={reassuranceText}>100% satisfaction guarantee</Text>
        </div>
        <div style={reassuranceItem}>
          <Text style={reassuranceEmoji}>🕐</Text>
          <Text style={reassuranceText}>2-hour arrival windows</Text>
        </div>
      </div>
    </Section>

    <Text style={urgencyText}>
      ⚠️ Only a few {time_window} slots left for {service_date}
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

const offerSection = {
  backgroundColor: "#fff8e1",
  padding: "24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #ECC98B",
  margin: "24px 0",
};

const offerTitle = {
  fontSize: "18px",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
  fontWeight: "bold",
};

const priceText = {
  fontSize: "36px",
  color: "#1A1A1A",
  fontWeight: "bold",
  margin: "8px 0",
};

const offerSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const socialProofSection = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "8px",
  margin: "32px 0",
};

const socialProofTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const testimonial = {
  fontSize: "16px",
  color: "#666",
  fontStyle: "italic",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};

const reassuranceSection = {
  margin: "32px 0",
};

const reassuranceTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const reassuranceGrid = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "16px",
  justifyContent: "center",
};

const reassuranceItem = {
  textAlign: "center" as const,
  flex: "1",
  minWidth: "120px",
  maxWidth: "140px",
};

const reassuranceEmoji = {
  fontSize: "24px",
  margin: "0 0 8px 0",
};

const reassuranceText = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
  lineHeight: "1.4",
};

const urgencyText = {
  fontSize: "16px",
  color: "#d73027",
  textAlign: "center" as const,
  fontWeight: "bold",
  backgroundColor: "#ffeaea",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #d73027",
  margin: "24px 0",
};