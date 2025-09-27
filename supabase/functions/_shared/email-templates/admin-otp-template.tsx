import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EmailBase, ActionButton } from './email-base.tsx';

interface AdminOTPEmailProps {
  code: string;
  email?: string;
  expires_in_minutes?: number;
}

export const AdminOTPEmail = ({
  code,
  email,
  expires_in_minutes = 10,
}: AdminOTPEmailProps) => {
  return (
    <EmailBase preview={`Your admin access code: ${code}`}>
      <Section style={section}>
        <Heading style={h1}>
          🔐 Admin Access Code
        </Heading>
        
        <Text style={text}>
          Hi there,
        </Text>

        <Text style={text}>
          You requested access to the admin portal. Use the code below to complete your login:
        </Text>

        <Section style={codeSection}>
          <Text style={codeText}>
            {code}
          </Text>
        </Section>

        <Text style={text}>
          This code will expire in <strong>{expires_in_minutes} minutes</strong>.
        </Text>

        <Text style={text}>
          If you didn't request this code, you can safely ignore this email. Your account remains secure.
        </Text>

        <Text style={warningText}>
          <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your access codes.
        </Text>

        {email && (
          <Text style={detailText}>
            This code was sent to: {email}
          </Text>
        )}

        <Text style={text}>
          Best regards,<br />
          The Admin Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default AdminOTPEmail;

// Styles
const section = {
  padding: '0 20px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const codeSection = {
  backgroundColor: '#f3f4f6',
  border: '2px solid #d1d5db',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const codeText = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  letterSpacing: '4px',
  margin: '0',
};

const warningText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '1.5',
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '12px',
  margin: '20px 0',
};

const detailText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '16px 0',
};