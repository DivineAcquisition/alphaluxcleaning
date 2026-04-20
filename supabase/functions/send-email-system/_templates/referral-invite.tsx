import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface ReferralInviteEmailProps {
  first_name: string;
  referral_code: string;
  referral_link: string;
}

export const ReferralInviteEmail = ({
  first_name,
  referral_code,
  referral_link,
}: ReferralInviteEmailProps) => (
  <EmailBase preview={`Your referral code ${referral_code} is ready - earn $25!`} isMarketing>
    <Heading style={h1}>
      🎁 Give $25, Get $25!
    </Heading>
    
    <Text style={text}>
      Hi {first_name}! Ready to share the AlphaLux Cleaning experience? 
      Your friends get $25 off their first cleaning, and you earn $25 
      for each successful referral.
    </Text>

    <Section style={codeSection}>
      <Text style={codeTitle}>Your Personal Referral Code:</Text>
      <Text style={codeText}>{referral_code}</Text>
      <Text style={codeSubtext}>
        Share this code or use the link below
      </Text>
    </Section>

    <Section style={linkSection}>
      <Text style={linkTitle}>🔗 Your Referral Link:</Text>
      <div style={linkBox}>
        <Text style={linkText}>{referral_link}</Text>
      </div>
      <ActionButton href={referral_link}>
        Test Your Link →
      </ActionButton>
    </Section>

    <Section style={howItWorksSection}>
      <Heading as="h3" style={h3}>
        How it works:
      </Heading>
      <div style={stepGrid}>
        <div style={step}>
          <Text style={stepNumber}>1</Text>
          <Text style={stepTitle}>Share</Text>
          <Text style={stepText}>Send your code or link to friends & family</Text>
        </div>
        <div style={step}>
          <Text style={stepNumber}>2</Text>
          <Text style={stepTitle}>They Save</Text>
          <Text style={stepText}>They get $25 off their first cleaning</Text>
        </div>
        <div style={step}>
          <Text style={stepNumber}>3</Text>
          <Text style={stepTitle}>You Earn</Text>
          <Text style={stepText}>You receive $25 credit after their service</Text>
        </div>
      </div>
    </Section>

    <Section style={socialShareSection}>
      <Text style={socialTitle}>💬 Easy sharing ideas:</Text>
      <ul style={list}>
        <li style={listItem}>Text the link to your contacts</li>
        <li style={listItem}>Share on social media</li>
        <li style={listItem}>Email to friends and family</li>
        <li style={listItem}>Post in neighborhood groups</li>
        <li style={listItem}>Tell coworkers about it</li>
      </ul>
    </Section>

    <Section style={termsSection}>
      <Text style={termsText}>
        <strong>Terms:</strong> Referral credits are applied after the referred 
        customer's first cleaning is completed. Credits expire after 12 months. 
        Limit one referral credit per new customer.
      </Text>
    </Section>

    <Text style={footerText}>
      Start earning today! There's no limit to how much you can earn. 💰
    </Text>
  </EmailBase>
);

const h1 = {
  color: "#1A1A1A",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const h3 = {
  color: "#1A1A1A",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
};

const text = {
  color: "#1A1A1A",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const codeSection = {
  backgroundColor: "#fff8e1",
  padding: "32px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #ECC98B",
  margin: "24px 0",
};

const codeTitle = {
  fontSize: "18px",
  color: "#1A1A1A",
  margin: "0 0 16px 0",
  fontWeight: "bold",
};

const codeText = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#1A1A1A",
  fontFamily: "monospace",
  backgroundColor: "#ffffff",
  padding: "16px 24px",
  borderRadius: "8px",
  border: "2px solid #ECC98B",
  margin: "0 0 12px 0",
  display: "inline-block",
};

const codeSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const linkSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const linkTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 16px 0",
};

const linkBox = {
  backgroundColor: "#f8f9fa",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  margin: "0 0 20px 0",
};

const linkText = {
  fontSize: "14px",
  color: "#666",
  fontFamily: "monospace",
  wordBreak: "break-all" as const,
  margin: "0",
};

const howItWorksSection = {
  margin: "32px 0",
};

const stepGrid = {
  display: "flex",
  gap: "20px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const step = {
  textAlign: "center" as const,
  flex: "1",
  minWidth: "150px",
  maxWidth: "180px",
};

const stepNumber = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ECC98B",
  backgroundColor: "#fff8e1",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 12px auto",
};

const stepTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
};

const stepText = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
  lineHeight: "1.4",
};

const socialShareSection = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "8px",
  margin: "32px 0",
};

const socialTitle = {
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

const termsSection = {
  backgroundColor: "#f0f0f0",
  padding: "20px",
  borderRadius: "8px",
  margin: "32px 0",
};

const termsText = {
  fontSize: "12px",
  color: "#666",
  margin: "0",
  lineHeight: "1.5",
};

const footerText = {
  fontSize: "18px",
  color: "#1A1A1A",
  textAlign: "center" as const,
  fontWeight: "500",
  margin: "32px 0 0 0",
};