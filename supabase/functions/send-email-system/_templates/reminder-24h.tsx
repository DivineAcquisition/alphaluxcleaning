import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface Reminder24hEmailProps {
  first_name?: string;
  customer_name?: string;
  service_type?: string;
  service_date?: string;
  time_window?: string;
  address_line1?: string;
  address?: string;
  city?: string;
  state?: string;
  manage_link?: string;
  support_phone?: string;
  special_instructions?: string;
}

export const Reminder24hEmail = (props: Reminder24hEmailProps) => {
  const firstName = props.first_name || props.customer_name || "there";
  const service = props.service_type || "cleaning";
  const date = props.service_date || "your scheduled date";
  const window = props.time_window || "your arrival window";
  const street = props.address_line1 || props.address || "";
  const loc = [street, props.city, props.state].filter(Boolean).join(", ");
  const support = props.support_phone || "(551) 239-9444";
  const manage = props.manage_link || "https://alphaluxcleaning.com";

  return (
    <EmailBase
      preview={`Reminder: Your AlphaLux cleaning is tomorrow at ${window}`}
      title="See you tomorrow"
      subtitle={`${firstName}, your crew is on the calendar.`}
    >
      <Text style={text}>
        Just a reminder that your {service} is scheduled for tomorrow, {date},{" "}
        between {window}.
      </Text>

      <Section style={detailsSection}>
        <Heading as="h3" style={h3}>Service details</Heading>
        <Text style={detailText}>
          <strong>Service:</strong> {service}<br />
          <strong>Date &amp; time:</strong> {date} ({window})<br />
          {loc && (<><strong>Address:</strong> {loc}<br /></>)}
        </Text>
        {props.special_instructions && (
          <Text style={detailText}>
            <strong>Your notes:</strong> {props.special_instructions}
          </Text>
        )}
      </Section>

      <Section style={preparationSection}>
        <Heading as="h3" style={h3}>Quick prep</Heading>
        <ul style={list}>
          <li style={listItem}>Clear surfaces of personal items</li>
          <li style={listItem}>Put away valuables and breakables</li>
          <li style={listItem}>Ensure access to all cleaning areas</li>
          <li style={listItem}>Secure pets in a comfortable space</li>
        </ul>
      </Section>

      <Section style={contactSection}>
        <Text style={contactTitle}>Need to make a change?</Text>
        <ActionButton href={manage} style={primaryButton}>
          Manage your booking
        </ActionButton>
        <ActionButton href={`tel:${support.replace(/[^\d+]/g, "")}`} style={secondaryButton}>
          Call {support}
        </ActionButton>
      </Section>

      <Text style={footerText}>
        Looking forward to making your home sparkle.
      </Text>
    </EmailBase>
  );
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

const primaryButton = {
  margin: "8px",
};

const secondaryButton = {
  backgroundColor: "transparent",
  border: "2px solid #0F77CC",
  color: "#1B314B",
  margin: "8px",
};

const footerText = {
  fontSize: "16px",
  color: "#1B314B",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
  fontWeight: "500",
};
