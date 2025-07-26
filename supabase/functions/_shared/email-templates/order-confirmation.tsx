import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  cleaningType: string;
  frequency: string;
  squareFootage?: string;
  addOns: string;
  amount: string;
  serviceDetailsUrl: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  orderId,
  cleaningType,
  frequency,
  squareFootage,
  addOns,
  amount,
  serviceDetailsUrl,
}: OrderConfirmationEmailProps) => (
  <BaseEmailTemplate previewText={`Order confirmed! Thank you for choosing Bay Area Cleaning Professionals.`}>
    
    {/* Success Header */}
    <Section style={successSection}>
      <Heading style={successHeading}>✅ Order Confirmed!</Heading>
      <Text style={successText}>
        Thank you for choosing Bay Area Cleaning Professionals, {customerName}! 
        Your cleaning service has been successfully booked.
      </Text>
    </Section>

    {/* Order Details */}
    <Section style={detailsSection}>
      <Heading style={sectionHeading}>📋 Service Details</Heading>
      <div style={detailsGrid}>
        <div style={detailRow}>
          <span style={detailLabel}>Order ID:</span>
          <span style={detailValue}>{orderId}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Service Type:</span>
          <span style={detailValue}>{cleaningType}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Frequency:</span>
          <span style={detailValue}>{frequency}</span>
        </div>
        {squareFootage && (
          <div style={detailRow}>
            <span style={detailLabel}>Square Footage:</span>
            <span style={detailValue}>{squareFootage} sq ft</span>
          </div>
        )}
        <div style={detailRow}>
          <span style={detailLabel}>Add-ons:</span>
          <span style={detailValue}>{addOns}</span>
        </div>
        <div style={{...detailRow, ...totalRow}}>
          <span style={totalLabel}>Total Amount:</span>
          <span style={totalValue}>${amount}</span>
        </div>
      </div>
    </Section>

    {/* Next Steps */}
    <Section style={stepsSection}>
      <Heading style={sectionHeading}>🚀 What's Next?</Heading>
      <div style={stepsList}>
        <div style={step}>
          <span style={stepNumber}>1</span>
          <Text style={stepText}>
            <strong>Complete Service Details:</strong> Provide your address and scheduling preferences
          </Text>
        </div>
        <div style={step}>
          <span style={stepNumber}>2</span>
          <Text style={stepText}>
            <strong>Confirmation Call:</strong> We'll contact you within 24 hours to confirm your appointment
          </Text>
        </div>
        <div style={step}>
          <span style={stepNumber}>3</span>
          <Text style={stepText}>
            <strong>Professional Service:</strong> Our team arrives with all supplies and equipment
          </Text>
        </div>
      </div>
    </Section>

    {/* CTA Button */}
    <Section style={ctaSection}>
      <Button href={serviceDetailsUrl} style={ctaButton}>
        Complete Service Details
      </Button>
    </Section>

  </BaseEmailTemplate>
)

// Styles
const successSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
}

const successHeading = {
  color: '#047857',
  margin: '0 0 15px 0',
  fontSize: '24px',
  fontWeight: '700',
  textAlign: 'center' as const,
}

const successText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}

const detailsSection = {
  backgroundColor: '#F9FAFB',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E5E7EB',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 20px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const detailsGrid = {
  display: 'grid',
  gap: '12px',
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
}

const detailLabel = {
  color: '#6B7280',
  fontWeight: '500',
}

const detailValue = {
  color: '#111827',
  fontWeight: '600',
}

const totalRow = {
  borderTop: '2px solid #E5E7EB',
  paddingTop: '15px',
  marginTop: '10px',
}

const totalLabel = {
  color: '#111827',
  fontWeight: '700',
  fontSize: '18px',
}

const totalValue = {
  color: '#059669',
  fontWeight: '700',
  fontSize: '18px',
}

const stepsSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const stepsList = {
  display: 'grid',
  gap: '20px',
}

const step = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
}

const stepNumber = {
  backgroundColor: '#8B5CF6',
  color: 'white',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '14px',
  flexShrink: '0',
}

const stepText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const ctaButton = {
  backgroundColor: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
  color: 'white',
  padding: '15px 30px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)',
  display: 'inline-block',
}

export default OrderConfirmationEmail