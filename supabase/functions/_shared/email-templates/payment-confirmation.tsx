import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface PaymentConfirmationProps {
  subcontractorName: string;
  paymentAmount: string;
  jobDetails: {
    customerName: string;
    serviceDate: string;
    serviceAddress: string;
    serviceType: string;
    totalAmount: string;
    splitPercentage: string;
  };
  paymentMethod: string;
  paymentDate: string;
  ytdEarnings?: string;
  dashboardUrl?: string;
}

export const PaymentConfirmation = ({
  subcontractorName,
  paymentAmount,
  jobDetails,
  paymentMethod,
  paymentDate,
  ytdEarnings,
  dashboardUrl,
}: PaymentConfirmationProps) => (
  <BaseEmailTemplate previewText={`Payment received: ${paymentAmount} for ${jobDetails.customerName} service`}>
    
    <Heading style={heading}>Payment Received! 💰</Heading>
    
    <Text style={text}>
      Hi {subcontractorName}, great news! Your payment for the recent cleaning service has been processed.
    </Text>

    <Section style={paymentSection}>
      <Heading style={subHeading}>Payment Details</Heading>
      <Text style={amountText}>Amount Received: <span style={amountHighlight}>{paymentAmount}</span></Text>
      <Text style={detailText}><strong>Payment Date:</strong> {paymentDate}</Text>
      <Text style={detailText}><strong>Payment Method:</strong> {paymentMethod}</Text>
    </Section>

    <Section style={jobSection}>
      <Heading style={subHeading}>Service Breakdown</Heading>
      <Text style={detailText}><strong>Customer:</strong> {jobDetails.customerName}</Text>
      <Text style={detailText}><strong>Service Date:</strong> {jobDetails.serviceDate}</Text>
      <Text style={detailText}><strong>Service Type:</strong> {jobDetails.serviceType}</Text>
      <Text style={detailText}><strong>Address:</strong> {jobDetails.serviceAddress}</Text>
      
      <div style={breakdownContainer}>
        <Text style={breakdownText}>Total Job Value: {jobDetails.totalAmount}</Text>
        <Text style={breakdownText}>Your Split ({jobDetails.splitPercentage}): {paymentAmount}</Text>
        <Text style={breakdownText}>Company Share: {(parseFloat(jobDetails.totalAmount.replace('$', '')) - parseFloat(paymentAmount.replace('$', ''))).toFixed(2)}</Text>
      </div>
    </Section>

    {ytdEarnings && (
      <Section style={summarySection}>
        <Text style={summaryText}>
          <strong>Year-to-Date Earnings:</strong> {ytdEarnings}
        </Text>
      </Section>
    )}

    {dashboardUrl && (
      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={button}>
          View Payment History
        </Button>
      </Section>
    )}

    <Text style={text}>
      Thank you for your excellent service! Keep up the great work.
    </Text>

  </BaseEmailTemplate>
)

// Styles
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

const detailText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const amountText = {
  color: '#374151',
  fontSize: '18px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
}

const amountHighlight = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '700',
}

const paymentSection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  border: '2px solid #10b981',
}

const jobSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const breakdownContainer = {
  backgroundColor: '#ffffff',
  padding: '15px',
  borderRadius: '4px',
  margin: '15px 0',
  border: '1px solid #e5e7eb',
}

const breakdownText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '5px 0',
}

const summarySection = {
  backgroundColor: '#eff6ff',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
}

const summaryText = {
  color: '#1e40af',
  fontSize: '16px',
  margin: '0',
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

export default PaymentConfirmation