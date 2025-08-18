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

interface PasswordResetEmailProps {
  resetUrl: string
  userName: string
  userType: string
}

export const PasswordResetEmail = ({
  resetUrl,
  userName,
  userType,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password - Bay Area Cleaning Professionals</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password</Heading>
        <Text style={text}>
          Hello {userName || 'there'}, we received a request to reset your {userType || 'Customer'} account password.
        </Text>
        <Text style={text}>
          Click the button below to create a new password:
        </Text>
        <Link
          href={resetUrl}
          target="_blank"
          style={{
            ...button,
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Reset Password
        </Link>
        <Text style={{ ...text, marginBottom: '14px' }}>
          Or copy and paste this link:
        </Text>
        <Text style={code}>{resetUrl}</Text>
        <Text
          style={{
            ...text,
            color: '#6b7280',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
        </Text>
        <Text
          style={{
            ...text,
            color: '#6b7280',
            marginBottom: '16px',
          }}
        >
          Need help? Contact us at support@bayareacleaningpros.com
        </Text>
        <Text style={footer}>
          <Link
            href="https://bayareacleaningpros.com"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Bay Area Cleaning Professionals
          </Link>
          <br />
          📧 info@bayareacleaningpros.com | 📞 (415) 987-6543
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f9fafb',
}

const container = {
  paddingLeft: '20px',
  paddingRight: '20px',
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
}

const h1 = {
  color: '#1f2937',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0',
}

const button = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  textAlign: 'center' as const,
}

const link = {
  color: '#3b82f6',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#374151',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
}

const footer = {
  color: '#6b7280',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  lineHeight: '1.4',
  marginTop: '30px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  paddingTop: '20px',
}

const code = {
  display: 'inline-block',
  padding: '16px',
  width: '100%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '12px',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
  boxSizing: 'border-box' as const,
}