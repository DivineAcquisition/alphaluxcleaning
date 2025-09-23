import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton, OrderSummary } from "./email-base.tsx";

interface RescheduledEmailProps {
  first_name: string;
  service_type: string;
  service_date: string;
  time_window: string;
  manage_link: string;
  [key: string]: any;
}

export const RescheduledEmail = (props: RescheduledEmailProps) => (
  <EmailBase preview={`Your cleaning has been moved to ${props.service_date}`}>
    <Heading style={h1}>
      ✅ Rescheduled, {props.first_name}!
    </Heading>
    
    <Text style={text}>
      Your cleaning has been successfully updated. Here are your new 
      service details:
    </Text>

    <Section style={updateSection}>
      <Text style={updateTitle}>📅 New Schedule</Text>
      <Text style={updateDetails}>
        <strong>{props.service_type} Cleaning</strong><br />
        {props.service_date} • {props.time_window}
      </Text>
    </Section>

    <OrderSummary booking={props} />

    <Section style={confirmationSection}>
      <Text style={confirmationText}>
        🎯 <strong>All set!</strong> Our team has been notified of the change 
        and will arrive at your new scheduled time.
      </Text>
    </Section>

    <Section style={ctaSection}>
      <ActionButton href={props.manage_link}>
        Manage Booking
      </ActionButton>
    </Section>

    <Section style={reminderSection}>
      <Text style={reminderTitle}>📱 What's next:</Text>
      <ul style={list}>
        <li style={listItem}>You'll receive a reminder 24 hours before your service</li>
        <li style={listItem}>Another reminder 2 hours before we arrive</li>
        <li style={listItem}>Need to change again? Use the manage link above</li>
      </ul>
    </Section>

    <Text style={footerText}>
      Thanks for choosing AlphaLuxClean! We're flexible because life happens. 😊
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

const updateSection = {
  backgroundColor: "#e8f5e8",
  padding: "24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #4caf50",
  margin: "24px 0",
};

const updateTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 12px 0",
};

const updateDetails = {
  fontSize: "18px",
  color: "#1A1A1A",
  margin: "0",
  lineHeight: "1.4",
};

const confirmationSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const confirmationText = {
  fontSize: "16px",
  color: "#1A1A1A",
  margin: "0",
  lineHeight: "1.6",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const reminderSection = {
  margin: "24px 0",
};

const reminderTitle = {
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
  fontSize: "14px",
  color: "#1A1A1A",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const footerText = {
  fontSize: "16px",
  color: "#1A1A1A",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};