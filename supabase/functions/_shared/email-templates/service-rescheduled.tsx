import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface ServiceRescheduledEmailProps {
  customerName: string;
  cleaningType: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  serviceAddress?: string;
}

export const ServiceRescheduledEmail = ({
  customerName,
  cleaningType,
  oldDate,
  oldTime,
  newDate,
  newTime,
  serviceAddress,
}: ServiceRescheduledEmailProps) => (
  <BaseEmailTemplate previewText={`${customerName}, your ${cleaningType} service has been rescheduled for ${newDate}`}>
    
    <Heading style={heading}>Service Rescheduled</Heading>
    
    <Text style={text}>
      Hi {customerName}, we wanted to inform you that your <strong>{cleaningType}</strong> service 
      has been rescheduled. We apologize for any inconvenience and appreciate your understanding.
    </Text>

    <Section style={scheduleSection}>
      <Text style={scheduleText}>
        <strong>Previous Schedule:</strong><br />
        {oldDate} at {oldTime}
      </Text>
      
      <Text style={newScheduleText}>
        <strong>New Schedule:</strong><br />
        {newDate} at {newTime}
      </Text>
      
      {serviceAddress && (
        <Text style={text}>
          <strong>Service Address:</strong><br />
          {serviceAddress}
        </Text>
      )}
    </Section>

    <Text style={text}>
      <strong>What to Expect:</strong><br />
      • You'll receive SMS and email reminders 24 hours before your new appointment<br />
      • Our fully insured and bonded cleaning professionals will arrive on time<br />
      • We'll provide the same exceptional {cleaningType} service you've come to expect
    </Text>

    <Section style={buttonSection}>
      <Button href="#" style={button}>
        Manage My Services
      </Button>
    </Section>

    <Text style={smallText}>
      Questions or concerns? Contact us at support@bayareacleaningpros.com or (415) 987-6543. 
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

const scheduleSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const scheduleText = {
  color: '#dc2626',
  fontSize: '16px',
  margin: '0 0 15px 0',
}

const newScheduleText = {
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

export default ServiceRescheduledEmail