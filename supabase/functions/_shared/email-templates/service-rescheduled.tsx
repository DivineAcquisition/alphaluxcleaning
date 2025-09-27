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

interface ServiceRescheduledEmailProps {
  customerName: string;
  originalDate: string;
  newDate: string;
  serviceType: string;
  rescheduleReason?: string;
}

export const ServiceRescheduledEmail = ({
  customerName,
  originalDate,
  newDate,
  serviceType,
  rescheduleReason,
}: ServiceRescheduledEmailProps) => {
  return (
    <EmailBase preview="Your service has been rescheduled">
      <Section style={section}>
        <Heading style={h1}>
          Service Rescheduled
        </Heading>
        
        <Text style={text}>
          Hi {customerName},
        </Text>

        <Text style={text}>
          We wanted to let you know that your {serviceType} service has been rescheduled.
        </Text>

        <Section style={detailsSection}>
          <Text style={detailsText}>
            <strong>Original Date:</strong> {originalDate}
          </Text>
          <Text style={detailsText}>
            <strong>New Date:</strong> {newDate}
          </Text>
          <Text style={detailsText}>
            <strong>Service:</strong> {serviceType}
          </Text>
        </Section>

        {rescheduleReason && (
          <>
            <Text style={text}>
              <strong>Reason for reschedule:</strong>
            </Text>
            <Text style={reasonText}>
              {rescheduleReason}
            </Text>
          </>
        )}

        <Text style={text}>
          We apologize for any inconvenience this may cause and appreciate your understanding.
        </Text>

        <Text style={text}>
          If you have any questions or need to make further changes to your appointment, please don't hesitate to contact us.
        </Text>

        <Text style={text}>
          Thank you for choosing our services!
        </Text>

        <Text style={text}>
          Best regards,<br />
          The Cleaning Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default ServiceRescheduledEmail;

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

const detailsSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const detailsText = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '8px 0',
};

const reasonText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  fontStyle: 'italic',
  margin: '8px 0',
};