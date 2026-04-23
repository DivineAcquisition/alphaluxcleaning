import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface JobCompletedEmailProps {
  first_name: string;
  service_type: string;
  booking_id: string;
  app_url: string;
}

export const JobCompletedEmail = ({
  first_name,
  service_type,
  booking_id,
  app_url,
}: JobCompletedEmailProps) => (
  <EmailBase preview="How was your cleaning? We'd love your feedback!" isMarketing>
    <Heading style={h1}>
      Thank you, {first_name}! 🌟
    </Heading>
    
    <Text style={text}>
      Your {service_type} cleaning is complete! We hope you love coming home 
      to your sparkling clean space.
    </Text>

    <Section style={feedbackSection}>
      <Text style={feedbackTitle}>How did we do?</Text>
      <Text style={feedbackSubtext}>
        Your feedback helps us maintain our high standards and recognize 
        our amazing cleaning teams.
      </Text>
      
      <ActionButton href={`${app_url}/review?booking=${booking_id}`} style={reviewButton}>
        ⭐ Rate Your Clean
      </ActionButton>
    </Section>

    <Section style={upsellSection}>
      <Heading as="h3" style={h3}>
        💡 Keep your home spotless year-round
      </Heading>
      <Text style={upsellText}>
        Turn today's clean into a regular routine and save up to 15% with 
        our recurring plans:
      </Text>
      
      <div style={planGrid}>
        <div style={planCard}>
          <Text style={planFreq}>Weekly</Text>
          <Text style={planDiscount}>Save 15%</Text>
        </div>
        <div style={planCard}>
          <Text style={planFreq}>Bi-Weekly</Text>
          <Text style={planDiscount}>Save 10%</Text>
        </div>
        <div style={planCard}>
          <Text style={planFreq}>Monthly</Text>
          <Text style={planDiscount}>Save 5%</Text>
        </div>
      </div>

      <ActionButton href={`${app_url}/start-recurring?booking=${booking_id}`} style={upsellButton}>
        Set Up Recurring Service →
      </ActionButton>
    </Section>

    <Section style={socialSection}>
      <Text style={socialTitle}>🎉 Love your clean?</Text>
      <Text style={socialText}>
        Share the joy! Refer friends and family - you'll both get $25 off 
        your next cleaning.
      </Text>
      
      <ActionButton href={`${app_url}/referral?booking=${booking_id}`} style={referralButton}>
        Refer & Earn $25
      </ActionButton>
    </Section>

    <Text style={thanksText}>
      Thank you for trusting AlphaLuxClean with your home! 🏠✨
    </Text>
  </EmailBase>
);

const h1 = {
  color: "#1A1A1A",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
};

const h3 = {
  color: "#1A1A1A",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const text = {
  color: "#1A1A1A",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const feedbackSection = {
  backgroundColor: "#f8f9fa",
  padding: "32px",
  borderRadius: "8px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const feedbackTitle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 12px 0",
};

const feedbackSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 24px 0",
  lineHeight: "1.5",
};

const reviewButton = {
  backgroundColor: "#4caf50",
  fontSize: "18px",
  padding: "16px 32px",
};

const upsellSection = {
  backgroundColor: "#fff8e1",
  padding: "32px",
  borderRadius: "8px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const upsellText = {
  fontSize: "16px",
  color: "#1A1A1A",
  margin: "0 0 24px 0",
  lineHeight: "1.6",
};

const planGrid = {
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  margin: "24px 0",
  flexWrap: "wrap" as const,
};

const planCard = {
  backgroundColor: "#ffffff",
  border: "2px solid #ECC98B",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  minWidth: "120px",
  flex: "1",
  maxWidth: "150px",
};

const planFreq = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
};

const planDiscount = {
  fontSize: "14px",
  color: "#ECC98B",
  fontWeight: "bold",
  margin: "0",
};

const upsellButton = {
  backgroundColor: "#ECC98B",
  margin: "24px 0 0 0",
};

const socialSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f0f8f0",
  borderRadius: "8px",
};

const socialTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 12px 0",
};

const socialText = {
  fontSize: "16px",
  color: "#1A1A1A",
  margin: "0 0 20px 0",
  lineHeight: "1.6",
};

const referralButton = {
  backgroundColor: "#4caf50",
};

const thanksText = {
  fontSize: "18px",
  color: "#1A1A1A",
  textAlign: "center" as const,
  fontWeight: "500",
  margin: "32px 0 0 0",
};