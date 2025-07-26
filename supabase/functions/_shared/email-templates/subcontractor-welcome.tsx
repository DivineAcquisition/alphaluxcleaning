import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface SubcontractorWelcomeEmailProps {
  fullName: string;
  planName: string;
  share: string;
  fee: string;
  jobs: string;
  dashboardUrl?: string;
}

export const SubcontractorWelcomeEmail = ({
  fullName,
  planName,
  share,
  fee,
  jobs,
  dashboardUrl,
}: SubcontractorWelcomeEmailProps) => (
  <BaseEmailTemplate previewText={`Welcome to Bay Area Cleaning Professionals, ${fullName}! Your journey starts now.`}>
    
    {/* Welcome Header */}
    <Section style={welcomeSection}>
      <Heading style={welcomeHeading}>🎉 Welcome to the Team!</Heading>
      <Text style={welcomeText}>
        Congratulations {fullName}! You've successfully joined our network of professional cleaning subcontractors with the <strong>{planName}</strong> plan.
      </Text>
    </Section>

    {/* Plan Details */}
    <Section style={planSection}>
      <Heading style={sectionHeading}>📋 Your Plan Details</Heading>
      <div style={planGrid}>
        <div style={planItem}>
          <span style={planIcon}>💰</span>
          <div>
            <Text style={planLabel}>Your Share</Text>
            <Text style={planValue}>{share} of each completed job</Text>
          </div>
        </div>
        <div style={planItem}>
          <span style={planIcon}>💳</span>
          <div>
            <Text style={planLabel}>Monthly Fee</Text>
            <Text style={planValue}>{fee}</Text>
          </div>
        </div>
        <div style={planItem}>
          <span style={planIcon}>📅</span>
          <div>
            <Text style={planLabel}>Job Opportunity</Text>
            <Text style={planValue}>{jobs}</Text>
          </div>
        </div>
      </div>
    </Section>

    {/* What's Next */}
    <Section style={stepsSection}>
      <Heading style={sectionHeading}>🚀 What's Next?</Heading>
      <div style={stepsList}>
        <div style={step}>
          <span style={stepNumber}>1</span>
          <div>
            <Text style={stepTitle}>Browse Available Jobs</Text>
            <Text style={stepDescription}>Check your dashboard for cleaning opportunities in your area</Text>
          </div>
        </div>
        <div style={step}>
          <span style={stepNumber}>2</span>
          <div>
            <Text style={stepTitle}>Accept & Complete Jobs</Text>
            <Text style={stepDescription}>Start earning by completing high-quality cleaning services</Text>
          </div>
        </div>
        <div style={step}>
          <span style={stepNumber}>3</span>
          <div>
            <Text style={stepTitle}>Maintain Excellence</Text>
            <Text style={stepDescription}>Keep service quality high to maintain your position in our network</Text>
          </div>
        </div>
        <div style={step}>
          <span style={stepNumber}>4</span>
          <div>
            <Text style={stepTitle}>Track Performance</Text>
            <Text style={stepDescription}>Monitor your earnings and performance metrics through the dashboard</Text>
          </div>
        </div>
      </div>
    </Section>

    {/* Important Notice */}
    <Section style={noticeSection}>
      <Heading style={noticeHeading}>⚠️ Important Notice</Heading>
      <Text style={noticeText}>
        To maintain our service standards and ensure reliability for our customers, 
        please note that dropping more than 2 jobs within 48 hours in a month will 
        result in temporary restrictions on your account.
      </Text>
    </Section>

    {/* CTA Button */}
    {dashboardUrl && (
      <Section style={ctaSection}>
        <Button href={dashboardUrl} style={ctaButton}>
          🏠 Access Your Dashboard
        </Button>
      </Section>
    )}

    {/* Success Message */}
    <Section style={successSection}>
      <Text style={successText}>
        🌟 Welcome to the Bay Area Cleaning Professionals family! We're excited to work with you 
        and help you build a successful cleaning business.
      </Text>
    </Section>

  </BaseEmailTemplate>
)

// Styles
const welcomeSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
  textAlign: 'center' as const,
}

const welcomeHeading = {
  color: '#047857',
  margin: '0 0 20px 0',
  fontSize: '32px',
  fontWeight: '700',
}

const welcomeText = {
  color: '#374151',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0',
}

const planSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 25px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const planGrid = {
  display: 'grid',
  gap: '20px',
}

const planItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  border: '1px solid #E9D5FF',
}

const planIcon = {
  fontSize: '24px',
  lineHeight: '1',
}

const planLabel = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 5px 0',
}

const planValue = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
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
  gap: '20px',
}

const step = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
}

const stepNumber = {
  backgroundColor: '#3B82F6',
  color: 'white',
  width: '35px',
  height: '35px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '16px',
  flexShrink: '0',
}

const stepTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 5px 0',
}

const stepDescription = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const noticeSection = {
  backgroundColor: '#FEF3C7',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #FDE68A',
  borderLeft: '5px solid #F59E0B',
}

const noticeHeading = {
  color: '#92400E',
  margin: '0 0 15px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const noticeText = {
  color: '#374151',
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

const successSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center' as const,
}

const successText = {
  color: '#047857',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0',
  fontWeight: '500',
}

export default SubcontractorWelcomeEmail