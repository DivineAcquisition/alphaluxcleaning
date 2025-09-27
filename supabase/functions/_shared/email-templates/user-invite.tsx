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

interface UserInviteEmailProps {
  email: string;
  inviteUrl: string;
  inviterName?: string;
  companyName?: string;
}

export const UserInviteEmail = ({
  email,
  inviteUrl,
  inviterName,
  companyName = "Our Platform",
}: UserInviteEmailProps) => {
  return (
    <EmailBase preview={`You've been invited to join ${companyName}`}>
      <Section style={section}>
        <Heading style={h1}>
          You're Invited!
        </Heading>
        
        <Text style={text}>
          Hi there,
        </Text>

        <Text style={text}>
          {inviterName 
            ? `${inviterName} has invited you to join ${companyName}.`
            : `You've been invited to join ${companyName}.`
          }
        </Text>

        <Text style={text}>
          Click the button below to set up your account and get started:
        </Text>
        
        <ActionButton href={inviteUrl}>
          Accept Invitation
        </ActionButton>

        <Text style={text}>
          This invitation was sent to {email}. If you weren't expecting this invitation, you can safely ignore this email.
        </Text>

        <Text style={text}>
          Welcome aboard!
        </Text>

        <Text style={text}>
          Best regards,<br />
          The {companyName} Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default UserInviteEmail;

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