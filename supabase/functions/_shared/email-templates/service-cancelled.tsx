import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ServiceCancelledEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  cancellationReason?: string;
  discountOffered: boolean;
  discountAccepted: boolean;
}

export const ServiceCancelledEmail = ({
  customerName,
  cleaningType,
  frequency,
  cancellationReason,
  discountOffered,
  discountAccepted,
}: ServiceCancelledEmailProps) => (
  <Html>
    <Head />
    <Preview>Your cleaning service has been cancelled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Cancellation Confirmed</Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>
        
        <Text style={text}>
          We're sorry to see you go! Your {frequency} {cleaningType} cleaning service 
          has been cancelled as requested.
        </Text>

        <Section style={statusBox}>
          <Row>
            <Column style={statusColumn}>
              <Text style={statusLabel}>Service Status:</Text>
              <Text style={{...statusValue, color: '#ef4444'}}>Cancelled</Text>
            </Column>
          </Row>
          <Row>
            <Column style={statusColumn}>
              <Text style={statusLabel}>Cancellation Date:</Text>
              <Text style={statusValue}>{new Date().toLocaleDateString()}</Text>
            </Column>
          </Row>
          {cancellationReason && (
            <Row>
              <Column style={statusColumn}>
                <Text style={statusLabel}>Reason:</Text>
                <Text style={statusValue}>{cancellationReason}</Text>
              </Column>
            </Row>
          )}
        </Section>

        {discountOffered && !discountAccepted && (
          <Text style={text}>
            We understand your decision and appreciate the feedback you provided. 
            Your input helps us improve our services for all customers.
          </Text>
        )}

        <Text style={text}>
          <strong>Changed your mind?</strong> We'd love to have you back! You can always 
          book a new service or contact us to discuss reactivating your recurring service.
        </Text>

        <Text style={text}>
          Thank you for choosing Bay Area Cleaning Professionals. We hope to serve you again in the future!
        </Text>

        <Button
          href="https://bayareacleaningpros.com"
          style={button}
        >
          Book a New Service
        </Button>

        <Text style={footer}>
          Questions? Contact us at support@bayareacleaningpros.com or (281) 201-6112
          <br />
          Bay Area Cleaning Professionals
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const statusBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #ef4444',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const statusColumn = {
  width: '100%',
};

const statusLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const statusValue = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '14px 7px',
  margin: '32px auto',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};