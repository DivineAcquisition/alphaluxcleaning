import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface ReferralWelcomeEmailProps {
  ownerName: string;
  referralCode: string;
  referralLink: string;
}

export const ReferralWelcomeEmail = ({
  ownerName,
  referralCode,
  referralLink,
}: ReferralWelcomeEmailProps) => (
  <BaseEmailTemplate previewText="Your referral code is ready! Start sharing and earning rewards">
    
    <Heading style={heading}>Your Referral Code is Ready!</Heading>
    
    <Text style={text}>
      Hi {ownerName}, thank you for joining our referral program! Your unique referral code 
      has been generated and is ready to share with friends and family.
    </Text>

    <Section style={codeSection}>
      <Text style={codeLabel}>Your Referral Code:</Text>
      <Text style={discountCode}>{referralCode}</Text>
    </Section>

    <Text style={text}>
      <strong>How to share your code:</strong><br />
      1. Share your code directly: <strong>{referralCode}</strong><br />
      2. Or use this pre-loaded link that automatically applies your code:<br />
    </Text>

    <Section style={buttonSection}>
      <Button href={referralLink} style={button}>
        Share This Link
      </Button>
    </Section>

    <Text style={text}>
      <strong>Reward Details:</strong><br />
      • Your friends get 10% off their first cleaning service<br />
      • You get 50% off your next deep cleaning when they book<br />
      • No limit on how many friends you can refer!
    </Text>

    <Text style={text}>
      <strong>Ways to share:</strong><br />
      • Copy and paste your referral code: {referralCode}<br />
      • Share the direct link above<br />
      • Tell friends to mention your name when booking
    </Text>

    <Section style={highlightSection}>
      <Text style={highlightText}>
        💡 <strong>Pro Tip:</strong> The more friends who book using your code, 
        the more 50% discounts you'll earn for future deep cleanings!
      </Text>
    </Section>

    <Text style={smallText}>
      Questions about the referral program? Contact us at support@bayareacleaningpros.com or (281) 201-6112
    </Text>

  </BaseEmailTemplate>
)

// Styles
const heading = {
  color: '#22c55e',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 24px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const codeSection = {
  backgroundColor: '#dcfce7',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #22c55e',
}

const codeLabel = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px 0',
}

const discountCode = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: '700',
  backgroundColor: '#f3f4f6',
  padding: '16px 32px',
  borderRadius: '8px',
  border: '2px dashed #d1d5db',
  margin: '12px 0 0 0',
  fontFamily: 'monospace',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#22c55e',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '8px',
  display: 'inline-block',
}

const highlightSection = {
  backgroundColor: '#f0f9ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #0ea5e9',
}

const highlightText = {
  color: '#0c4a6e',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
}

export default ReferralWelcomeEmail