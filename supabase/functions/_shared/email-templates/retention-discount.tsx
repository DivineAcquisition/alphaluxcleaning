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

interface RetentionDiscountEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  originalAmount: number;
  discountedAmount: number;
  savingsAmount: number;
  nextServiceDate: string;
  nextServiceTime: string;
}

export const RetentionDiscountEmail = ({
  customerName,
  cleaningType,
  frequency,
  originalAmount,
  discountedAmount,
  savingsAmount,
  nextServiceDate,
  nextServiceTime,
}: RetentionDiscountEmailProps) => (
  <Html>
    <Head />
    <Preview>Great news! Your 25% discount has been applied</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Discount Applied!</Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>
        
        <Text style={text}>
          Fantastic! We're thrilled you decided to stay with us. Your 25% discount 
          has been successfully applied to your {frequency} {cleaningType} cleaning service.
        </Text>

        <Section style={discountBox}>
          <Row>
            <Column style={discountColumn}>
              <Text style={discountLabel}>Your New Pricing:</Text>
              <Text style={originalPrice}>${(originalAmount / 100).toFixed(2)}</Text>
              <Text style={discountedPrice}>${(discountedAmount / 100).toFixed(2)}</Text>
              <Text style={savingsText}>
                You save ${(savingsAmount / 100).toFixed(2)} per service!
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={discountColumn}>
              <Text style={discountLabel}>Next Service:</Text>
              <Text style={serviceDate}>
                {nextServiceDate} at {nextServiceTime}
              </Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          This special pricing will continue for all your future {frequency} services. 
          We appreciate your loyalty and look forward to continuing to serve you!
        </Text>

        <Text style={text}>
          <strong>What's next?</strong> Your service will continue as scheduled with your 
          new discounted pricing. No action needed from you!
        </Text>

        <Button
          href="https://bayareacleaningpros.com/my-services"
          style={button}
        >
          View My Services
        </Button>

        <Text style={footer}>
          Questions about your discount? Contact us at support@bayareacleaningpros.com or (281) 201-6112
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

const discountBox = {
  backgroundColor: '#dcfce7',
  border: '2px solid #22c55e',
  borderRadius: '12px',
  padding: '32px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const discountColumn = {
  width: '100%',
};

const discountLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
};

const originalPrice = {
  color: '#999',
  fontSize: '18px',
  textDecoration: 'line-through',
  margin: '0',
};

const discountedPrice = {
  color: '#22c55e',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const savingsText = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 24px 0',
};

const serviceDate = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '8px 0 0 0',
};

const button = {
  backgroundColor: '#22c55e',
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