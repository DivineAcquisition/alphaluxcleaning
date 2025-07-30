import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

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
  <BaseEmailTemplate previewText="Great news! Your referral earned you a reward">
    
    <Heading style={heading}>Referral Reward!</Heading>
    
    <Text style={text}>
      Hi {referrerName}, fantastic news! Your friend {friendName} just booked their first cleaning service 
      using your referral code. As a thank you, you've earned a special reward!
    </Text>

    <Section style={rewardSection}>
      <Text style={rewardLabel}>Your Reward:</Text>
      <Text style={rewardAmount}>{rewardAmount} OFF</Text>
      <Text style={codeLabel}>Your Discount Code:</Text>
      <Text style={discountCode}>{rewardCode}</Text>
    </Section>

    <Text style={text}>
      <strong>How to use your reward:</strong><br />
      1. Visit our booking page or call us to schedule your deep cleaning<br />
      2. Enter the discount code above during checkout<br />
      3. Enjoy your {rewardAmount} discount!
    </Text>

    <Text style={text}>
      <strong>Important:</strong> This discount code cannot be combined with other offers 
      and is valid for deep cleaning services only.
    </Text>

    <Section style={buttonSection}>
      <Button href="https://bayareacleaningpros.com" style={button}>
        Book Your Deep Cleaning
      </Button>
    </Section>

    <Text style={text}>
      Keep referring friends to earn more rewards! Each successful referral earns you 
      another 50% off deep cleaning discount.
    </Text>

    <Text style={smallText}>
      Questions about your reward? Contact us at support@bayareacleaningpros.com or (281) 201-6112
    </Text>

  </BaseEmailTemplate>
)

// Simple styles
const heading = {
  color: '#22c55e',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
}

const rewardSection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  textAlign: 'center' as const,
  border: '2px solid #22c55e',
}

const rewardLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
}

const rewardAmount = {
  color: '#22c55e',
  fontSize: '32px',
  fontWeight: '700',
  margin: '8px 0 24px 0',
}

const codeLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
}

const discountCode = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '700',
  backgroundColor: '#f3f4f6',
  padding: '12px 24px',
  borderRadius: '6px',
  border: '2px dashed #d1d5db',
  margin: '8px 0 0 0',
  fontFamily: 'monospace',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#22c55e',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
}

export default ReferralRewardEmail