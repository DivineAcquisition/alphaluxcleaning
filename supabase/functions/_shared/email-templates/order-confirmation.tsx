import {
  Button,
  Section,
  Text,
  Heading,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { BaseEmailTemplate } from "./base-template.tsx";

export interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  cleaningType: string;
  frequency: string;
  squareFootage?: string;
  addOns: string;
  amount: string;
  serviceDetailsUrl: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isSchedulingConfirmation?: boolean;
}

export function OrderConfirmationEmail({
  customerName = "Valued Customer",
  orderId = "ORDER123",
  cleaningType = "Deep Cleaning",
  frequency = "One-time",
  squareFootage,
  addOns = "None",
  amount = "0.00",
  serviceDetailsUrl = "#",
  scheduledDate,
  scheduledTime,
  isSchedulingConfirmation = false,
}: OrderConfirmationEmailProps) {
  const previewText = `Order confirmation for your ${cleaningType} service - ${orderId}`;

  return (
    <BaseEmailTemplate previewText={previewText}>
      
      <Heading style={heading}>
        {isSchedulingConfirmation ? 'Scheduling Request Confirmed!' : 'Order Confirmed!'}
      </Heading>
      
      <Text style={text}>
        Hello {customerName}, thank you for choosing Bay Area Cleaning Pros! 
        {isSchedulingConfirmation 
          ? 'Your scheduling request has been received and our team will contact you to confirm availability.'
          : 'Your cleaning service has been successfully booked.'
        }
      </Text>

      <Section style={detailsSection}>
        <Heading style={subHeading}>Order Details</Heading>
        
        <Text style={detailText}><strong>Order ID:</strong> #{orderId}</Text>
        <Text style={detailText}><strong>Service Type:</strong> {cleaningType}</Text>
        <Text style={detailText}><strong>Frequency:</strong> {frequency}</Text>
        {squareFootage && (
          <Text style={detailText}><strong>Square Footage:</strong> {squareFootage} sq ft</Text>
        )}
        <Text style={detailText}><strong>Add-ons:</strong> {addOns}</Text>
        {scheduledDate && scheduledTime && (
          <>
            <Text style={detailText}><strong>Requested Date:</strong> {new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={detailText}><strong>Requested Time:</strong> {scheduledTime}</Text>
          </>
        )}
        <Text style={totalText}><strong>Total Amount:</strong> ${amount}</Text>
      </Section>

      <Text style={text}>
        <strong>What's Next?</strong><br />
        {isSchedulingConfirmation ? (
          <>
            1. A team member will contact you within 24 hours to confirm your requested time slot<br />
            2. We'll finalize any remaining service details<br />
            3. Our professional team will arrive ready to clean
          </>
        ) : (
          <>
            1. Complete your service details (address, special instructions, etc.)<br />
            2. Schedule your preferred date and time<br />
            3. Our professional team will arrive ready to clean
          </>
        )}
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={serviceDetailsUrl}>
          View Order Status
        </Button>
      </Section>

      <Section style={buttonSection}>
        <Button style={smsButton} href="sms:2818099901?body=Hi, I need live support for my cleaning service booking.">
          Text Us for Live Support
        </Button>
      </Section>

      <Text style={smallText}>
        Need help? Contact us at support@bayareacleaningpros.com or (281) 201-6112
      </Text>

    </BaseEmailTemplate>
  );
}

// Simple styles
const heading = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const subHeading = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 15px 0',
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

const detailText = {
  color: '#374151',
  fontSize: '14px',
  margin: '0 0 8px 0',
}

const totalText = {
  color: '#10b981',
  fontSize: '16px',
  fontWeight: '600',
  margin: '15px 0 0 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
}

const smsButton = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
  marginTop: '10px',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
}