import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface RecurringUpsellEmailProps {
  first_name: string;
  booking_id: string;
  app_url: string;
}

export const RecurringUpsellEmail = ({ first_name, booking_id, app_url }: RecurringUpsellEmailProps) => (
  <EmailBase preview="Save up to 15% with recurring service" isMarketing>
    <Heading style={h1}>💡 Keep it spotless, {first_name}!</Heading>
    <Text style={text}>Turn today's clean into a regular routine and save up to 15%.</Text>
    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/start-recurring?booking=${booking_id}`}>
        Set Up Recurring Service →
      </ActionButton>
    </Section>
  </EmailBase>
);

const h1 = { color: "#1B314B", fontSize: "28px", fontWeight: "bold", margin: "0 0 24px 0" };
const text = { color: "#1B314B", fontSize: "16px", lineHeight: "1.6", margin: "0 0 24px 0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };