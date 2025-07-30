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
      
      <Heading style={heading}>Reset Your Password</Heading>
      
      <Text style={text}>
        Hello {userName ? userName : 'there'}, we received a request to reset your {typeLabels[userType]} account password.
      </Text>

      <Text style={text}>
        Click the button below to create a new password:
      </Text>

      <Section style={buttonSection}>
        <Button href={resetUrl} style={button}>
          Reset Password
        </Button>
      </Section>

      <Text style={smallText}>
        Or copy this link: <a href={resetUrl} style={link}>{resetUrl}</a>
      </Text>

      <Text style={smallText}>
        This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
      </Text>

      <Text style={smallText}>
        Need help? Contact us at support@bayareacleaningpros.com
      </Text>

    </BaseEmailTemplate>
  );
};

// Simple styles
const heading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
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

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

export default PasswordResetEmail