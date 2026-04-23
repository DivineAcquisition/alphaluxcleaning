import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ServiceCancelledEmailProps {
  customerName?: string;
  cleaningType?: string;
  frequency?: string;
  cancellationReason?: string;
  discountOffered?: boolean;
  discountAccepted?: boolean;
}

export const ServiceCancelledEmail = ({
  customerName = 'Customer',
  cleaningType = 'Cleaning Service',
  frequency = 'regular',
  cancellationReason,
  discountOffered = false,
  discountAccepted = false,
}: ServiceCancelledEmailProps) => (
  <Html>
    <Head />
    <Preview>Your service has been cancelled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Cancelled</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          We're sorry to see you go. Your {frequency} {cleaningType} service has been cancelled as requested.
        </Text>
        
        {cancellationReason && (
          <Section style={infoSection}>
            <Text style={detailText}>
              <strong>Cancellation Reason:</strong> {cancellationReason}
            </Text>
          </Section>
        )}

        {discountOffered && !discountAccepted && (
          <Section style={offerSection}>
            <Heading style={h2}>We'd Love to Keep You!</Heading>
            <Text style={text}>
              Before you go, we'd like to offer you a special discount to continue your service. Please contact us if you'd like to discuss this opportunity.
            </Text>
          </Section>
        )}

        <Text style={text}>
          We appreciate the time you spent with us and would love to serve you again in the future. If you change your mind or need our services again, we're just a call or click away.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://alphaluxclean.com/contact" style={button}>
            Contact Us
          </Link>
        </Section>

        <Text style={footer}>
          Thank you for choosing <Link href="https://alphaluxclean.com" style={link}>AlphaLuxClean</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ServiceCancelledEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0 12px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '14px',
  margin: '16px 0',
  lineHeight: '1.6',
};

const detailText = {
  color: '#333',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.8',
};

const infoSection = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const offerSection = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '2px solid #ffc107',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
};

const link = {
  color: '#007bff',
  textDecoration: 'underline',
};
