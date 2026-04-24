import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface PaymentFailedEmailProps {
  first_name: string;
  service_date: string;
  app_url: string;
}

export const PaymentFailedEmail = ({ first_name, service_date, app_url }: PaymentFailedEmailProps) => (
  <EmailBase preview="Action needed: update your payment method">
    <Heading style={h1}>⚠️ Payment Issue</Heading>
    <Text style={text}>Hi {first_name}, we couldn't process your payment for your {service_date} cleaning.</Text>
    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/update-payment`}>Update Payment Method</ActionButton>
    </Section>
  </EmailBase>
);

const h1 = { color: "#1B314B", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1B314B", fontSize: "16px", lineHeight: "1.6", margin: "0 0 24px 0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };