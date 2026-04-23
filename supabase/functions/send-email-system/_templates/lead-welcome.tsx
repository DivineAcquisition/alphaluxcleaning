import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface LeadWelcomeEmailProps {
  first_name: string;
  email: string;
  app_url: string;
}

export const LeadWelcomeEmail = ({
  first_name,
  email,
  app_url,
}: LeadWelcomeEmailProps) => (
  <EmailBase preview="Get your instant cleaning price in one click" isMarketing>
    <Heading style={h1}>
      Hi {first_name || 'there'}! 👋
    </Heading>
    
    <Text style={text}>
      Thanks for your interest in AlphaLuxClean! We make booking premium house cleaning 
      as easy as ordering takeout.
    </Text>

    <Section style={benefitsSection}>
      <div style={benefitRow}>
        <div style={benefitItem}>
          <Text style={benefitTitle}>📍 Size-Based Pricing</Text>
          <Text style={benefitText}>
            Fair, transparent rates based on your home's square footage
          </Text>
        </div>
        <div style={benefitItem}>
          <Text style={benefitTitle}>⚡ Instant Booking</Text>
          <Text style={benefitText}>
            Pick your size, see your price, book in under 60 seconds
          </Text>
        </div>
      </div>
      <div style={benefitRow}>
        <div style={benefitItem}>
          <Text style={benefitTitle}>🛡️ Bonded & Insured</Text>
          <Text style={benefitText}>
            Professional teams with full background checks
          </Text>
        </div>
        <div style={benefitItem}>
          <Text style={benefitTitle}>💯 Satisfaction Guaranteed</Text>
          <Text style={benefitText}>
            Not happy? We'll make it right or refund you
          </Text>
        </div>
      </div>
    </Section>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/start?prefill=${encodeURIComponent(email)}`}>
        Get My Instant Price →
      </ActionButton>
    </Section>

    <Text style={smallText}>
      Takes less than a minute. No surprises, no hidden fees.
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

const benefitsSection = {
  margin: "32px 0",
};

const benefitRow = {
  display: "flex",
  flexDirection: "row" as const,
  gap: "20px",
  marginBottom: "20px",
};

const benefitItem = {
  flex: "1",
  minWidth: "250px",
};

const benefitTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 8px 0",
};

const benefitText = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
  lineHeight: "1.5",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const smallText = {
  fontSize: "14px",
  color: "#999",
  textAlign: "center" as const,
  margin: "16px 0 0 0",
};