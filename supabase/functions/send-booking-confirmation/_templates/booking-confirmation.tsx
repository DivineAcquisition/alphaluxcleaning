import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingConfirmationEmailProps {
  customerName: string;
  orderId: string;
  serviceType: string;
  frequency: string;
  serviceDate: string;
  timeSlot: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  pricing: {
    total: number;
    deposit: number;
    balance: number;
    discount?: number;
  };
  specialInstructions?: string;
  isOneTime: boolean;
}

export const BookingConfirmationEmail = ({
  customerName,
  orderId,
  serviceType,
  frequency,
  serviceDate,
  timeSlot,
  address,
  pricing,
  specialInstructions,
  isOneTime,
}: BookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your AlphaLux Clean booking is confirmed! 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={h1}>🎉 Booking Confirmed!</Heading>
          <Text style={orderNumber}>Order #{orderId}</Text>
        </Section>

        {/* $50 Discount Badge - Only for One-Time Bookings */}
        {isOneTime && pricing.discount && pricing.discount > 0 && (
          <Section style={discountBanner}>
            <Text style={discountBadge}>💰 $50 DISCOUNT APPLIED</Text>
            <Text style={discountText}>
              You saved ${pricing.discount.toFixed(2)} on your one-time cleaning!
            </Text>
          </Section>
        )}

        {/* Content */}
        <Section style={content}>
          <Text style={greeting}>Hi {customerName}!</Text>
          <Text style={text}>
            Great news! Your AlphaLux Clean booking is confirmed and locked in. 
            We can't wait to make your home sparkle! ✨
          </Text>

          {/* Service Details Card */}
          <Section style={card}>
            <Heading style={cardHeading}>📅 Service Details</Heading>
            <Section style={detailRow}>
              <Text style={label}>Service Type:</Text>
              <Text style={value}>{serviceType}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Frequency:</Text>
              <Text style={value}>{frequency}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Date:</Text>
              <Text style={value}>{serviceDate}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Time:</Text>
              <Text style={value}>{timeSlot}</Text>
            </Section>
            <Section style={detailRowLast}>
              <Text style={label}>Address:</Text>
              <Text style={value}>
                {address.line1}
                {address.line2 && <><br />{address.line2}</>}
                <br />
                {address.city}, {address.state} {address.postalCode}
              </Text>
            </Section>
          </Section>

          {/* Payment Summary Card - Highlighting 25% Deposit */}
          <Section style={card}>
            <Heading style={cardHeading}>💰 Payment Summary</Heading>
            
            {/* Deposit Paid - Most Prominent */}
            <Section style={depositHighlight}>
              <Text style={depositLabel}>Paid Today (25% Deposit)</Text>
              <Text style={depositAmount}>${pricing.deposit.toFixed(2)}</Text>
            </Section>

            <Section style={detailRow}>
              <Text style={label}>Balance Due After Service:</Text>
              <Text style={valueBalance}>${pricing.balance.toFixed(2)}</Text>
            </Section>
            <Section style={detailRowLast}>
              <Text style={labelTotal}>Service Total:</Text>
              <Text style={valueTotal}>${pricing.total.toFixed(2)}</Text>
            </Section>
          </Section>

          {/* What's Next */}
          <Section style={highlight}>
            <Text style={highlightTitle}>📱 What's Next?</Text>
            <Text style={listItem}>• We'll send a reminder 24 hours before your service</Text>
            <Text style={listItem}>• Our team will arrive within your scheduled time slot</Text>
            <Text style={listItem}>• Remaining balance will be charged after completion</Text>
          </Section>

          {/* Call Button */}
          <Section style={buttonContainer}>
            <Link href="tel:9725590223" style={button}>
              📞 Call Us: (972) 559-0223
            </Link>
          </Section>

          {/* Special Instructions */}
          {specialInstructions && (
            <Section style={card}>
              <Heading style={cardHeading}>📝 Your Special Instructions</Heading>
              <Text style={instructionsText}>{specialInstructions}</Text>
            </Section>
          )}

          <Text style={text}>
            Have questions? Just reply to this email or call us anytime!
          </Text>
          <Text style={text}>Thanks for choosing AlphaLux Clean! 💎</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>AlphaLux Clean | Professional Cleaning Services</Text>
          <Text style={footerText}>(972) 559-0223 | info@alphaluxclean.com</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BookingConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#F8F8F7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #0F77CC 0%, #1B314B 100%)',
  padding: '30px 20px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const orderNumber = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '10px 0 0 0',
  opacity: '0.9',
};

const discountBanner = {
  background: '#EFF7FE',
  padding: '20px',
  textAlign: 'center' as const,
  borderLeft: '4px solid #0F77CC',
};

const discountBadge = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0C5FA6',
  margin: '0 0 8px 0',
};

const discountText = {
  fontSize: '16px',
  color: '#1B314B',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px 20px',
  borderRadius: '0 0 8px 8px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '16px',
  color: '#111827',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '16px 0',
};

const card = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  border: '1px solid #e5e7eb',
};

const cardHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0F77CC',
  margin: '0 0 16px 0',
};

const detailRow = {
  borderBottom: '1px solid #e5e7eb',
  padding: '12px 0',
  display: 'flex',
  justifyContent: 'space-between',
};

const detailRowLast = {
  padding: '12px 0',
  display: 'flex',
  justifyContent: 'space-between',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0',
};

const value = {
  fontSize: '14px',
  color: '#111827',
  margin: '0',
  textAlign: 'right' as const,
};

const depositHighlight = {
  backgroundColor: '#f0fdf4',
  padding: '16px',
  borderRadius: '6px',
  marginBottom: '16px',
  border: '2px solid #10b981',
  textAlign: 'center' as const,
};

const depositLabel = {
  fontSize: '14px',
  color: '#065f46',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const depositAmount = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0',
};

const valueBalance = {
  fontSize: '16px',
  color: '#111827',
  margin: '0',
  textAlign: 'right' as const,
  fontWeight: '600',
};

const labelTotal = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
};

const valueTotal = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
  textAlign: 'right' as const,
};

const highlight = {
  backgroundColor: '#EFF7FE',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  borderLeft: '4px solid #0F77CC',
};

const highlightTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1B314B',
  margin: '0 0 12px 0',
};

const listItem = {
  fontSize: '14px',
  color: '#1B314B',
  margin: '8px 0',
  lineHeight: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#0F77CC',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
};

const instructionsText = {
  fontSize: '14px',
  color: '#374151',
  margin: '0',
  lineHeight: '20px',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  marginTop: '20px',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0',
};
