import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface Reminder2hEmailProps {
  first_name?: string;
  customer_name?: string;
  service_type?: string;
  time_window?: string;
  support_phone?: string;
  address_line1?: string;
  address?: string;
}

export const Reminder2hEmail = (props: Reminder2hEmailProps) => {
  const firstName = props.first_name || props.customer_name || "there";
  const service = props.service_type || "cleaning";
  const window = props.time_window || "your arrival window";
  const address = props.address_line1 || props.address || "your home";
  const support = props.support_phone || "(551) 239-9444";

  return (
    <EmailBase
      preview={`We're on our way — arriving ${window} today`}
      title="We're on for today"
      subtitle={`${firstName}, the crew is heading over.`}
    >
      <Text style={text}>
        Our team is preparing for your {service} and will arrive at {address}{" "}
        between {window}.
      </Text>

      <Section style={statusSection}>
        <Text style={statusTitle}>Team status</Text>
        <Text style={statusText}>
          Arriving between <strong>{window}</strong>
        </Text>
      </Section>

      <Section style={quickTipsSection}>
        <Heading as="h3" style={h3}>Last-minute reminders</Heading>
        <ul style={list}>
          <li style={listItem}>Ensure someone is home or access is available</li>
          <li style={listItem}>Secure pets in a safe area</li>
          <li style={listItem}>Put away valuables or personal items</li>
        </ul>
      </Section>

      <Section style={contactSection}>
        <Text style={contactText}>Need to reach the team?</Text>
        <ActionButton href={`tel:${support.replace(/[^\d+]/g, "")}`} style={phoneButton}>
          Call {support}
        </ActionButton>
      </Section>

      <Text style={footerText}>
        Thanks for choosing AlphaLux Clean.
      </Text>
    </EmailBase>
  );
};

const h3 = {
  color: "#1B314B",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const statusSection = {
  backgroundColor: "#EFF7FE",
  padding: "24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #0F77CC",
  margin: "24px 0",
};

const statusTitle = {
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#0F77CC",
  margin: "0 0 8px 0",
};

const statusText = {
  fontSize: "16px",
  color: "#1B314B",
  margin: "0",
};

const quickTipsSection = {
  margin: "24px 0",
};

const list = {
  margin: "0",
  paddingLeft: "20px",
};

const listItem = {
  fontSize: "15px",
  color: "#1B314B",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const contactSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  backgroundColor: "#F8F8F7",
  padding: "24px",
  borderRadius: "8px",
};

const contactText = {
  fontSize: "16px",
  color: "#1B314B",
  margin: "0 0 20px 0",
  fontWeight: "500",
};

const phoneButton = {
  fontSize: "18px",
  padding: "16px 32px",
};

const footerText = {
  fontSize: "16px",
  color: "#1B314B",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
  fontWeight: "500",
};
