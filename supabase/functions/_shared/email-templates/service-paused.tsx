import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface ServicePausedEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  pausedUntil: string;
  lastServiceDate: string;
  serviceAddress?: string;
}

export const ServicePausedEmail = ({
  customerName,
  cleaningType,
  frequency,
  pausedUntil,
  lastServiceDate,
  serviceAddress,
}: ServicePausedEmailProps) => (
  <BaseEmailTemplate previewText={`${customerName}, your ${cleaningType} service has been paused until ${pausedUntil}`}>
    
    <Heading style={heading}>Service Temporarily Paused</Heading>
    
    <Text style={text}>
      Hi {customerName}, we've successfully paused your <strong>{cleaningType}</strong> service as requested. 
      Your service is now on hold and no charges will occur during this period.
    </Text>

    <Section style={detailsSection}>
      <Text style={text}><strong>Service Type:</strong> {cleaningType}</Text>
      <Text style={text}><strong>Frequency:</strong> {frequency}</Text>
      <Text style={text}><strong>Last Service Date:</strong> {lastServiceDate}</Text>
      <Text style={resumeText}><strong>Resume Date:</strong> {pausedUntil}</Text>
      {serviceAddress && (
        <Text style={text}><strong>Service Address:</strong> {serviceAddress}</Text>
      )}
    </Section>

    <Text style={text}>
      <strong>Important Information:</strong><br />
      • No charges will occur during the pause period<br />
      • Use the button below or your customer portal to resume anytime<br />
      • Service will automatically resume on {pausedUntil} unless extended<br />
      • When you resume, we'll prioritize assigning your preferred cleaning team
    </Text>

    <Section style={buttonSection}>
      <Button href="#" style={button}>
        Resume My Service Now
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
  color: '#f59e0b',
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
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const resumeText = {
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
  backgroundColor: '#059669',
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

export default ServicePausedEmail