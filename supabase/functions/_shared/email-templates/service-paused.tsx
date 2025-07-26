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

interface ServicePausedEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  pausedUntil: string;
  lastServiceDate?: string;
}

export const ServicePausedEmail = ({
  customerName,
  cleaningType,
  frequency,
  pausedUntil,
  lastServiceDate,
}: ServicePausedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your cleaning service has been paused</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Paused</Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>
        
        <Text style={text}>
          Your {frequency} {cleaningType} cleaning service has been paused as requested.
        </Text>

        <Section style={statusBox}>
          <Row>
            <Column style={statusColumn}>
              <Text style={statusLabel}>Service Status:</Text>
              <Text style={{...statusValue, color: '#f59e0b'}}>Paused</Text>
            </Column>
          </Row>
          <Row>
            <Column style={statusColumn}>
              <Text style={statusLabel}>Paused Until:</Text>
              <Text style={statusValue}>{pausedUntil}</Text>
            </Column>
          </Row>
          {lastServiceDate && (
            <Row>
              <Column style={statusColumn}>
                <Text style={statusLabel}>Last Service Date:</Text>
                <Text style={statusValue}>{lastServiceDate}</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Text style={text}>
          Your service is now paused and no cleanings will be scheduled until you resume. 
          You can resume your service anytime through your service portal.
        </Text>

        <Text style={text}>
          <strong>Ready to resume?</strong> We'll automatically schedule your next cleaning 
          for the week after you reactivate your service.
        </Text>

        <Button
          href="https://bayareacleaningpros.com/my-services"
          style={button}
        >
          Resume My Service
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

const statusBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
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