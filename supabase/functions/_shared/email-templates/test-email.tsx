import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface TestEmailProps {
  testEmail: string;
  sampleOrderId: string;
  orderStatusUrl: string;
}

export const TestEmail = ({
  testEmail,
  sampleOrderId,
  orderStatusUrl,
}: TestEmailProps) => (
  <BaseEmailTemplate previewText="Test Email - Bay Area Cleaning Professionals email system is working!">
    
    <Heading style={heading}>Test Email System</Heading>
    
    <Text style={text}>
      This is a test email to verify that the Bay Area Cleaning Professionals email system is working correctly.
      Email sent to: <strong>{testEmail}</strong>
    </Text>

    <Section style={orderSection}>
      <Heading style={subHeading}>Sample Order Details</Heading>
      <Text style={text}><strong>Order ID:</strong> {sampleOrderId}</Text>
      <Text style={text}><strong>Service Type:</strong> Deep Cleaning</Text>
      <Text style={text}><strong>Frequency:</strong> One-time</Text>
      <Text style={text}><strong>Square Footage:</strong> 1,500 sq ft</Text>
      <Text style={text}>
        <strong>Scheduled Date:</strong> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </Text>
      <Text style={totalText}><strong>Total Amount:</strong> $299.00</Text>
    </Section>

    <Text style={text}>
      <strong>Email Features Test:</strong><br />
      • Branded design with consistent branding<br />
      • Mobile responsive - looks great on all devices<br />
      • Interactive links and working buttons<br />
      • Personalized content based on order details
    </Text>

    <Section style={buttonSection}>
      <Button href={orderStatusUrl} style={button}>
        Check Sample Order Status
      </Button>
    </Section>

    <Section style={successSection}>
      <Text style={successText}>
        Congratulations! Your email system is working perfectly. All email templates are now ready to use 
        for order confirmations, application responses, password resets, and more.
      </Text>
    </Section>

    <Text style={text}>
      <strong>System Information:</strong><br />
      • Email Provider: Resend<br />
      • Template Engine: React Email<br />
      • Platform: Supabase Edge Functions<br />
      • Test Time: {new Date().toLocaleString()}
    </Text>

  </BaseEmailTemplate>
)

// Simple styles
const heading = {
  color: '#3b82f6',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const subHeading = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 15px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
}

const orderSection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const totalText = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: '600',
  margin: '15px 0 0 0',
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

const successSection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const successText = {
  color: '#047857',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

export default TestEmail