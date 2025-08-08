import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface ExistingCleanerWelcomeEmailProps {
  fullName: string;
  onboardingToken: string;
  dashboardPassword: string;
  tierLevel: number;
  hourlyRate: number;
  monthlyFee: number;
  dashboardUrl?: string;
  onboardingUrl?: string;
}

export const ExistingCleanerWelcomeEmail = ({
  fullName,
  onboardingToken,
  dashboardPassword,
  tierLevel,
  hourlyRate,
  monthlyFee,
  dashboardUrl,
  onboardingUrl,
}: ExistingCleanerWelcomeEmailProps) => {
  const baseUrl = dashboardUrl || 'https://bay-area-cleaning-professionals.lovable.app'
  const directOnboardingUrl = onboardingUrl || `${baseUrl}/subcontractor-onboarding?token=${onboardingToken}`
  const loginUrl = `${baseUrl}/auth`
  
  const tierName = tierLevel === 3 ? 'Premium' : tierLevel === 2 ? 'Professional' : 'Standard'

  return (
    <BaseEmailTemplate previewText={`Welcome to our new digital platform, ${fullName}! You're starting at the ${tierName} tier.`}>
      
      <Heading style={heading}>Welcome to Our New Digital Platform!</Heading>
      
      <Text style={text}>
        Hi {fullName},
      </Text>

      <Text style={text}>
        We're excited to transition you to our new digital subcontractor platform! As a valued member of our cleaning team, 
        you're being set up at our <strong>{tierName} tier</strong> to recognize your experience with us.
      </Text>

      <Section style={tierSection}>
        <Heading style={subHeading}>Your Professional Tier Details</Heading>
        <Text style={text}><strong>Tier Level:</strong> {tierName} (Level {tierLevel})</Text>
        <Text style={text}><strong>Hourly Rate:</strong> ${hourlyRate.toFixed(2)}/hour</Text>
        <Text style={text}><strong>Monthly Platform Fee:</strong> ${monthlyFee.toFixed(2)}</Text>
        <Text style={text}><strong>Recognition:</strong> Starting at advanced tier for your experience</Text>
      </Section>

      <Section style={accessSection}>
        <Heading style={subHeading}>🔑 Your Access Information</Heading>
        <Text style={text}>
          <strong>Complete Your Setup (One-Time):</strong><br />
          Click the button below to complete your profile setup. This is a one-time process to get you fully set up in our new system.
        </Text>
        
        <Section style={buttonSection}>
          <Button href={directOnboardingUrl} style={primaryButton}>
            Complete Profile Setup
          </Button>
        </Section>

        <Text style={text}>
          <strong>Dashboard Login (For Daily Use):</strong><br />
          After setup, you'll use these credentials to access your dashboard:
        </Text>
        
        <Section style={credentialsSection}>
          <Text style={credentialText}><strong>Login URL:</strong> {loginUrl}</Text>
          <Text style={credentialText}><strong>Email:</strong> {/* User's email will be inserted here */}</Text>
          <Text style={credentialText}><strong>Password:</strong> <code style={passwordCode}>{dashboardPassword}</code></Text>
        </Section>

        <Text style={smallText}>
          💡 <em>Save these credentials securely! You can change your password after logging in.</em>
        </Text>
      </Section>

      <Text style={text}>
        <strong>What's New in Our Digital Platform:</strong><br />
        ✅ View and accept job assignments<br />
        ✅ Track your earnings and performance<br />
        ✅ Update your availability and profile<br />
        ✅ Communicate with the operations team<br />
        ✅ Access training resources and updates<br />
        ✅ Monitor your tier progression
      </Text>

      <Section style={nextStepsSection}>
        <Heading style={subHeading}>Next Steps:</Heading>
        <Text style={text}>
          1. <strong>Complete Setup:</strong> Click the "Complete Profile Setup" button above<br />
          2. <strong>Verify Your Information:</strong> Update any contact details or preferences<br />
          3. <strong>Start Using the Dashboard:</strong> Log in with your credentials for daily tasks<br />
          4. <strong>Contact Support:</strong> Reach out if you need any assistance with the transition
        </Text>
      </Section>

      <Text style={text}>
        Thank you for being part of our team! We're here to support you through this transition and excited 
        about the improved tools and opportunities this new platform will provide.
      </Text>

      <Text style={text}>
        <strong>Need Help?</strong><br />
        Contact our support team if you have any questions about the new platform or need assistance with setup.
      </Text>

    </BaseEmailTemplate>
  )
}

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

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '10px 0',
}

const tierSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  border: '2px solid #10b981',
}

const accessSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const nextStepsSection = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const credentialsSection = {
  backgroundColor: '#f9fafb',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  margin: '15px 0',
}

const credentialText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '5px 0',
  fontFamily: 'monospace',
}

const passwordCode = {
  backgroundColor: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#dc2626',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '25px 0',
}

const primaryButton = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 28px',
  borderRadius: '6px',
  display: 'inline-block',
}

export default ExistingCleanerWelcomeEmail