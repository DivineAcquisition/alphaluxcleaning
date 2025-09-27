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

interface ApplicationResponseEmailProps {
  applicantName: string;
  isApproved: boolean;
  adminNotes?: string;
  onboardingUrl?: string;
}

export const ApplicationResponseEmail = ({
  applicantName,
  isApproved,
  adminNotes,
  onboardingUrl,
}: ApplicationResponseEmailProps) => {
  const previewText = isApproved 
    ? `Congratulations ${applicantName}! Your application has been approved.`
    : `Thank you for your interest, ${applicantName}. Application update.`;

  return (
    <EmailBase preview={previewText}>
      <Section style={section}>
        <Heading style={h1}>
          {isApproved ? '🎉 Application Approved!' : 'Application Update'}
        </Heading>
        
        <Text style={text}>
          Hi {applicantName},
        </Text>

        {isApproved ? (
          <>
            <Text style={text}>
              <strong>Congratulations!</strong> We're excited to inform you that your application to join Bay Area Cleaning Pros has been <strong>approved</strong>.
            </Text>
            
            <Text style={text}>
              Welcome to our team! We're thrilled to have you as part of our professional cleaning network.
            </Text>

            {onboardingUrl && (
              <>
                <Text style={text}>
                  To get started, please complete your onboarding process by clicking the button below:
                </Text>
                
                <ActionButton href={onboardingUrl}>
                  Complete Onboarding
                </ActionButton>
              </>
            )}

            <Text style={text}>
              <strong>Next Steps:</strong>
            </Text>
            <Text style={text}>
              • Complete your onboarding documentation<br />
              • Set up your profile and availability<br />
              • Review our service standards and procedures<br />
              • Start receiving job assignments
            </Text>
          </>
        ) : (
          <>
            <Text style={text}>
              Thank you for your interest in joining Bay Area Cleaning Pros. After careful review, we have decided not to move forward with your application at this time.
            </Text>
            
            <Text style={text}>
              We appreciate the time you took to apply and wish you the best in your future endeavors.
            </Text>
          </>
        )}

        {adminNotes && (
          <Section style={notesSection}>
            <Text style={notesHeader}>
              <strong>Additional Notes:</strong>
            </Text>
            <Text style={notesText}>
              {adminNotes}
            </Text>
          </Section>
        )}

        <Text style={text}>
          If you have any questions, please don't hesitate to contact our team.
        </Text>

        <Text style={text}>
          Best regards,<br />
          Bay Area Cleaning Pros Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default ApplicationResponseEmail;

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

const notesSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const notesHeader = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const notesText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  fontStyle: 'italic',
};