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

interface PaymentConfirmationProps {
  subcontractorName: string;
  paymentAmount: string;
  jobDetails: {
    customerName: string;
    serviceDate: string;
    serviceAddress: string;
    serviceType: string;
    totalAmount: string;
    splitPercentage: string;
  };
  paymentMethod: string;
  paymentDate: string;
  ytdEarnings: string;
  dashboardUrl: string;
}

export const PaymentConfirmation = ({
  subcontractorName,
  paymentAmount,
  jobDetails,
  paymentMethod,
  paymentDate,
  ytdEarnings,
  dashboardUrl,
}: PaymentConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Payment Received - {paymentAmount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Received</Heading>
        <Text style={text}>Hi {subcontractorName},</Text>
        <Text style={text}>
          Great news! You've received a payment of <strong>{paymentAmount}</strong> for the job completed on {jobDetails.serviceDate}.
        </Text>
        
        <Section style={jobSection}>
          <Heading style={h2}>Job Details</Heading>
          <Text style={detailText}>
            <strong>Customer:</strong> {jobDetails.customerName}<br />
            <strong>Service Type:</strong> {jobDetails.serviceType}<br />
            <strong>Service Date:</strong> {jobDetails.serviceDate}<br />
            <strong>Service Address:</strong> {jobDetails.serviceAddress}<br />
            <strong>Total Amount:</strong> {jobDetails.totalAmount}<br />
            <strong>Your Split:</strong> {jobDetails.splitPercentage}
          </Text>
        </Section>

        <Section style={paymentSection}>
          <Heading style={h2}>Payment Information</Heading>
          <Text style={detailText}>
            <strong>Amount Paid:</strong> {paymentAmount}<br />
            <strong>Payment Method:</strong> {paymentMethod}<br />
            <strong>Payment Date:</strong> {paymentDate}<br />
            <strong>YTD Earnings:</strong> {ytdEarnings}
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link href={dashboardUrl} style={button}>
            View Dashboard
          </Link>
        </Section>

        <Text style={footer}>
          If you have any questions about this payment, please contact us.
        </Text>
        
        <Text style={footer}>
          <Link href="https://alphaluxclean.com" style={link}>
            AlphaLux Cleaning
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentConfirmation;

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
  margin: '24px 0 12px',
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

const jobSection = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const paymentSection = {
  backgroundColor: '#f0f8ff',
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
