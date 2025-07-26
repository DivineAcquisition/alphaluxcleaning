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
    
    {/* Status Header */}
    <Section style={isApproved ? approvedSection : rejectedSection}>
      <Heading style={statusHeading}>
        {isApproved ? '🎉 Congratulations!' : '📧 Application Update'}
      </Heading>
      <Text style={statusText}>
        Dear {applicantName},
      </Text>
      <Text style={statusText}>
        {isApproved 
          ? 'We are excited to inform you that your application to join Bay Area Cleaning Professionals as a subcontractor has been APPROVED! 🎊'
          : 'Thank you for your interest in joining Bay Area Cleaning Professionals. After careful review, we have decided not to move forward with your application at this time.'
        }
      </Text>
    </Section>

    {isApproved ? (
      <>
        {/* Benefits Section */}
        <Section style={benefitsSection}>
          <Heading style={sectionHeading}>✨ Your Benefits</Heading>
          <div style={benefitsList}>
            <div style={benefit}>
              <span style={benefitIcon}>💰</span>
              <Text style={benefitText}>Competitive revenue sharing</Text>
            </div>
            <div style={benefit}>
              <span style={benefitIcon}>📅</span>
              <Text style={benefitText}>Flexible scheduling</Text>
            </div>
            <div style={benefit}>
              <span style={benefitIcon}>🎽</span>
              <Text style={benefitText}>Branded uniform shirt provided</Text>
            </div>
            <div style={benefit}>
              <span style={benefitIcon}>🧽</span>
              <Text style={benefitText}>All supplies and equipment included</Text>
            </div>
            <div style={benefit}>
              <span style={benefitIcon}>📱</span>
              <Text style={benefitText}>Easy-to-use mobile platform</Text>
            </div>
          </div>
        </Section>

        {/* Next Steps */}
        <Section style={stepsSection}>
          <Heading style={sectionHeading}>🚀 Next Steps</Heading>
          <div style={stepsList}>
            <div style={step}>
              <span style={stepNumber}>1</span>
              <Text style={stepText}>Complete your onboarding process</Text>
            </div>
            <div style={step}>
              <span style={stepNumber}>2</span>
              <Text style={stepText}>Receive your branded uniform shirt</Text>
            </div>
            <div style={step}>
              <span style={stepNumber}>3</span>
              <Text style={stepText}>Start accepting cleaning jobs in your area</Text>
            </div>
            <div style={step}>
              <span style={stepNumber}>4</span>
              <Text style={stepText}>Begin earning with our partnership program</Text>
            </div>
          </div>
        </Section>

        {/* CTA Button */}
        {onboardingUrl && (
          <Section style={ctaSection}>
            <Button href={onboardingUrl} style={ctaButton}>
              🚀 Start Onboarding Process
            </Button>
          </Section>
        )}
      </>
    ) : (
      <>
        {/* Rejection Message */}
        <Section style={messageSection}>
          <Text style={messageText}>
            We appreciate the time you took to apply and encourage you to consider applying again in the future as opportunities arise.
          </Text>
          {adminNotes && (
            <div style={notesSection}>
              <Text style={notesLabel}>Additional Notes:</Text>
              <Text style={notesText}>{adminNotes}</Text>
            </div>
          )}
        </Section>
      </>
    )}

    {/* Contact Section */}
    <Section style={contactSection}>
      <Heading style={sectionHeading}>📞 Questions?</Heading>
      <Text style={contactText}>
        If you have any questions, please don't hesitate to contact us. We're here to help!
      </Text>
    </Section>

  </BaseEmailTemplate>
)

// Styles
const approvedSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
}

const rejectedSection = {
  backgroundColor: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #F59E0B',
}

const statusHeading = {
  color: '#374151',
  margin: '0 0 20px 0',
  fontSize: '28px',
  fontWeight: '700',
  textAlign: 'center' as const,
}

const statusText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
}

const benefitsSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 20px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const benefitsList = {
  display: 'grid',
  gap: '15px',
}

const benefit = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const benefitIcon = {
  fontSize: '20px',
}

const benefitText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const stepsSection = {
  backgroundColor: '#F0F9FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #BAE6FD',
}

const stepsList = {
  display: 'grid',
  gap: '15px',
}

const step = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
}

const stepNumber = {
  backgroundColor: '#3B82F6',
  color: 'white',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '14px',
  flexShrink: '0',
}

const stepText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const messageSection = {
  backgroundColor: '#FEF3C7',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #FDE68A',
}

const messageText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
}

const notesSection = {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: 'rgba(251, 191, 36, 0.1)',
  borderRadius: '8px',
}

const notesLabel = {
  color: '#92400E',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const notesText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const contactSection = {
  backgroundColor: '#F3F4F6',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  textAlign: 'center' as const,
}

const contactText = {
  color: '#6B7280',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const ctaButton = {
  backgroundColor: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
  color: 'white',
  padding: '15px 30px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)',
  display: 'inline-block',
}

export default ApplicationResponseEmail