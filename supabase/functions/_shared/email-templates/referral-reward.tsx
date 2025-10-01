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

interface ReferralRewardEmailProps {
  referrerName?: string;
  friendName?: string;
  rewardCode?: string;
  rewardAmount?: string;
}

export const ReferralRewardEmail = ({
  referrerName = 'Customer',
  friendName = 'your friend',
  rewardCode = '',
  rewardAmount = '$50',
}: ReferralRewardEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Referral Reward Earned!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Congratulations!</Heading>
        <Text style={text}>Hi {referrerName},</Text>
        <Text style={text}>
          Great news! {friendName} has completed their first service with us, and you've earned a referral reward!
        </Text>
        
        <Section style={rewardSection}>
          <Heading style={h2}>Your Reward</Heading>
          <Text style={rewardAmount}>{rewardAmount}</Text>
          {rewardCode && (
            <Text style={codeText}>
              Use code: <span style={code}>{rewardCode}</span>
            </Text>
          )}
        </Section>

        <Text style={text}>
          This reward will be automatically applied to your next service. Thank you for spreading the word about AlphaLuxClean!
        </Text>

        <Section style={shareSection}>
          <Heading style={h2}>Keep Earning!</Heading>
          <Text style={text}>
            Share your referral link with more friends and continue earning rewards for every successful referral.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link href="https://alphaluxclean.com/dashboard" style={button}>
            View Your Rewards
          </Link>
        </Section>

        <Text style={footer}>
          Thank you for being a valued customer of <Link href="https://alphaluxclean.com" style={link}>AlphaLuxClean</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReferralRewardEmail;

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

const rewardSection = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '30px 20px',
  margin: '20px 0',
  textAlign: 'center' as const,
  border: '2px solid #28a745',
};

const rewardAmount = {
  color: '#28a745',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '16px 0',
};

const codeText = {
  fontSize: '16px',
  margin: '16px 0',
};

const code = {
  backgroundColor: '#f9f9f9',
  padding: '8px 16px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '18px',
  fontWeight: 'bold',
  border: '1px solid #ddd',
};

const shareSection = {
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
