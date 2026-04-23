import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface Reminder2hEmailProps {
  first_name: string;
  service_type: string;
  time_window: string;
  support_phone: string;
  address_line1: string;
}

export const Reminder2hEmail = ({
  first_name,
  service_type,
  time_window,
  support_phone,
  address_line1,
}: Reminder2hEmailProps) => (
  <EmailBase preview={`We're on our way! Arriving ${time_window} today`}>
    <Heading style={h1}>
      We're on for today! 🚐
    </Heading>
    
    <Text style={text}>
      Hi {first_name}, our team is preparing for your {service_type} cleaning 
      and will arrive at {address_line1} between {time_window}.
    </Text>

    <Section style={statusSection}>
      <Text style={statusTitle}>📍 Team Status: En Route</Text>
      <Text style={statusText}>
        Arriving between <strong>{time_window}</strong>
      </Text>
    </Section>

    <Section style={quickTipsSection}>
      <Text style={tipsTitle}>Last-minute reminders:</Text>
      <ul style={list}>
        <li style={listItem}>🔑 Ensure someone is home or access is available</li>
        <li style={listItem}>🐕 Secure pets in a safe area</li>
        <li style={listItem}>💼 Put away any valuables or personal items</li>
      </ul>
    </Section>

    <Section style={contactSection}>
      <Text style={contactText}>
        Need to reach our team directly?
      </Text>
      <ActionButton href={`tel:${support_phone}`} style={phoneButton}>
        📞 Call {support_phone}
      </ActionButton>
    </Section>

    <Text style={footerText}>
      Thanks for choosing AlphaLuxClean! ✨
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

const statusSection = {
  backgroundColor: "#e8f5e8",
  padding: "24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #4caf50",
  margin: "24px 0",
};

const statusTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
};

const statusText = {
  fontSize: "16px",
  color: "#1A1A1A",
  margin: "0",
};

const quickTipsSection = {
  margin: "24px 0",
};

const tipsTitle = {
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
  fontSize: "15px",
  color: "#1A1A1A",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const contactSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "8px",
};

const contactText = {
  fontSize: "16px",
  color: "#1A1A1A",
  margin: "0 0 20px 0",
  fontWeight: "500",
};

const phoneButton = {
  backgroundColor: "#4caf50",
  fontSize: "18px",
  padding: "16px 32px",
};

const footerText = {
  fontSize: "16px",
  color: "#1A1A1A",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
  fontWeight: "500",
};