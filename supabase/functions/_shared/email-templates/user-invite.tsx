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
      
      {/* Welcome Header */}
      <Section style={headerSection}>
        <Heading style={headerHeading}>🎉 Welcome to Bay Area Cleaning Professionals!</Heading>
        <Text style={headerText}>
          You've been invited to join our platform as a <strong>{roleLabels[role]}</strong>. 
          We're excited to have you on board!
        </Text>
      </Section>

      {/* Account Details */}
      <Section style={detailsSection}>
        <Heading style={sectionHeading}>📋 Your Account Details</Heading>
        
        <div style={accountBox}>
          <div style={accountItem}>
            <span style={accountIcon}>📧</span>
            <div>
              <Text style={accountLabel}>Email Address</Text>
              <Text style={accountValue}>{email}</Text>
            </div>
          </div>
          
          <div style={accountItem}>
            <span style={accountIcon}>👤</span>
            <div>
              <Text style={accountLabel}>Role</Text>
              <Text style={accountValue}>{roleLabels[role]}</Text>
            </div>
          </div>
        </div>

        <div style={roleDescriptionBox}>
          <Text style={roleDescriptionText}>
            <strong>As a {roleLabels[role]}:</strong> {roleDescriptions[role]}
          </Text>
        </div>
      </Section>

      {/* Setup Instructions */}
      <Section style={instructionsSection}>
        <Heading style={sectionHeading}>🚀 Get Started</Heading>
        <div style={stepsList}>
          <div style={step}>
            <span style={stepNumber}>1</span>
            <Text style={stepText}>
              <strong>Click the "Set Up Account" button below</strong> to create your password
            </Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>2</span>
            <Text style={stepText}>
              <strong>Create a secure password</strong> for your account
            </Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>3</span>
            <Text style={stepText}>
              <strong>Complete your profile</strong> with any additional information
            </Text>
          </div>
          <div style={step}>
            <span style={stepNumber}>4</span>
            <Text style={stepText}>
              <strong>Start using the platform</strong> with your new {roleLabels[role]} access
            </Text>
          </div>
        </div>
      </Section>

      {/* CTA Button */}
      <Section style={ctaSection}>
        <Button href={inviteUrl} style={ctaButton}>
          🔑 Set Up My Account
        </Button>
        <Text style={linkText}>
          Or copy and paste this link in your browser:<br />
          <a href={inviteUrl} style={linkStyle}>{inviteUrl}</a>
        </Text>
      </Section>

      {/* Important Notes */}
      <Section style={notesSection}>
        <Heading style={notesHeading}>🔒 Important Information</Heading>
        <div style={notesList}>
          <Text style={noteItem}>🕒 This invitation link will expire in 24 hours</Text>
          <Text style={noteItem}>🔐 Choose a strong password to keep your account secure</Text>
          <Text style={noteItem}>📱 Save your login credentials in a secure location</Text>
          {role === 'admin' && (
            <Text style={noteItem}>⚠️ As an admin, you have full access to sensitive data - please keep your credentials secure</Text>
          )}
        </div>
      </Section>

      {/* Support Section */}
      <Section style={supportSection}>
        <Heading style={supportHeading}>❓ Need Help?</Heading>
        <Text style={supportText}>
          If you have any questions about setting up your account or using the platform, 
          our support team is here to help.
        </Text>
        <div style={contactInfo}>
          <Text style={contactItem}>📧 support@bayareacleaningpros.com</Text>
          <Text style={contactItem}>📞 (415) 987-6543</Text>
          <Text style={contactItem}>⏰ Available 7 days a week, 8 AM - 8 PM</Text>
        </div>
      </Section>

      {/* Welcome Message */}
      <Section style={welcomeSection}>
        <Text style={welcomeText}>
          🌟 Welcome to the Bay Area Cleaning Professionals family! We're excited to work with you 
          and look forward to a successful partnership.
        </Text>
      </Section>

    </BaseEmailTemplate>
  );
};

// Enhanced Styles
const headerSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
  textAlign: 'center' as const,
}

const headerHeading = {
  color: '#047857',
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

const detailsSection = {
  backgroundColor: '#F9FAFB',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E5E7EB',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 25px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const accountBox = {
  display: 'grid',
  gap: '20px',
  marginBottom: '25px',
}

const accountItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
}

const accountIcon = {
  fontSize: '20px',
  lineHeight: '1',
}

const accountLabel = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 5px 0',
}

const accountValue = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const roleDescriptionBox = {
  backgroundColor: '#FEF7FF',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #E9D5FF',
}

const roleDescriptionText = {
  color: '#374151',
  fontSize: '15px',
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
  fontSize: '15px',
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

const notesSection = {
  backgroundColor: '#FEF3C7',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #FDE68A',
  borderLeft: '5px solid #F59E0B',
}

const notesHeading = {
  color: '#92400E',
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const notesList = {
  display: 'grid',
  gap: '10px',
}

const noteItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const supportSection = {
  backgroundColor: '#F3F4F6',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
}

const supportHeading = {
  color: '#059669',
  margin: '0 0 15px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const supportText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
}

const contactInfo = {
  display: 'grid',
  gap: '8px',
}

const contactItem = {
  color: '#8B5CF6',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const welcomeSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center' as const,
}

const welcomeText = {
  color: '#047857',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0',
  fontWeight: '500',
}

export default UserInviteEmail