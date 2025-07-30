import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

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
  <BaseEmailTemplate previewText="Great news! Your 25% discount has been applied">
    
    <Heading style={heading}>Discount Applied!</Heading>
    
    <Text style={text}>
      Hi {customerName}, fantastic! We're thrilled you decided to stay with us. Your 25% discount 
      has been successfully applied to your {frequency} {cleaningType} cleaning service.
    </Text>

    <Section style={discountSection}>
      <Text style={discountLabel}>Your New Pricing:</Text>
      <Text style={originalPrice}>${(originalAmount / 100).toFixed(2)}</Text>
      <Text style={discountedPrice}>${(discountedAmount / 100).toFixed(2)}</Text>
      <Text style={savingsText}>
        You save ${(savingsAmount / 100).toFixed(2)} per service!
      </Text>
      
      <Text style={text}>
        <strong>Next Service:</strong> {nextServiceDate} at {nextServiceTime}
      </Text>
    </Section>

    <Text style={text}>
      This special pricing will continue for all your future {frequency} services. 
      We appreciate your loyalty and look forward to continuing to serve you!
    </Text>

    <Text style={text}>
      <strong>What's next?</strong> Your service will continue as scheduled with your 
      new discounted pricing. No action needed from you!
    </Text>

    <Section style={buttonSection}>
      <Button href="https://bayareacleaningpros.com/my-services" style={button}>
        View My Services
      </Button>
    </Section>

    <Text style={smallText}>
      Questions about your discount? Contact us at support@bayareacleaningpros.com or (281) 201-6112
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

const discountSection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  textAlign: 'center' as const,
  border: '2px solid #22c55e',
}

const discountLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
}

const originalPrice = {
  color: '#9ca3af',
  fontSize: '18px',
  textDecoration: 'line-through',
  margin: '0',
}

const discountedPrice = {
  color: '#22c55e',
  fontSize: '32px',
  fontWeight: '700',
  margin: '8px 0',
}

const savingsText = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 24px 0',
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

export default RetentionDiscountEmail