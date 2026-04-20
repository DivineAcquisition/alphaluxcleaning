import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EmailBase, ActionButton } from './email-base.tsx';

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
  dashboardUrl: string;
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
}: JobAssignmentNotificationProps) => {
  return (
    <EmailBase preview={`New job assignment for ${customerName}`}>
      <Section style={section}>
        <Heading style={h1}>
          🔔 New Job Assignment
        </Heading>
        
        <Text style={text}>
          Hi {subcontractorName},
        </Text>

        <Text style={text}>
          You have been assigned a new cleaning job! Please review the details below and respond within 24 hours.
        </Text>

        <Section style={jobDetailsSection}>
          <Text style={sectionHeader}>
            📍 Job Details
          </Text>
          
          <Text style={detailText}>
            <strong>Customer:</strong> {customerName}
          </Text>
          
          <Text style={detailText}>
            <strong>Service Type:</strong> {serviceType}
          </Text>
          
          <Text style={detailText}>
            <strong>Date:</strong> {serviceDate}
          </Text>
          
          <Text style={detailText}>
            <strong>Time:</strong> {serviceTime}
          </Text>
          
          <Text style={detailText}>
            <strong>Address:</strong> {serviceAddress}
          </Text>

          {specialInstructions && (
            <Text style={detailText}>
              <strong>Special Instructions:</strong> {specialInstructions}
            </Text>
          )}
        </Section>

        <Section style={paymentSection}>
          <Text style={sectionHeader}>
            💰 Payment Information
          </Text>
          
          <Text style={detailText}>
            <strong>Job Value:</strong> {paymentAmount}
          </Text>
          
          <Text style={detailText}>
            <strong>Your Share:</strong> {splitAmount}
          </Text>
        </Section>

        <Text style={urgentText}>
          ⏰ Please respond by: {acceptDeadline}
        </Text>

        <ActionButton href={dashboardUrl}>
          View Job & Respond
        </ActionButton>

        <Text style={text}>
          Click the button above to access your subcontractor portal where you can accept or decline this assignment.
        </Text>

        <Text style={text}>
          If you don't respond within 24 hours, this job may be reassigned to another subcontractor.
        </Text>

        <Text style={text}>
          Thank you for being part of our team!
        </Text>

        <Text style={text}>
          Best regards,<br />
          The AlphaLux Cleaning Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default JobAssignmentNotification;

// Styles
const section = {
  padding: '0 20px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const jobDetailsSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const paymentSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const sectionHeader = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const detailText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const urgentText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '12px',
  margin: '20px 0',
  textAlign: 'center' as const,
};