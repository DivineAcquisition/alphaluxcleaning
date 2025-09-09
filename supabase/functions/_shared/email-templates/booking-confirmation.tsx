import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface BookingConfirmationEmailProps {
  customer_name: string;
  service_date: string;
  service_time: string;
  service_address?: string;
  service_type?: string;
  portal_url?: string;
}

export const BookingConfirmationEmail = ({ 
  customer_name, 
  service_date, 
  service_time,
  service_address,
  service_type,
  portal_url 
}: BookingConfirmationEmailProps) => (
  <BaseEmailTemplate previewText={`Your cleaning is confirmed for ${service_date}`}>
    <Heading style={heading}>
      Booking Confirmed! 🎉
    </Heading>
    
    <Text style={text}>
      Hi {customer_name},
    </Text>
    
    <Text style={text}>
      Great news! Your cleaning service has been confirmed. Here are the details:
    </Text>
    
    <Section style={detailsSection}>
      <Text style={detailItem}>
        <strong>Date:</strong> {service_date}
      </Text>
      <Text style={detailItem}>
        <strong>Time:</strong> {service_time}
      </Text>
      {service_address && (
        <Text style={detailItem}>
          <strong>Address:</strong> {service_address}
        </Text>
      )}
      {service_type && (
        <Text style={detailItem}>
          <strong>Service:</strong> {service_type}
        </Text>
      )}
    </Section>
    
    <Text style={text}>
      Our professional cleaning team will arrive at your scheduled time. We'll send you a reminder 24 hours before your appointment.
    </Text>
    
    {portal_url && (
      <>
        <Hr style={hr} />
        <Text style={text}>
          You can view your booking details and manage your account in your customer portal:
        </Text>
        <Section style={buttonSection}>
          <a href={portal_url} style={button}>
            View Customer Portal
          </a>
        </Section>
      </>
    )}
    
    <Text style={text}>
      Questions? Just reply to this email or call us at (415) 987-6543.
    </Text>
  </BaseEmailTemplate>
)

const heading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const detailsSection = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const detailItem = {
  color: '#374151',
  fontSize: '16px',
  margin: '8px 0',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '20px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#A58FFF',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

export default BookingConfirmationEmail