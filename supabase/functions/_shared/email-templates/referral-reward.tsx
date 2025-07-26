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

interface ReferralRewardEmailProps {
  referrerName: string;
  friendName: string;
  rewardCode: string;
  rewardAmount: string;
}

export const ReferralRewardEmail = ({
  referrerName,
  friendName,
  rewardCode,
  rewardAmount,
}: ReferralRewardEmailProps) => (
  <Html>
    <Head />
    <Preview>Great news! Your referral earned you a reward</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Referral Reward!</Heading>
        
        <Text style={text}>
          Hi {referrerName},
        </Text>
        
        <Text style={text}>
          Fantastic news! Your friend {friendName} just booked their first cleaning service 
          using your referral code. As a thank you, you've earned a special reward!
        </Text>

        <Section style={rewardBox}>
          <Row>
            <Column style={rewardColumn}>
              <Text style={rewardLabel}>Your Reward:</Text>
              <Text style={rewardAmount}>{rewardAmount} OFF</Text>
              <Text style={codeLabel}>Your Discount Code:</Text>
              <Text style={discountCode}>{rewardCode}</Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          <strong>How to use your reward:</strong>
        </Text>
        
        <Text style={text}>
          1. Visit our booking page or call us to schedule your deep cleaning<br/>
          2. Enter the discount code above during checkout<br/>
          3. Enjoy your {rewardAmount} discount!
        </Text>

        <Text style={text}>
          <strong>Important:</strong> This discount code cannot be combined with other offers 
          and is valid for deep cleaning services only.
        </Text>

        <Button
          href="https://bayareacleaningpros.com"
          style={button}
        >
          Book Your Deep Cleaning
        </Button>

        <Text style={text}>
          Keep referring friends to earn more rewards! Each successful referral earns you 
          another 50% off deep cleaning discount.
        </Text>

        <Text style={footer}>
          Questions about your reward? Contact us at support@bayareacleaningpros.com or (281) 201-6112
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

const rewardBox = {
  backgroundColor: '#dcfce7',
  border: '2px solid #22c55e',
  borderRadius: '12px',
  padding: '32px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const rewardColumn = {
  width: '100%',
};

const rewardLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
};

const rewardAmount = {
  color: '#22c55e',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '8px 0 24px 0',
};

const codeLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
};

const discountCode = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  backgroundColor: '#f3f4f6',
  padding: '12px 24px',
  borderRadius: '8px',
  border: '2px dashed #d1d5db',
  margin: '8px 0 0 0',
  fontFamily: 'monospace',
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