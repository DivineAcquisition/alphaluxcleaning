import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface ReferralWelcomeCreditEmailProps {
  first_name: string;
  amount: string;
  referrer_name: string;
  app_url: string;
}

export const ReferralWelcomeCreditEmail = ({
  first_name,
  amount,
  referrer_name,
  app_url,
}: ReferralWelcomeCreditEmailProps) => (
  <EmailBase preview={`Welcome! ${amount} credit applied to your account`}>
    <Heading style={h1}>
      Welcome to AlphaLux Cleaning, {first_name}! 🏠
    </Heading>
    
    <Text style={text}>
      Thanks to {referrer_name}'s referral, you've received a special welcome 
      credit on your AlphaLux Cleaning account!
    </Text>

    <Section style={creditSection}>
      <Text style={creditTitle}>🎁 Your Welcome Credit</Text>
      <Text style={amountText}>{amount}</Text>
      <Text style={creditSubtext}>
        Applied to your account
      </Text>
    </Section>

    <Text style={text}>
      This credit has been automatically applied and will be used toward your 
      future cleaning services. Welcome to the AlphaLux Cleaning family!
    </Text>

    <Section style={benefitsSection}>
      <Text style={benefitsTitle}>What you can expect:</Text>
      <ul style={list}>
        <li style={listItem}>✨ Professional, bonded & insured cleaning teams</li>
        <li style={listItem}>⚡ Convenient online booking and scheduling</li>
        <li style={listItem}>💯 100% satisfaction guarantee</li>
        <li style={listItem}>📱 Easy rescheduling and communication</li>
        <li style={listItem}>🔄 Flexible recurring service options</li>
      </ul>
    </Section>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/account`}>
        View My Account →
      </ActionButton>
    </Section>

    <Section style={referralSection}>
      <Text style={referralTitle}>💰 Start earning too!</Text>
      <Text style={referralText}>
        Love your clean? You can earn {amount} for every friend you refer to 
        AlphaLux Cleaning. Check your account to get your personal referral link!
      </Text>
    </Section>

    <Text style={footerText}>
      We're excited to make your home sparkle! ✨
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

const creditSection = {
  backgroundColor: "#fff8e1",
  padding: "32px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #ECC98B",
  margin: "24px 0",
};

const creditTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 16px 0",
};

const amountText = {
  fontSize: "36px",
  fontWeight: "bold",
  color: "#ECC98B",
  margin: "0 0 8px 0",
};

const creditSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const benefitsSection = {
  margin: "24px 0",
};

const benefitsTitle = {
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

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const referralSection = {
  backgroundColor: "#f0f8f0",
  padding: "24px",
  borderRadius: "8px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const referralTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 12px 0",
};

const referralText = {
  fontSize: "14px",
  color: "#1A1A1A",
  margin: "0",
  lineHeight: "1.5",
};

const footerText = {
  fontSize: "16px",
  color: "#1A1A1A",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};