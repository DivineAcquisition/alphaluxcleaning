import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

// Google Guaranteed Badge Component
const GoogleGuaranteedBadge = () => (
  <Section style={trustBadgeContainer}>
    <div style={trustBadge}>
      <div style={badgeIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" fill="#4CAF50"/>
          <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
        </svg>
      </div>
      <div style={badgeTextContent}>
        <Text style={badgeTitle}>Google Guaranteed</Text>
        <Text style={badgeSubtitle}>Backed by Google's guarantee</Text>
      </div>
    </div>
  </Section>
);

interface WaitlistConfirmationEmailProps {
  firstName: string;
  promoCode: string;
  promoAmount: number;
  bookingUrl: string;
}

export const WaitlistConfirmationEmail = ({
  firstName,
  promoCode,
  promoAmount,
  bookingUrl,
}: WaitlistConfirmationEmailProps) => {
  // Add promo code to URL to preserve the offer - using book.alphaluxclean.com
  const bookingUrlWithPromo = `${bookingUrl}?promo=${promoCode}&source=waitlist`;
  
  return (
    <Html>
      <Head />
      <Preview>You're on the list! Don't forget your exclusive ${promoAmount} off offer ✨</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're on the List! 🎉</Heading>
          {/* Google Guaranteed Badge */}
          <GoogleGuaranteedBadge />

          <Text style={text}>
            Hey {firstName},
          </Text>
          <Text style={text}>
            Thanks for joining our waitlist! We'll send you a friendly reminder when you're ready to experience the AlphaLux Clean difference.
          </Text>

          {/* Promo Offer Section - Navy Blue Theme */}
          <Section style={promoBox}>
            <Heading style={promoHeading}>🎁 Your Exclusive Offer</Heading>
            <Text style={promoAmount}>${promoAmount} OFF Deep Clean</Text>
            <Text style={promoCode}>Code: {promoCode}</Text>
            <Text style={promoExpiry}>
              ⏰ Offer expires in 48 hours
            </Text>
            <Button pX={20} pY={12} style={button} href={bookingUrlWithPromo}>
              Book Now & Save ${promoAmount}
            </Button>
          </Section>

        {/* What You'll Get */}
        <Section style={benefitsSection}>
          <Heading style={h2}>What's Included in Your Deep Clean:</Heading>
          <ul style={list}>
            <li style={listItem}>✨ 2-3 certified cleaning professionals</li>
            <li style={listItem}>🧹 Industrial-grade equipment & eco-friendly products</li>
            <li style={listItem}>📋 40-point deep clean checklist</li>
            <li style={listItem}>🏠 Kitchen deep scrub: cabinets, oven, microwave</li>
            <li style={listItem}>🚿 Bathroom tile & grout deep cleaning</li>
            <li style={listItem}>🪟 Interior window cleaning & track detailing</li>
            <li style={listItem}>✅ 48-hour satisfaction guarantee</li>
          </ul>
        </Section>

          <Text style={text}>
            Questions? Just reply to this email or call us at <strong>(972) 559-0223</strong>
          </Text>

          <Text style={footer}>
            AlphaLux Clean - Premium Home Cleaning Services
            <br />
            Not interested? <a href="#" style={link}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 48px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "30px 0 15px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 48px",
};

// Navy Blue Theme for Promo Box
const promoBox = {
  backgroundColor: "#EDF5FF",
  border: "2px solid #2C5282",
  borderRadius: "8px",
  padding: "32px",
  margin: "32px 48px",
  textAlign: "center" as const,
};

const promoHeading = {
  color: "#2C5282",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const promoAmount = {
  color: "#2C5282",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "16px 0 8px",
};

const promoCode = {
  color: "#64748b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "8px 0",
};

const promoExpiry = {
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "600",
  margin: "12px 0 20px",
};

// Gold Button with Dark Text
const button = {
  backgroundColor: "#0F77CC",
  borderRadius: "5px",
  color: "#1B314B",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  width: "100%",
};

const benefitsSection = {
  margin: "32px 48px",
};

const list = {
  padding: "0 0 0 20px",
  margin: "16px 0",
};

const listItem = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "8px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 48px",
  textAlign: "center" as const,
};

const link = {
  color: "#2C5282",
  textDecoration: "underline",
};

// Google Guaranteed Badge Styles
const trustBadgeContainer = {
  textAlign: "center" as const,
  margin: "24px 48px",
};

const trustBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#E8F5E9",
  padding: "12px 24px",
  borderRadius: "8px",
  border: "1px solid #4CAF50",
};

const badgeIcon = {
  display: "flex",
  alignItems: "center",
};

const badgeTextContent = {
  textAlign: "left" as const,
};

const badgeTitle = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#2E7D32",
  margin: "0",
  lineHeight: "1.2",
};

const badgeSubtitle = {
  fontSize: "11px",
  color: "#66BB6A",
  margin: "2px 0 0 0",
  lineHeight: "1.2",
};
