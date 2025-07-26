import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
  userType: 'admin' | 'subcontractor' | 'customer';
}

export const PasswordResetEmail = ({
  userName,
  resetUrl,
  userType,
}: PasswordResetEmailProps) => {
  const typeLabels = {
    admin: 'Administrator',
    subcontractor: 'Subcontractor',
    customer: 'Customer'
  };

  return (
    <BaseEmailTemplate previewText="Reset your Bay Area Cleaning Professionals password">
      
      {/* Header */}
      <Section style={headerSection}>
        <Heading style={headerHeading}>🔐 Password Reset Request</Heading>
        <Text style={headerText}>
          {userName ? `Hello ${userName}` : 'Hello'}, we received a request to reset your Bay Area Cleaning Professionals password.
        </Text>
      </Section>

      {/* Instructions */}
      <Section style={instructionsSection}>
        <Heading style={sectionHeading}>📝 Reset Instructions</Heading>
        <div style={stepsList}>
          <div style={step}>
            <span style={stepNumber}>1</span>
            <Text style={stepText}>Click the "Reset Password" button below</Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>2</span>
            <Text style={stepText}>You'll be redirected to a secure page to create your new password</Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>3</span>
            <Text style={stepText}>Enter your new password and confirm it</Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>4</span>
            <Text style={stepText}>Log in to your {typeLabels[userType]} dashboard with your new password</Text>
          </div>
        </div>
      </Section>

      {/* CTA Button */}
      <Section style={ctaSection}>
        <Button href={resetUrl} style={ctaButton}>
          🔑 Reset My Password
        </Button>
        <Text style={linkText}>
          Or copy and paste this link in your browser:<br />
          <a href={resetUrl} style={linkStyle}>{resetUrl}</a>
        </Text>
      </Section>

      {/* Security Notice */}
      <Section style={securitySection}>
        <Heading style={securityHeading}>🛡️ Security Notice</Heading>
        <div style={securityList}>
          <Text style={securityItem}>🕒 This link will expire in 24 hours for your security</Text>
          <Text style={securityItem}>🔒 If you didn't request this reset, please ignore this email</Text>
          <Text style={securityItem}>📧 Never share this link with anyone</Text>
          <Text style={securityItem}>💻 Always use a strong, unique password</Text>
        </div>
      </Section>

      {/* Support */}
      <Section style={supportSection}>
        <Heading style={sectionHeading}>❓ Need Help?</Heading>
        <Text style={supportText}>
          If you're having trouble with the password reset process or didn't request this change, 
          please contact our support team immediately. We're here to help keep your account secure.
        </Text>
        <Text style={supportContact}>
          📧 support@bayareacleaningpros.com<br />
          📞 (415) 987-6543
        </Text>
      </Section>

    </BaseEmailTemplate>
  );
};

// Styles
const headerSection = {
  backgroundColor: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #F59E0B',
  textAlign: 'center' as const,
}

const headerHeading = {
  color: '#92400E',
  margin: '0 0 20px 0',
  fontSize: '28px',
  fontWeight: '700',
}

const headerText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const instructionsSection = {
  backgroundColor: '#F0F9FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #BAE6FD',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 20px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const stepsList = {
  display: 'grid',
  gap: '15px',
}

const step = {
  display: 'flex',
  alignItems: 'flex-start',
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
  marginBottom: '20px',
}

const linkText = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const linkStyle = {
  color: '#8B5CF6',
  wordBreak: 'break-all' as const,
}

const securitySection = {
  backgroundColor: '#FEF2F2',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #FECACA',
  borderLeft: '5px solid #EF4444',
}

const securityHeading = {
  color: '#DC2626',
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const securityList = {
  display: 'grid',
  gap: '10px',
}

const securityItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const supportSection = {
  backgroundColor: '#F3F4F6',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center' as const,
}

const supportText = {
  color: '#6B7280',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
}

const supportContact = {
  color: '#8B5CF6',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

export default PasswordResetEmail