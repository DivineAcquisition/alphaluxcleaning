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

interface ServiceResumedEmailProps {
  customerName?: string;
  cleaningType?: string;
  frequency?: string;
  nextServiceDate?: string;
  nextServiceTime?: string;
  serviceAddress?: string;
}

export const ServiceResumedEmail = ({
  customerName = 'Customer',
  cleaningType = 'Cleaning Service',
  frequency = 'regular',
  nextServiceDate,
  nextServiceTime,
  serviceAddress,
}: ServiceResumedEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome back! Your service has been resumed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome Back!</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          Great news! Your {frequency} {cleaningType} service has been resumed.
        </Text>
        
        <Section style={scheduleSection}>
          <Heading style={h2}>Next Service</Heading>
          <Text style={detailText}>
            <strong>Date:</strong> {nextServiceDate}<br />
            <strong>Time:</strong> {nextServiceTime}
            {serviceAddress && (
              <>
                <br />
                <strong>Address:</strong> {serviceAddress}
              </>
            )}
          </Text>
        </Section>

        <Text style={text}>
          We're excited to serve you again! Our team will arrive as scheduled to provide you with our excellent cleaning service.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://alphaluxclean.com/dashboard" style={button}>
            View Dashboard
          </Link>
        </Section>

        <Text style={footer}>
          Thank you for choosing <Link href="https://alphaluxclean.com" style={link}>AlphaLuxClean</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ServiceResumedEmail;

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

const scheduleSection = {
  backgroundColor: '#e8f5e9',
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
