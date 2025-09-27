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

interface PasswordResetEmailProps {
  resetUrl: string;
  email: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  email,
}: PasswordResetEmailProps) => {
  return (
    <EmailBase preview="Reset your password">
      <Section style={section}>
        <Heading style={h1}>
          Password Reset Request
        </Heading>
        
        <Text style={text}>
          Hi there,
        </Text>

        <Text style={text}>
          We received a request to reset the password for your account ({email}).
        </Text>

        <Text style={text}>
          Click the button below to reset your password:
        </Text>
        
        <ActionButton href={resetUrl}>
          Reset Password
        </ActionButton>

        <Text style={text}>
          If you didn't request this password reset, you can safely ignore this email.
        </Text>

        <Text style={text}>
          This link will expire in 24 hours for security reasons.
        </Text>

        <Text style={text}>
          Best regards,<br />
          The Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default PasswordResetEmail;

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