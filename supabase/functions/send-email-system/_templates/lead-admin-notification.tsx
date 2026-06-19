import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface LeadAdminNotificationEmailProps {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  promo_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  landing_page?: string;
  referrer?: string;
  message?: string;
  submitted_at?: string;
  app_url?: string;
}

const Row = ({ label, value }: { label: string; value?: string }) =>
  value
    ? (
      <tr>
        <td style={cellLabel}>{label}</td>
        <td style={cellValue}>{value}</td>
      </tr>
    )
    : null;

export const LeadAdminNotificationEmail = (props: LeadAdminNotificationEmailProps) => {
  const fullName = [props.first_name, props.last_name].filter(Boolean).join(" ") || "New lead";
  const location = [props.city, props.state, props.zip_code].filter(Boolean).join(", ");
  return (
    <EmailBase preview={`New lead: ${fullName}${location ? ` — ${location}` : ""}`}>
      <Heading style={h1}>🚀 New lead just came in</Heading>
      <Text style={text}>
        <strong>{fullName}</strong> filled out the entry form
        {props.submitted_at ? ` at ${props.submitted_at}` : ""}.
      </Text>

      <Section style={card}>
        <table style={table}>
          <tbody>
            <Row label="Name" value={fullName} />
            <Row label="Email" value={props.email} />
            <Row label="Phone" value={props.phone} />
            <Row label="Location" value={location} />
            <Row label="Promo code" value={props.promo_code} />
            <Row label="Message" value={props.message} />
            <Row label="UTM source" value={props.utm_source} />
            <Row label="UTM medium" value={props.utm_medium} />
            <Row label="UTM campaign" value={props.utm_campaign} />
            <Row label="UTM content / ad" value={props.utm_content} />
            <Row label="Landing page" value={props.landing_page} />
            <Row label="Referrer" value={props.referrer} />
          </tbody>
        </table>
      </Section>

      {props.phone && (
        <Section style={ctaSection}>
          <ActionButton href={`tel:${props.phone}`}>Call {props.first_name || "lead"} now</ActionButton>
        </Section>
      )}

      <Text style={smallText}>
        Speed-to-lead matters — the contact has already been pushed to GoHighLevel.
        Follow up fast.
      </Text>
    </EmailBase>
  );
};

const h1 = {
  color: "#1B314B",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const card = {
  backgroundColor: "#F8F8F7",
  padding: "16px 20px",
  borderRadius: "10px",
  border: "1px solid #DBE3EC",
  margin: "16px 0",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const cellLabel = {
  padding: "8px 0",
  fontSize: "13px",
  color: "#5B6B80",
  borderBottom: "1px solid #DBE3EC",
  verticalAlign: "top",
  width: "38%",
};

const cellValue = {
  padding: "8px 0",
  fontSize: "13px",
  color: "#1B314B",
  borderBottom: "1px solid #DBE3EC",
  fontWeight: "500",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const smallText = {
  fontSize: "13px",
  color: "#999",
  margin: "12px 0 0 0",
};
