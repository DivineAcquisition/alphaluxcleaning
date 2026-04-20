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

interface ServicePausedEmailProps {
  customerName?: string;
  cleaningType?: string;
  frequency?: string;
  pausedUntil?: string;
  lastServiceDate?: string;
}

export const ServicePausedEmail = ({
  customerName = 'Customer',
  cleaningType = 'Cleaning Service',
  frequency = 'regular',
  pausedUntil,
  lastServiceDate,
}: ServicePausedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your service has been paused</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Paused</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          Your {frequency} {cleaningType} service has been paused as requested.
        </Text>
        
        {lastServiceDate && (
          <Section style={infoSection}>
            <Text style={detailText}>
              <strong>Last Service Date:</strong> {lastServiceDate}
            </Text>
          </Section>
        )}

        {pausedUntil && (
          <Section style={infoSection}>
            <Text style={detailText}>
              <strong>Paused Until:</strong> {pausedUntil}
            </Text>
          </Section>
        )}

        <Text style={text}>
          When you're ready to resume service, simply log in to your account or contact us.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://alphaluxclean.com/contact" style={button}>
            Contact Us
          </Link>
        </Section>

        <Text style={footer}>
          Thank you for choosing <Link href="https://alphaluxclean.com" style={link}>AlphaLux Cleaning</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ServicePausedEmail;

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
