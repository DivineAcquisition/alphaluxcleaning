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

interface ServiceRescheduledEmailProps {
  customerName: string;
  cleaningType: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  serviceAddress?: string;
}

export const ServiceRescheduledEmail = ({
  customerName,
  cleaningType,
  oldDate,
  oldTime,
  newDate,
  newTime,
  serviceAddress,
}: ServiceRescheduledEmailProps) => (
  <Html>
    <Head />
    <Preview>Your cleaning service has been rescheduled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Rescheduled</Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>
        
        <Text style={text}>
          Your {cleaningType} cleaning service has been successfully rescheduled.
        </Text>

        <Section style={scheduleBox}>
          <Row>
            <Column style={scheduleColumn}>
              <Text style={scheduleLabel}>Previous Schedule:</Text>
              <Text style={scheduleValue}>{oldDate} at {oldTime}</Text>
            </Column>
          </Row>
          <Row>
            <Column style={scheduleColumn}>
              <Text style={scheduleLabel}>New Schedule:</Text>
              <Text style={{...scheduleValue, color: '#22c55e', fontWeight: 'bold'}}>
                {newDate} at {newTime}
              </Text>
            </Column>
          </Row>
          {serviceAddress && (
            <Row>
              <Column style={scheduleColumn}>
                <Text style={scheduleLabel}>Service Address:</Text>
                <Text style={scheduleValue}>{serviceAddress}</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Text style={text}>
          Our team will arrive at your new scheduled time. If you need to make any further changes, 
          please visit your service portal or contact us.
        </Text>

        <Button
          href="https://bayareacleaningpros.com/my-services"
          style={button}
        >
          Manage My Services
        </Button>

        <Text style={footer}>
          Need help? Contact us at support@bayareacleaningpros.com or (281) 201-6112
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

const scheduleBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const scheduleColumn = {
  width: '100%',
};

const scheduleLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const scheduleValue = {
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