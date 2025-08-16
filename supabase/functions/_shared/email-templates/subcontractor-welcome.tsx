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
    
    <Heading style={heading}>Welcome to the Team!</Heading>
    
    <Text style={text}>
      Congratulations {fullName}! You've successfully joined our network of professional cleaning subcontractors with the <strong>{planName}</strong> plan.
    </Text>

    <Section style={planSection}>
      <Heading style={subHeading}>Your Plan Details</Heading>
      <Text style={text}><strong>Your Share:</strong> {share} of each completed job</Text>
      <Text style={text}><strong>Monthly Fee:</strong> {fee}</Text>
      <Text style={text}><strong>Job Opportunity:</strong> {jobs}</Text>
    </Section>

    <Section style={trainingSection}>
      <Heading style={subHeading}>📚 Training & Supplies Information</Heading>
      <Text style={text}>
        <strong>Training Access:</strong> Check your email for training materials and video access. Complete all required training modules before your first job assignment.
      </Text>
      <Text style={text}>
        <strong>Uniform & Supplies:</strong> Your branded shirts and cleaning supplies will be shipped to you within 2-7 business days. You'll receive tracking information via email.
      </Text>
    </Section>

    <Text style={text}>
      <strong>What's Next?</strong><br />
      1. Check Your Email - Look for training materials and complete all required modules<br />
      2. Wait for Supplies - Your uniform and cleaning supplies are on the way (2-7 business days)<br />
      3. Browse Available Jobs - Check your dashboard for cleaning opportunities in your area<br />
      4. Accept & Complete Jobs - Start earning by completing high-quality cleaning services<br />
      5. Track Performance - Monitor your earnings and performance metrics through the dashboard
    </Text>

    <Section style={noticeSection}>
      <Text style={noticeText}>
        <strong>Important Notice:</strong> To maintain our service standards and ensure reliability for our customers, 
        please note that dropping more than 2 jobs within 48 hours in a month will 
        result in temporary restrictions on your account.
      </Text>
    </Section>

    {dashboardUrl && (
      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={button}>
          Access Your Dashboard
        </Button>
      </Section>
    )}

    <Text style={text}>
      Welcome to the Bay Area Cleaning Professionals family! We're excited to work with you 
      and help you build a successful cleaning business.
    </Text>

  </BaseEmailTemplate>
)

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

const planSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const trainingSection = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const noticeSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
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

export default SubcontractorWelcomeEmail