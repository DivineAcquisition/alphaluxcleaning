import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

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
  <BaseEmailTemplate previewText="Your cleaning service has been cancelled">
    
    <Heading style={heading}>Service Cancellation Confirmed</Heading>
    
    <Text style={text}>
      Hi {customerName}, we're sorry to see you go! Your {frequency} {cleaningType} cleaning service 
      has been cancelled as requested.
    </Text>

    <Section style={statusSection}>
      <Text style={statusText}><strong>Service Status:</strong> <span style={cancelledText}>Cancelled</span></Text>
      <Text style={text}><strong>Cancellation Date:</strong> {new Date().toLocaleDateString()}</Text>
      {cancellationReason && (
        <Text style={text}><strong>Reason:</strong> {cancellationReason}</Text>
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

    <Section style={buttonSection}>
      <Button href="https://bayareacleaningpros.com" style={button}>
        Book a New Service
      </Button>
    </Section>

    <Text style={text}>
      Thank you for choosing Bay Area Cleaning Professionals. We hope to serve you again in the future!
    </Text>

    <Text style={smallText}>
      Questions? Contact us at support@bayareacleaningpros.com or (281) 201-6112
    </Text>

  </BaseEmailTemplate>
)

// Simple styles
const heading = {
  color: '#ef4444',
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

const statusSection = {
  backgroundColor: '#fef2f2',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  border: '1px solid #ef4444',
}

const statusText = {
  color: '#374151',
  fontSize: '16px',
  margin: '0 0 15px 0',
}

const cancelledText = {
  color: '#ef4444',
  fontWeight: '600',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#3b82f6',
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

export default ServiceCancelledEmail