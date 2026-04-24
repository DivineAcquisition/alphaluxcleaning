import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface PaymentSucceededEmailProps {
  first_name: string;
  amount: string;
  service_type: string;
  service_date: string;
  receipt_link: string;
  referral_code: string;
  referral_link: string;
  app_url: string;
}

export const PaymentSucceededEmail = ({
  first_name,
  amount,
  service_type,
  service_date,
  receipt_link,
  referral_code,
  referral_link,
  app_url,
}: PaymentSucceededEmailProps) => (
  <EmailBase preview="Payment received - thank you!">
    <Heading style={h1}>
      💳 Payment Received!
    </Heading>
    
    <Text style={text}>
      Hi {first_name}, thank you for your payment! Your {service_type} cleaning 
      for {service_date} is all set.
    </Text>

    <Section style={paymentSection}>
      <Text style={paymentTitle}>✅ Payment Summary</Text>
      <Text style={amountText}>${amount}</Text>
      <Text style={paymentSubtext}>
        Processed successfully • {new Date().toLocaleDateString()}
      </Text>
    </Section>

    <Section style={receiptSection}>
      <ActionButton href={receipt_link}>
        📄 View Receipt
      </ActionButton>
    </Section>

    <Section style={referralSection}>
      <Heading as="h3" style={h3}>
        🎁 Earn $25 for Each Referral
      </Heading>
      <Text style={referralText}>
        Love our service? Share the joy! Your friends get $25 off their 
        first cleaning, and you earn $25 for each successful referral.
      </Text>
      
      <div style={referralBox}>
        <Text style={referralCodeTitle}>Your Referral Code:</Text>
        <Text style={referralCodeText}>{referral_code}</Text>
      </div>

      <div style={buttonRow}>
        <ActionButton href={referral_link} style={referralButton}>
          Share Your Code
        </ActionButton>
        <ActionButton href={`${app_url}/referral`} style={secondaryButton}>
          Track Referrals
        </ActionButton>
      </div>
    </Section>

    <Section style={nextStepsSection}>
      <Text style={nextStepsTitle}>📅 What's Next:</Text>
      <ul style={list}>
        <li style={listItem}>You'll receive a reminder 24 hours before your service</li>
        <li style={listItem}>Another reminder 2 hours before we arrive</li>
        <li style={listItem}>Our team will bring all supplies and equipment</li>
        <li style={listItem}>Typical cleaning time: 1-3 hours depending on home size</li>
      </ul>
    </Section>

    <Text style={thanksText}>
      Thank you for choosing AlphaLuxClean! We can't wait to make your home sparkle. ✨
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
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const paymentSection = {
  backgroundColor: "#e8f5e8",
  padding: "32px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #4caf50",
  margin: "24px 0",
};

const paymentTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1B314B",
  margin: "0 0 16px 0",
};

const amountText = {
  fontSize: "36px",
  fontWeight: "bold",
  color: "#4caf50",
  margin: "0 0 8px 0",
};

const paymentSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const receiptSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const referralSection = {
  backgroundColor: "#EFF7FE",
  padding: "32px",
  borderRadius: "8px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const referralText = {
  fontSize: "16px",
  color: "#1B314B",
  margin: "0 0 24px 0",
  lineHeight: "1.6",
};

const referralBox = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  border: "2px solid #0F77CC",
  margin: "0 0 24px 0",
};

const referralCodeTitle = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 8px 0",
};

const referralCodeText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1B314B",
  fontFamily: "monospace",
  margin: "0",
};

const buttonRow = {
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const referralButton = {
  backgroundColor: "#4caf50",
  margin: "8px",
};

const secondaryButton = {
  backgroundColor: "transparent",
  border: "2px solid #0F77CC",
  color: "#1B314B",
  margin: "8px",
};

const nextStepsSection = {
  margin: "32px 0",
};

const nextStepsTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1B314B",
  margin: "0 0 16px 0",
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

const thanksText = {
  fontSize: "18px",
  color: "#1B314B",
  textAlign: "center" as const,
  fontWeight: "500",
  margin: "32px 0 0 0",
};