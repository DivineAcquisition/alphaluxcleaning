import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton, OrderSummary } from "./email-base.tsx";

interface BookingConfirmedEmailProps {
  first_name: string;
  service_type: string;
  service_date: string;
  time_window: string;
  manage_link: string;
  receipt_link: string;
  mrr_est?: number;
  arr_est?: number;
  [key: string]: any;
}

export const BookingConfirmedEmail = (props: BookingConfirmedEmailProps) => (
  <EmailBase preview={`Your ${props.service_type} cleaning is confirmed for ${props.service_date}`}>
    <Heading style={h1}>
      🎉 You're all set, {props.first_name}!
    </Heading>
    
    <Text style={text}>
      Your cleaning is confirmed. Our professional team will arrive during your 
      scheduled time window with all supplies and equipment.
    </Text>

    <OrderSummary booking={props} />

    <Section style={buttonSection}>
      <ActionButton href={props.manage_link}>
        Manage Your Booking
      </ActionButton>
      <ActionButton href={props.receipt_link} style={secondaryButton}>
        View Receipt
      </ActionButton>
    </Section>

    <Section style={preparationSection}>
      <Heading as="h3" style={h3}>
        How to prepare for your cleaning:
      </Heading>
      <ul style={list}>
        <li style={listItem}>Clear countertops and surfaces of personal items</li>
        <li style={listItem}>Put away valuables and fragile items</li>
        <li style={listItem}>Ensure easy access to all areas to be cleaned</li>
        <li style={listItem}>Secure pets in a comfortable area</li>
      </ul>
    </Section>

    {(props.mrr_est > 0 || props.arr_est > 0) && (
      <Section style={recurringNote}>
        <Text style={smallText}>
          💡 <strong>Recurring estimate:</strong> ${props.mrr_est}/mo (ARR ${props.arr_est}) 
          if you activate a recurring plan and save up to 15%!
        </Text>
      </Section>
    )}

    <Text style={supportText}>
      Questions? Call us at <strong>{props.support_phone}</strong> or reply to this email.
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
  margin: "0 0 16px 0",
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const secondaryButton = {
  backgroundColor: "transparent",
  border: "2px solid #0F77CC",
  color: "#1B314B",
  marginLeft: "16px",
};

const preparationSection = {
  backgroundColor: "#F8F8F7",
  padding: "24px",
  borderRadius: "8px",
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

const recurringNote = {
  backgroundColor: "#EFF7FE",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #0F77CC",
  margin: "24px 0",
};

const smallText = {
  fontSize: "14px",
  color: "#1B314B",
  margin: "0",
  lineHeight: "1.5",
};

const supportText = {
  fontSize: "14px",
  color: "#666",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};