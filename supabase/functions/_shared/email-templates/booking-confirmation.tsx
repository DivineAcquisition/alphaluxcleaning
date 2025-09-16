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
  deposit_amount?: string;
  total_amount?: string;
  remaining_balance?: string;
  order_id?: string;
}

export const BookingConfirmationEmail = ({ 
  customer_name, 
  service_date, 
  service_time,
  service_address,
  service_type,
  portal_url,
  deposit_amount,
  total_amount,
  remaining_balance,
  order_id
}: BookingConfirmationEmailProps) => (
  <BaseEmailTemplate previewText={`Your cleaning is confirmed for ${service_date}`}>
    <Heading style={heading}>
      Booking Confirmed! 🎉
    </Heading>
    
    <Text style={text}>
      Hi {customer_name},
    </Text>
    
    <Text style={text}>
      Great news! Your cleaning service has been successfully scheduled and your 20% deposit has been received.
    </Text>
    
    {deposit_amount && (
      <Section style={paymentSection}>
        <Text style={paymentHeader}>Payment Details</Text>
        <Text style={paymentItem}>
          <strong>20% Deposit Paid:</strong> {deposit_amount}
        </Text>
        <Text style={paymentItem}>
          <strong>Total Service Cost:</strong> {total_amount}
        </Text>
        <Text style={paymentItem}>
          <strong>Remaining Balance:</strong> {remaining_balance}
        </Text>
        <Text style={paymentNote}>
          The remaining balance will be collected after your service is completed.
        </Text>
      </Section>
    )}
    
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
      <strong>What happens next:</strong>
    </Text>
    <Text style={text}>
      • Check your email for this confirmation<br/>
      • A representative will contact you within 24 hours to confirm your booking<br/>
      • We'll send you a reminder 24 hours before your appointment<br/>
      • Our professional cleaning team will arrive at your scheduled time
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
    
    {order_id && (
      <Text style={text}>
        <strong>Order ID:</strong> {order_id}
      </Text>
    )}
    
    <Text style={text}>
      Questions? Just reply to this email or call us at (281) 809-9901.
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

const paymentSection = {
  background: '#e3f2fd',
  border: '1px solid #bbdefb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const paymentHeader = {
  color: '#1565c0',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const paymentItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '6px 0',
}

const paymentNote = {
  color: '#6b7280',
  fontSize: '12px',
  fontStyle: 'italic',
  margin: '12px 0 0 0',
}

export default BookingConfirmationEmail