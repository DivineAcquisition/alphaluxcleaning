import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

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
}: ApplicationResponseEmailProps) => (
  <BaseEmailTemplate previewText={isApproved ? 'Congratulations! Your application has been approved.' : 'Thank you for your application - Update on your submission.'}>
    
    <Heading style={isApproved ? approvedHeading : rejectedHeading}>
      {isApproved ? 'Congratulations!' : 'Application Update'}
    </Heading>
    
    <Text style={text}>
      Dear {applicantName},
    </Text>
    
    <Text style={text}>
      {isApproved 
        ? 'We are excited to inform you that your application to join Bay Area Cleaning Professionals as a subcontractor has been APPROVED!'
        : 'Thank you for your interest in joining Bay Area Cleaning Professionals. After careful review, we have decided not to move forward with your application at this time.'
      }
    </Text>

    {isApproved ? (
      <>
        <Section style={benefitsSection}>
          <Heading style={subHeading}>Your Benefits</Heading>
          <Text style={text}>• Competitive revenue sharing</Text>
          <Text style={text}>• Flexible scheduling</Text>
          <Text style={text}>• Branded uniform shirt provided</Text>
          <Text style={text}>• All supplies and equipment included</Text>
          <Text style={text}>• Easy-to-use mobile platform</Text>
        </Section>

        <Text style={text}>
          <strong>Next Steps:</strong><br />
          1. Complete your onboarding process<br />
          2. Receive your branded uniform shirt<br />
          3. Start accepting cleaning jobs in your area<br />
          4. Begin earning with our partnership program
        </Text>

        {onboardingUrl && (
          <Section style={buttonSection}>
            <Button href={onboardingUrl} style={button}>
              Start Onboarding Process
            </Button>
          </Section>
        )}
      </>
    ) : (
      <>
        <Text style={text}>
          We appreciate the time you took to apply and encourage you to consider applying again in the future as opportunities arise.
        </Text>
        
        {adminNotes && (
          <Section style={notesSection}>
            <Text style={notesLabel}>Additional Notes:</Text>
            <Text style={text}>{adminNotes}</Text>
          </Section>
        )}
      </>
    )}

    <Text style={smallText}>
      If you have any questions, please don't hesitate to contact us. We're here to help!
    </Text>

  </BaseEmailTemplate>
)

// Simple styles
const approvedHeading = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const rejectedHeading = {
  color: '#f59e0b',
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

const benefitsSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const notesSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const notesLabel = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
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

export default ApplicationResponseEmail