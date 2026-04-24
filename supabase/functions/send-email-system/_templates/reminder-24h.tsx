import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface Reminder24hEmailProps {
  first_name: string;
  service_type: string;
  service_date: string;
  time_window: string;
  address_line1: string;
  city: string;
  state: string;
  manage_link: string;
  support_phone: string;
  special_instructions?: string;
}

export const Reminder24hEmail = ({
  first_name,
  service_type,
  service_date,
  time_window,
  address_line1,
  city,
  state,
  manage_link,
  support_phone,
  special_instructions,
}: Reminder24hEmailProps) => (
  <EmailBase preview={`Reminder: Your cleaning is tomorrow at ${time_window}`}>
    <Heading style={h1}>
      See you tomorrow, {first_name}! 
    </Heading>
    
    <Text style={text}>
      Just a friendly reminder that your {service_type} cleaning is scheduled 
      for tomorrow, {service_date} between {time_window}.
    </Text>

    <Section style={detailsSection}>
      <Heading as="h3" style={h3}>📅 Service Details</Heading>
      <Text style={detailText}>
        <strong>Service:</strong> {service_type}<br />
        <strong>Date & Time:</strong> {service_date} ({time_window})<br />
        <strong>Address:</strong> {address_line1}, {city}, {state}
      </Text>
      
      {special_instructions && (
        <Text style={detailText}>
          <strong>Your notes:</strong> {special_instructions}
        </Text>
      )}
    </Section>

    <Section style={preparationSection}>
      <Heading as="h3" style={h3}>✅ Quick prep checklist:</Heading>
      <ul style={list}>
        <li style={listItem}>Clear surfaces of personal items</li>
        <li style={listItem}>Put away valuables and breakables</li>
        <li style={listItem}>Ensure access to all cleaning areas</li>
        <li style={listItem}>Secure pets in a comfortable space</li>
        <li style={listItem}>Leave any special instructions in a visible spot</li>
      </ul>
    </Section>

    <Section style={contactSection}>
      <Text style={contactTitle}>Need to make changes?</Text>
      <div style={buttonRow}>
        <ActionButton href={manage_link} style={primaryButton}>
          Reschedule or Add Notes
        </ActionButton>
        <ActionButton href={`tel:${support_phone}`} style={secondaryButton}>
          Call {support_phone}
        </ActionButton>
      </div>
    </Section>

    <Section style={teamSection}>
      <Text style={teamText}>
        🧹 Our professional team will arrive with all supplies and equipment. 
        We typically complete a {service_type.toLowerCase()} cleaning in 1-3 hours 
        depending on home size.
      </Text>
    </Section>

    <Text style={footerText}>
      Looking forward to making your home sparkle! ✨
    </Text>
  </EmailBase>
);

const h1 = {
  color: "#1B314B",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
};

const h3 = {
  color: "#1B314B",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const detailsSection = {
  backgroundColor: "#F8F8F7",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
};

const detailText = {
  fontSize: "14px",
  color: "#1B314B",
  margin: "0 0 12px 0",
  lineHeight: "1.6",
};

const preparationSection = {
  margin: "24px 0",
};

const list = {
  margin: "0",
  paddingLeft: "20px",
};

const listItem = {
  fontSize: "14px",
  color: "#1B314B",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const contactSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const contactTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1B314B",
  margin: "0 0 20px 0",
};

const buttonRow = {
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const primaryButton = {
  margin: "8px",
};

const secondaryButton = {
  backgroundColor: "transparent",
  border: "2px solid #0F77CC",
  color: "#1B314B",
  margin: "8px",
};

const teamSection = {
  backgroundColor: "#EFF7FE",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const teamText = {
  fontSize: "14px",
  color: "#1B314B",
  margin: "0",
  lineHeight: "1.6",
};

const footerText = {
  fontSize: "16px",
  color: "#1B314B",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
  fontWeight: "500",
};