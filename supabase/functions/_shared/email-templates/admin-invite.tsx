import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface AdminInviteEmailProps {
  email: string;
  role: string;
  inviteUrl: string;
  companyName: string;
}

export const AdminInviteEmail = ({
  email,
  role,
  inviteUrl,
  companyName,
}: AdminInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {companyName} admin panel</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Admin Access Invitation</Heading>
        <Text style={text}>
          Hello,
        </Text>
        <Text style={text}>
          You've been invited to join <strong>{companyName}</strong> admin panel with <strong>{role}</strong> privileges.
        </Text>
        <Text style={text}>
          Click the link below to set up your password and access the admin panel:
        </Text>
        <Link
          href={inviteUrl}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
            padding: '12px 20px',
            backgroundColor: '#007ee6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            textAlign: 'center' as const,
          }}
        >
          Set Up Admin Access
        </Link>
        <Text style={text}>
          Your admin account will have <strong>{role}</strong> level access to the system.
        </Text>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          If you didn't expect this invitation, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          <Link
            href="#"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            {companyName}
          </Link>
          , Professional Cleaning Services
        </Text>
      </Container>
    </Body>
  </Html>
)

export default AdminInviteEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
}

const footer = {
  color: '#898989',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}