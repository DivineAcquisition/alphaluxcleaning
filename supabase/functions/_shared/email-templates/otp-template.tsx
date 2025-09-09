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

interface OTPEmailProps {
  code: string;
  customerName?: string;
}

export const OTPEmail = ({ code, customerName }: OTPEmailProps) => (
  <BaseEmailTemplate previewText={`Your verification code: ${code}`}>
    <Heading style={heading}>
      Your Verification Code
    </Heading>
    
    {customerName && (
      <Text style={text}>
        Hi {customerName},
      </Text>
    )}
    
    <Text style={text}>
      Here's your verification code to access your customer portal:
    </Text>
    
    <Section style={codeSection}>
      <Text style={codeText}>{code}</Text>
    </Section>
    
    <Text style={text}>
      This code will expire in 10 minutes for your security.
    </Text>
    
    <Text style={text}>
      If you didn't request this code, please ignore this email.
    </Text>
  </BaseEmailTemplate>
)

const heading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const codeSection = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const codeText = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
}

export default OTPEmail