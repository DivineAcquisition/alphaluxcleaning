import { Heading, Text, Section, Hr } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface RecurringConfirmedEmailProps {
  first_name: string;
  frequency: string;
  price_per_service: string;
  discount_percentage: number;
  next_service_date: string;
  service_type: string;
  app_url: string;
}

export const RecurringConfirmedEmail = ({
  first_name,
  frequency,
  price_per_service,
  discount_percentage,
  next_service_date,
  service_type,
  app_url,
}: RecurringConfirmedEmailProps) => (
  <EmailBase preview="Your recurring service is confirmed! 🎉">
    <Heading style={h1}>🎉 You're all set, {first_name}!</Heading>
    
    <Text style={text}>
      Welcome to worry-free cleaning! Your recurring {service_type} cleaning service is now active.
    </Text>

    <Section style={highlightBox}>
      <Text style={highlightTitle}>Your Service Details</Text>
      <Text style={detailRow}>
        <strong>Frequency:</strong> {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Text>
      <Text style={detailRow}>
        <strong>Price per visit:</strong> ${price_per_service}
      </Text>
      <Text style={detailRow}>
        <strong>Your savings:</strong> {discount_percentage}% off every visit
      </Text>
      <Text style={detailRow}>
        <strong>Next service:</strong> {next_service_date}
      </Text>
    </Section>

    <Hr style={hr} />

    <Text style={sectionTitle}>What Happens Next?</Text>
    <Text style={text}>
      ✓ We'll automatically schedule your cleanings based on your chosen frequency<br />
      ✓ You'll receive a reminder 24 hours before each service<br />
      ✓ Your payment method will be charged on the day of service<br />
      ✓ You can skip, pause, or cancel anytime with no penalties
    </Text>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/recurring-services`}>
        Manage Your Service
      </ActionButton>
    </Section>

    <Hr style={hr} />

    <Text style={footerText}>
      <strong>Need to make changes?</strong><br />
      Visit your dashboard to pause, reschedule, or update your service preferences anytime.
    </Text>

    <Text style={footerText}>
      Questions? Just reply to this email and we'll be happy to help!
    </Text>
  </EmailBase>
);

const h1 = { color: "#1A1A1A", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1A1A1A", fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px 0" };
const sectionTitle = { color: "#1A1A1A", fontSize: "20px", fontWeight: "600", margin: "24px 0 16px 0" };
const highlightBox = { 
  backgroundColor: "#F0F9FF", 
  border: "2px solid #0EA5E9", 
  borderRadius: "8px", 
  padding: "20px",
  margin: "24px 0"
};
const highlightTitle = { 
  color: "#0EA5E9", 
  fontSize: "18px", 
  fontWeight: "bold", 
  margin: "0 0 12px 0" 
};
const detailRow = { 
  color: "#1A1A1A", 
  fontSize: "16px", 
  lineHeight: "1.8", 
  margin: "8px 0" 
};
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };
const hr = { borderColor: "#E5E7EB", margin: "24px 0" };
const footerText = { 
  color: "#6B7280", 
  fontSize: "14px", 
  lineHeight: "1.6", 
  margin: "16px 0" 
};
