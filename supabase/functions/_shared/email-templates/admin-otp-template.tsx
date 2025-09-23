import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface AdminOTPEmailProps {
  code: string;
  adminEmail?: string;
}

export const AdminOTPEmail = ({ code, adminEmail }: AdminOTPEmailProps) => (
  <BaseEmailTemplate previewText={`Admin Portal Access Code: ${code}`}>
    <Heading style={heading}>
      Admin Portal Access
    </Heading>
    
    {adminEmail && (
      <Text style={text}>
        Hello Administrator,
      </Text>
    )}
    
    <Text style={text}>
      You've requested access to the admin portal. Use the verification code below to complete your login:
    </Text>
    
    <Section style={codeSection}>
      <Text style={codeText}>{code}</Text>
    </Section>
    
    <Text style={text}>
      This code will expire in <strong>10 minutes</strong> for security purposes.
    </Text>
    
    <Text style={securityText}>
      🔒 <strong>Security Notice:</strong> If you didn't request this code, someone may be attempting to access your admin account. Please contact your system administrator immediately.
    </Text>
    
    <Text style={text}>
      For your security, never share this code with anyone.
    </Text>
  </BaseEmailTemplate>
)

const heading = {
  color: '#dc2626',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const codeSection = {
  background: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '12px',
  padding: '32px 24px',
  textAlign: 'center' as const,
  margin: '32px 0',
}

const codeText = {
  color: '#dc2626',
  fontSize: '36px',
  fontWeight: '800',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
}

const securityText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 16px 0',
  padding: '16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
}

export default AdminOTPEmail