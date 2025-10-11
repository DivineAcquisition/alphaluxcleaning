import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface RecurringServiceCancelledEmailProps {
  first_name: string;
  service_type: string;
  total_saved: number;
  services_completed: number;
  app_url: string;
}

export const RecurringServiceCancelledEmail = ({ 
  first_name, 
  service_type,
  total_saved,
  services_completed,
  app_url 
}: RecurringServiceCancelledEmailProps) => (
  <EmailBase preview="We're sorry to see you go">
    <Heading style={h1}>Sorry to See You Go, {first_name}</Heading>
    <Text style={text}>
      Your {service_type} recurring service has been cancelled.
    </Text>
    <Text style={text}>
      During your time with us, you completed {services_completed} service{services_completed !== 1 ? 's' : ''} and 
      saved ${total_saved.toFixed(2)}!
    </Text>
    <Text style={text}>
      We'd love to have you back anytime. As a thank you, here's 10% off your next booking.
    </Text>
    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/?promo=WELCOME_BACK10`}>
        Book Again →
      </ActionButton>
    </Section>
    <Text style={feedback}>
      We'd appreciate your feedback on how we can improve.
    </Text>
  </EmailBase>
);

const h1 = { color: "#1A1A1A", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1A1A1A", fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px 0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };
const feedback = { color: "#666", fontSize: "14px", fontStyle: "italic", margin: "24px 0 0 0" };