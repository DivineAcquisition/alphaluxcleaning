import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface RecurringServiceResumedEmailProps {
  first_name: string;
  service_type: string;
  next_service_date: string;
  app_url: string;
}

export const RecurringServiceResumedEmail = ({ 
  first_name, 
  service_type, 
  next_service_date,
  app_url 
}: RecurringServiceResumedEmailProps) => (
  <EmailBase preview="Welcome back! Your service is active">
    <Heading style={h1}>Welcome Back, {first_name}! 🎉</Heading>
    <Text style={text}>
      Your {service_type} recurring service is now active again.
    </Text>
    <Text style={text}>
      Your next scheduled clean is on {new Date(next_service_date).toLocaleDateString()}.
    </Text>
    <Text style={text}>
      We're excited to keep your space spotless!
    </Text>
    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/recurring-services`}>
        View Schedule →
      </ActionButton>
    </Section>
  </EmailBase>
);

const h1 = { color: "#1B314B", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1B314B", fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px 0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };