import { Heading, Text, Section } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface AdminInviteEmailProps {
  email: string;
  role: string;
  inviteUrl: string;
  companyName: string;
}

export const AdminInviteEmail = ({ email, role, inviteUrl, companyName }: AdminInviteEmailProps) => (
  <EmailBase preview={`Admin access invitation - ${companyName}`}>
    <Heading style={h1}>🔐 You're invited to join our admin team!</Heading>
    
    <Text style={text}>
      Hi there,
    </Text>
    
    <Text style={text}>
      You've been invited to join <strong>{companyName}</strong> as an admin user with <strong>{role}</strong> privileges.
    </Text>
    
    <Text style={text}>
      Your admin account has been created for: <strong>{email}</strong>
    </Text>
    
    <Section style={ctaSection}>
      <ActionButton href={inviteUrl}>
        Set Up Your Admin Account →
      </ActionButton>
    </Section>
    
    <Text style={text}>
      Click the button above to set your password and access your admin dashboard. This link will expire in 24 hours for security reasons.
    </Text>
    
    <Section style={roleSection}>
      <Heading as="h2" style={h2}>Your Access Level: {role}</Heading>
      <Text style={smallText}>
        {role === 'admin' && 'Full administrative access to all system features and settings.'}
        {role === 'ops' && 'Operations access to manage bookings, customers, and day-to-day operations.'}
        {role === 'viewer' && 'Read-only access to view reports and system information.'}
      </Text>
    </Section>
    
    <Text style={smallText}>
      If you have any questions or need assistance, please contact our support team.
    </Text>
    
    <Text style={smallText}>
      Best regards,<br />
      The {companyName} Team
    </Text>
  </EmailBase>
);

const h1 = { 
  color: "#1A1A1A", 
  fontSize: "28px", 
  fontWeight: "bold", 
  margin: "0 0 24px 0",
  textAlign: "center" as const
};

const h2 = { 
  color: "#1A1A1A", 
  fontSize: "20px", 
  fontWeight: "bold", 
  margin: "0 0 12px 0" 
};

const text = { 
  color: "#1A1A1A", 
  fontSize: "16px", 
  lineHeight: "1.6", 
  margin: "0 0 16px 0" 
};

const smallText = { 
  color: "#666", 
  fontSize: "14px", 
  lineHeight: "1.5", 
  margin: "0 0 16px 0" 
};

const ctaSection = { 
  textAlign: "center" as const, 
  margin: "32px 0" 
};

const roleSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid #e9ecef"
};