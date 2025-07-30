import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface UserInviteEmailProps {
  email: string;
  role: 'admin' | 'subcontractor' | 'customer';
  inviteUrl: string;
  companyName: string;
}

export const UserInviteEmail = ({
  email,
  role,
  inviteUrl,
  companyName,
}: UserInviteEmailProps) => {
  const roleLabels = {
    admin: 'Administrator',
    subcontractor: 'Subcontractor',
    customer: 'Customer'
  };

  const roleDescriptions = {
    admin: 'You\'ll have full access to manage the platform, users, and all business operations.',
    subcontractor: 'You\'ll be able to view and accept cleaning jobs, manage your schedule, and track your earnings.',
    customer: 'You\'ll be able to book cleaning services, manage your appointments, and track your service history.'
  };

  return (
    <BaseEmailTemplate previewText={`Welcome to ${companyName}! Set up your ${roleLabels[role]} account`}>
      
      <Heading style={heading}>Welcome to Bay Area Cleaning Professionals!</Heading>
      
      <Text style={text}>
        You've been invited to join our platform as a <strong>{roleLabels[role]}</strong>. 
        We're excited to have you on board!
      </Text>

      <Section style={detailsSection}>
        <Text style={text}><strong>Email Address:</strong> {email}</Text>
        <Text style={text}><strong>Role:</strong> {roleLabels[role]}</Text>
        <Text style={text}><strong>What you can do:</strong> {roleDescriptions[role]}</Text>
      </Section>

      <Text style={text}>
        <strong>Get Started:</strong><br />
        1. Click the "Set Up Account" button below to create your password<br />
        2. Create a secure password for your account<br />
        3. Complete your profile with any additional information<br />
        4. Start using the platform with your new {roleLabels[role]} access
      </Text>

      <Section style={buttonSection}>
        <Button href={inviteUrl} style={button}>
          Set Up My Account
        </Button>
      </Section>

      <Text style={smallText}>
        Or copy this link: <a href={inviteUrl} style={link}>{inviteUrl}</a>
      </Text>

      <Text style={smallText}>
        <strong>Important:</strong> This invitation link will expire in 24 hours. 
        Choose a strong password to keep your account secure.
        {role === 'admin' && ' As an admin, you have full access to sensitive data - please keep your credentials secure.'}
      </Text>

      <Text style={smallText}>
        Need help? Contact us at support@bayareacleaningpros.com or (415) 987-6543
      </Text>

    </BaseEmailTemplate>
  );
};

// Simple styles
const heading = {
  color: '#10b981',
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

const detailsSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
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

export default UserInviteEmail