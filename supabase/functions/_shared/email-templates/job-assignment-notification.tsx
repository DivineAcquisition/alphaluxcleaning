import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface JobAssignmentNotificationProps {
  subcontractorName: string;
  customerName: string;
  serviceAddress: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  specialInstructions?: string;
  paymentAmount: string;
  splitAmount: string;
  dashboardUrl?: string;
  acceptDeadline: string;
}

export const JobAssignmentNotification = ({
  subcontractorName,
  customerName,
  serviceAddress,
  serviceDate,
  serviceTime,
  serviceType,
  specialInstructions,
  paymentAmount,
  splitAmount,
  dashboardUrl,
  acceptDeadline,
}: JobAssignmentNotificationProps) => (
  <BaseEmailTemplate previewText={`New job assignment for ${serviceDate} - ${customerName}`}>
    
    <Heading style={heading}>New Job Assignment!</Heading>
    
    <Text style={text}>
      Hi {subcontractorName}, you have been assigned a new cleaning job. Please review the details below and respond by <strong>{acceptDeadline}</strong>.
    </Text>

    <Section style={jobSection}>
      <Heading style={subHeading}>Job Details</Heading>
      <Text style={detailText}><strong>Customer:</strong> {customerName}</Text>
      <Text style={detailText}><strong>Service Type:</strong> {serviceType}</Text>
      <Text style={detailText}><strong>Date & Time:</strong> {serviceDate} at {serviceTime}</Text>
      <Text style={detailText}><strong>Address:</strong> {serviceAddress}</Text>
      <Text style={detailText}><strong>Your Earnings:</strong> {splitAmount} (from total {paymentAmount})</Text>
      
      {specialInstructions && (
        <>
          <Text style={detailText}><strong>Special Instructions:</strong></Text>
          <Text style={instructionsText}>{specialInstructions}</Text>
        </>
      )}
    </Section>

    <Section style={noticeSection}>
      <Text style={noticeText}>
        <strong>Response Required:</strong> Please accept or decline this job by {acceptDeadline}. 
        Late responses may result in the job being reassigned.
      </Text>
    </Section>

    {dashboardUrl && (
      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={acceptButton}>
          View Job & Respond
        </Button>
      </Section>
    )}

    <Text style={text}>
      Thank you for being part of our team! If you have any questions about this job, please contact support.
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

const instructionsText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  fontStyle: 'italic',
  padding: '10px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  margin: '5px 0 15px 0',
}

const jobSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const noticeSection = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
}

const noticeText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const acceptButton = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
}

export default JobAssignmentNotification