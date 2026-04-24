import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
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

interface PromoAppliedEmailProps {
  customerName: string;
  promoCode: string;
  discountAmount: string;
  originalPrice: string;
  newPrice: string;
  serviceDate: string;
  timeWindow: string;
  bookingUrl: string;
  bookingId: string;
}

export const PromoAppliedEmail = ({
  customerName,
  promoCode,
  discountAmount,
  originalPrice,
  newPrice,
  serviceDate,
  timeWindow,
  bookingUrl,
  bookingId,
}: PromoAppliedEmailProps) => {
  const bookingUrlWithId = `${bookingUrl}?booking=${bookingId}`;
  
  return (
    <Html>
      <Head />
      <Preview>Your promo code has been applied! Save {discountAmount} 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Celebration Header */}
          <Section style={header}>
            <Heading style={headerTitle}>🎉 Promo Applied!</Heading>
            <Text style={headerSubtitle}>Your discount has been successfully applied</Text>
          </Section>

          <Section style={content}>
            {/* Google Guaranteed Badge */}
            <GoogleGuaranteedBadge />

            <Text style={greeting}>Hi {customerName},</Text>
            
            <Text style={text}>
              Great news! We've successfully applied your promo code to your booking.
            </Text>

            {/* Promo Badge */}
            <Section style={promoBadge}>
              <Text style={promoLabel}>PROMO CODE</Text>
              <Text style={promoCodeText}>{promoCode}</Text>
              <Text style={savingsText}>
                You're Saving: <span style={savingsAmount}>{discountAmount}</span>
              </Text>
            </Section>

            {/* Updated Summary */}
            <Section style={summaryCard}>
              <Heading style={cardHeading}>Updated Booking Summary</Heading>
              
              <div style={detailRow}>
                <Text style={detailLabel}>Service Date:</Text>
                <Text style={detailValue}>{serviceDate}</Text>
              </div>
              
              <div style={detailRow}>
                <Text style={detailLabel}>Service Time:</Text>
                <Text style={detailValue}>{timeWindow}</Text>
              </div>
              
              <div style={detailRow}>
                <Text style={detailLabel}>Original Total:</Text>
                <Text style={strikethroughValue}>${originalPrice}</Text>
              </div>
              
              <div style={detailRow}>
                <Text style={detailLabel}>Promo Discount:</Text>
                <Text style={successValue}>-{discountAmount}</Text>
              </div>
              
              <div style={totalRow}>
                <Text style={totalLabel}>New Total:</Text>
                <Text style={totalValue}>${newPrice}</Text>
              </div>
            </Section>

            <Text style={text}>
              Your savings have been applied to your booking. We can't wait to provide you with our premium cleaning service!
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button style={goldButton} href={bookingUrlWithId}>
                View Your Booking
              </Button>
            </Section>

            <Text style={helpText}>
              Questions? Reply to this email or call us at <strong>(972) 559-0223</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              AlphaLux Clean - Premium Cleaning Services
              <br />
              <Link href="tel:9725590223" style={footerLink}>(972) 559-0223</Link>
              {" • "}
              <Link href="mailto:support@alphaluxclean.com" style={footerLink}>support@alphaluxclean.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PromoAppliedEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #2C5282 0%, #1A365D 100%)",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#E2E8F0",
  fontSize: "16px",
  margin: "0",
};

const content = {
  padding: "40px 48px",
};

const greeting = {
  fontSize: "18px",
  color: "#1B314B",
  margin: "0 0 16px 0",
  fontWeight: "600",
};

const text = {
  fontSize: "16px",
  color: "#333333",
  lineHeight: "24px",
  margin: "16px 0",
};

const promoBadge = {
  backgroundColor: "#ECFDF5",
  border: "2px solid #10B981",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const promoLabel = {
  fontSize: "12px",
  color: "#059669",
  fontWeight: "600",
  letterSpacing: "1px",
  margin: "0 0 8px 0",
};

const promoCodeText = {
  fontSize: "24px",
  color: "#047857",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const savingsText = {
  fontSize: "16px",
  color: "#333333",
  margin: "0",
};

const savingsAmount = {
  fontSize: "20px",
  color: "#10B981",
  fontWeight: "bold",
};

const summaryCard = {
  backgroundColor: "#F8FAFC",
  border: "2px solid #E2E8F0",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const cardHeading = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#2C5282",
  margin: "0 0 16px 0",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #E2E8F0",
};

const detailLabel = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
};

const detailValue = {
  fontSize: "14px",
  color: "#1B314B",
  fontWeight: "600",
  margin: "0",
};

const strikethroughValue = {
  fontSize: "14px",
  color: "#94A3B8",
  fontWeight: "400",
  margin: "0",
  textDecoration: "line-through",
};

const successValue = {
  fontSize: "14px",
  color: "#10B981",
  fontWeight: "bold",
  margin: "0",
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "16px 0 0 0",
  marginTop: "8px",
  borderTop: "2px solid #2C5282",
};

const totalLabel = {
  fontSize: "16px",
  color: "#1B314B",
  fontWeight: "bold",
  margin: "0",
};

const totalValue = {
  fontSize: "20px",
  color: "#10B981",
  fontWeight: "bold",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const goldButton = {
  backgroundColor: "#0F77CC",
  borderRadius: "6px",
  color: "#1B314B",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const helpText = {
  fontSize: "14px",
  color: "#64748B",
  textAlign: "center" as const,
  margin: "24px 0 0 0",
};

const footer = {
  borderTop: "1px solid #E2E8F0",
  padding: "24px 48px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#64748B",
  lineHeight: "18px",
  margin: "0",
};

const footerLink = {
  color: "#2C5282",
  textDecoration: "none",
};

// Google Guaranteed Badge Styles
const trustBadgeContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
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
