import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface ServiceResumedEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  nextServiceDate: string;
  nextServiceTime: string;
  serviceAddress?: string;
}

export const ServiceResumedEmail = ({
  customerName,
  cleaningType,
  frequency,
  nextServiceDate,
  nextServiceTime,
  serviceAddress,
}: ServiceResumedEmailProps) => (
  <BaseEmailTemplate previewText={`Welcome back ${customerName}! Your ${cleaningType} service has been resumed`}>
    
    <Heading style={heading}>Welcome Back!</Heading>
    
    <Text style={text}>
      Hi {customerName}, we're thrilled to welcome you back! Your <strong>{cleaningType}</strong> service 
      has been successfully resumed and we're ready to provide you with the exceptional cleaning 
      experience you've come to expect.
    </Text>

    <Section style={detailsSection}>
      <Text style={text}><strong>Service Type:</strong> {cleaningType}</Text>
      <Text style={text}><strong>Frequency:</strong> {frequency}</Text>
      <Text style={nextServiceText}><strong>Next Service:</strong> {nextServiceDate} at {nextServiceTime}</Text>
      <Text style={statusText}><strong>Service Status:</strong> ACTIVE & SCHEDULED</Text>
      {serviceAddress && (
        <Text style={text}><strong>Service Address:</strong> {serviceAddress}</Text>
      )}
    </Section>

    <Text style={text}>
      <strong>What to Expect:</strong><br />
      • Our experienced, insured, and bonded cleaning professionals will arrive on time<br />
      • We bring all cleaning supplies, equipment, and eco-friendly products<br />
      • Every cleaning is backed by our satisfaction guarantee<br />
      • We'll prioritize assigning your preferred cleaning team when available
    </Text>

    <Text style={text}>
      <strong>Service Reminders:</strong><br />
      • You'll receive SMS and email reminders 24 hours before each scheduled cleaning<br />
      • Please ensure easy access to your home or provide any special entry instructions<br />
      • Let us know about any pets or special cleaning preferences through your customer portal
    </Text>

    <Section style={buttonSection}>
      <Button href="#" style={button}>
        Access Customer Portal
      </Button>
    </Section>

    <Text style={smallText}>
      Questions? Contact us at support@bayareacleaningpros.com or (415) 987-6543. 
      Available 7 days a week, 8 AM - 8 PM.
    </Text>

  </BaseEmailTemplate>
)

// Simple styles
const heading = {
  color: '#10b981',
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

const detailsSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const nextServiceText = {
  color: '#8b5cf6',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 15px 0',
}

const statusText = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 15px 0',
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

export default ServiceResumedEmail