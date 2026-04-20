import {
  Heading,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface BookingConfirmedEmailProps {
  first_name?: string;
  customer_name?: string;
  booking_id?: string;
  booking_short_id?: string;
  service_type: string;
  service_date: string;
  time_window: string;
  address?: string;
  total_amount?: string | number;
  deposit_paid?: string | number;
  balance_due?: string | number;
  manage_link?: string;
  manage_url?: string;
  receipt_link?: string;
  mrr_est?: number;
  arr_est?: number;
  app_url?: string;
  support_phone?: string;
  [key: string]: any;
}

const money = (v?: string | number) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return undefined;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export const BookingConfirmedEmail = (props: BookingConfirmedEmailProps) => {
  const manageUrl =
    props.manage_link ||
    props.manage_url ||
    `${props.app_url || "https://alphaluxcleaning.com"}/order-status`;
  const receiptUrl =
    props.receipt_link ||
    (props.booking_id
      ? `${props.app_url || "https://alphaluxcleaning.com"}/order-status?booking=${props.booking_id}`
      : manageUrl);

  const total = money(props.total_amount);
  const deposit = money(props.deposit_paid);
  const balance = money(props.balance_due);

  return (
    <EmailBase
      preview={`Your ${props.service_type} is confirmed for ${props.service_date} · AlphaLux Cleaning receipt`}
    >
      <Section style={heroBadge}>
        <Text style={heroBadgeText}>✓ BOOKING CONFIRMED</Text>
      </Section>

      <Heading style={h1}>
        You're all set{props.first_name ? `, ${props.first_name}` : ""}.
      </Heading>

      <Text style={lead}>
        Thank you for choosing AlphaLux Cleaning. Your service is confirmed and
        this email doubles as your receipt. Our team will arrive during your
        scheduled window with every supply and tool we need.
      </Text>

      {/* Service Summary Card */}
      <Section style={summaryCard}>
        <Heading as="h2" style={cardHeading}>
          Service Details
        </Heading>

        {props.booking_short_id && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Booking ID</Column>
            <Column style={detailValue}>#{props.booking_short_id}</Column>
          </Row>
        )}

        <Row style={detailRow}>
          <Column style={detailLabel}>Service</Column>
          <Column style={detailValue}>{props.service_type}</Column>
        </Row>

        <Row style={detailRow}>
          <Column style={detailLabel}>Date</Column>
          <Column style={detailValue}>{props.service_date}</Column>
        </Row>

        <Row style={detailRow}>
          <Column style={detailLabel}>Time Window</Column>
          <Column style={detailValue}>{props.time_window}</Column>
        </Row>

        {props.address && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Address</Column>
            <Column style={detailValue}>{props.address}</Column>
          </Row>
        )}
      </Section>

      {/* Receipt / Payment Card */}
      {(total || deposit || balance) && (
        <Section style={receiptCard}>
          <Heading as="h2" style={cardHeading}>
            Receipt
          </Heading>

          {total && (
            <Row style={detailRow}>
              <Column style={detailLabel}>Total Service</Column>
              <Column style={detailValue}>{total}</Column>
            </Row>
          )}

          {deposit && (
            <Row style={detailRow}>
              <Column style={detailLabel}>Paid Today (Deposit)</Column>
              <Column style={{ ...detailValue, color: "#A17938" }}>
                {deposit}
              </Column>
            </Row>
          )}

          {balance && (
            <>
              <Hr style={dividerGold} />
              <Row style={totalRowStyle}>
                <Column style={totalLabel}>Balance Due After Service</Column>
                <Column style={totalValue}>{balance}</Column>
              </Row>
            </>
          )}

          <Text style={receiptNote}>
            Keep this email for your records. A separate payment receipt will
            follow once the final charge is processed.
          </Text>
        </Section>
      )}

      <Section style={buttonSection}>
        <ActionButton href={manageUrl}>Manage Booking</ActionButton>
        <ActionButton href={receiptUrl} style={secondaryButton}>
          View Receipt
        </ActionButton>
      </Section>

      {/* Prep tips */}
      <Section style={preparationSection}>
        <Heading as="h3" style={h3}>
          How to prepare for your cleaning
        </Heading>
        <ul style={list}>
          <li style={listItem}>
            Clear countertops and surfaces of personal items
          </li>
          <li style={listItem}>Put away valuables and fragile items</li>
          <li style={listItem}>
            Ensure easy access to all areas to be cleaned
          </li>
          <li style={listItem}>Secure pets in a comfortable area</li>
        </ul>
      </Section>

      {(props.mrr_est ?? 0) > 0 && (
        <Section style={recurringNote}>
          <Text style={smallText}>
            💡 <strong>Recurring estimate:</strong> ${props.mrr_est}/mo (ARR $
            {props.arr_est}) if you activate a recurring plan and save up to
            15%!
          </Text>
        </Section>
      )}

      <Text style={supportText}>
        Questions? Call us at{" "}
        <strong>{props.support_phone || "(857) 754-4557"}</strong> or reply to
        this email and our team will jump in.
      </Text>
    </EmailBase>
  );
};

/* Styles */

const heroBadge: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 18px 0",
};

const heroBadgeText: React.CSSProperties = {
  display: "inline-block",
  background:
    "linear-gradient(135deg, #F6DFA8 0%, #ECC98B 45%, #A17938 100%)",
  color: "#0A0A0B",
  borderRadius: "999px",
  padding: "6px 16px",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.18em",
  margin: 0,
};

const h1: React.CSSProperties = {
  color: "#15120F",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.2,
  margin: "0 0 12px 0",
};

const lead: React.CSSProperties = {
  color: "#1A1410",
  fontSize: "16px",
  lineHeight: 1.6,
  margin: "0 0 24px 0",
};

const h3: React.CSSProperties = {
  color: "#15120F",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 12px 0",
};

const summaryCard: React.CSSProperties = {
  backgroundColor: "#FCFBF7",
  border: "1px solid #F0E9D6",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "0 0 20px 0",
};

const receiptCard: React.CSSProperties = {
  backgroundColor: "#0A0A0B",
  border: "1px solid #A17938",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px 0",
  color: "#F6DFA8",
};

const cardHeading: React.CSSProperties = {
  color: "inherit",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 12px 0",
  borderBottom: "1px solid rgba(161, 121, 56, 0.4)",
  paddingBottom: "6px",
};

const detailRow: React.CSSProperties = {
  paddingTop: "8px",
  paddingBottom: "8px",
};

const detailLabel: React.CSSProperties = {
  width: "45%",
  fontSize: "14px",
  color: "inherit",
  opacity: 0.75,
  paddingRight: "12px",
  verticalAlign: "top" as const,
};

const detailValue: React.CSSProperties = {
  width: "55%",
  fontSize: "14px",
  color: "inherit",
  fontWeight: 600,
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const dividerGold: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid #A17938",
  margin: "14px 0 10px 0",
};

const totalRowStyle: React.CSSProperties = {
  paddingTop: "6px",
};

const totalLabel: React.CSSProperties = {
  ...detailLabel,
  fontWeight: 700,
  opacity: 1,
  fontSize: "15px",
};

const totalValue: React.CSSProperties = {
  ...detailValue,
  color: "#ECC98B",
  fontSize: "18px",
};

const receiptNote: React.CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: "12px",
  color: "rgba(246, 223, 168, 0.7)",
  lineHeight: 1.5,
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0 8px 0",
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid #A17938",
  color: "#15120F",
  boxShadow: "none",
  marginLeft: "10px",
};

const preparationSection: React.CSSProperties = {
  backgroundColor: "#FCFBF7",
  padding: "20px 24px",
  borderRadius: "12px",
  border: "1px solid #F0E9D6",
  margin: "24px 0",
};

const list: React.CSSProperties = {
  margin: "0",
  paddingLeft: "20px",
};

const listItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#1A1410",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const recurringNote: React.CSSProperties = {
  backgroundColor: "#fff8e1",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #ECC98B",
  margin: "24px 0",
};

const smallText: React.CSSProperties = {
  fontSize: "14px",
  color: "#1A1410",
  margin: "0",
  lineHeight: "1.5",
};

const supportText: React.CSSProperties = {
  fontSize: "14px",
  color: "#5a5348",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};
