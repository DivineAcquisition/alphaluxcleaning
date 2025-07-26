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
  <BaseEmailTemplate previewText="🧪 Test Email - Bay Area Cleaning Professionals email system is working!">
    
    {/* Test Header */}
    <Section style={testSection}>
      <Heading style={testHeading}>🧪 Test Email System</Heading>
      <Text style={testText}>
        This is a test email to verify that the Bay Area Cleaning Professionals email system is working correctly.
        Email sent to: <strong>{testEmail}</strong>
      </Text>
    </Section>

    {/* Sample Order Details */}
    <Section style={orderSection}>
      <Heading style={sectionHeading}>📋 Sample Order Details</Heading>
      <div style={orderGrid}>
        <div style={orderRow}>
          <span style={orderLabel}>Order ID:</span>
          <span style={orderValue}>{sampleOrderId}</span>
        </div>
        <div style={orderRow}>
          <span style={orderLabel}>Service Type:</span>
          <span style={orderValue}>Deep Cleaning</span>
        </div>
        <div style={orderRow}>
          <span style={orderLabel}>Frequency:</span>
          <span style={orderValue}>One-time</span>
        </div>
        <div style={orderRow}>
          <span style={orderLabel}>Square Footage:</span>
          <span style={orderValue}>1,500 sq ft</span>
        </div>
        <div style={orderRow}>
          <span style={orderLabel}>Scheduled Date:</span>
          <span style={orderValue}>
            {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
        <div style={{...orderRow, ...totalRow}}>
          <span style={totalLabel}>Total Amount:</span>
          <span style={totalValue}>$299.00</span>
        </div>
      </div>
    </Section>

    {/* Sample Features */}
    <Section style={featuresSection}>
      <Heading style={sectionHeading}>✨ Email Features Test</Heading>
      <div style={featuresList}>
        <div style={feature}>
          <span style={featureIcon}>🎨</span>
          <div>
            <Text style={featureTitle}>Branded Design</Text>
            <Text style={featureDescription}>Consistent branding with your logo and colors</Text>
          </div>
        </div>
        <div style={feature}>
          <span style={featureIcon}>📱</span>
          <div>
            <Text style={featureTitle}>Mobile Responsive</Text>
            <Text style={featureDescription}>Looks great on all devices and email clients</Text>
          </div>
        </div>
        <div style={feature}>
          <span style={featureIcon}>🔗</span>
          <div>
            <Text style={featureTitle}>Interactive Links</Text>
            <Text style={featureDescription}>Working buttons and links for customer actions</Text>
          </div>
        </div>
        <div style={feature}>
          <span style={featureIcon}>📊</span>
          <div>
            <Text style={featureTitle}>Dynamic Content</Text>
            <Text style={featureDescription}>Personalized content based on order details</Text>
          </div>
        </div>
      </div>
    </Section>

    {/* CTA Button */}
    <Section style={ctaSection}>
      <Button href={orderStatusUrl} style={ctaButton}>
        📊 Check Sample Order Status
      </Button>
    </Section>

    {/* Success Message */}
    <Section style={successSection}>
      <Heading style={successHeading}>✅ Email System Status</Heading>
      <Text style={successText}>
        🎉 Congratulations! Your email system is working perfectly. All email templates are now ready to use 
        for order confirmations, application responses, password resets, and more.
      </Text>
    </Section>

    {/* System Info */}
    <Section style={infoSection}>
      <Heading style={sectionHeading}>🔧 System Information</Heading>
      <div style={infoList}>
        <Text style={infoItem}>📧 Email Provider: Resend</Text>
        <Text style={infoItem}>🎨 Template Engine: React Email</Text>
        <Text style={infoItem}>🚀 Platform: Supabase Edge Functions</Text>
        <Text style={infoItem}>⏰ Test Time: {new Date().toLocaleString()}</Text>
      </div>
    </Section>

  </BaseEmailTemplate>
)

// Styles
const testSection = {
  backgroundColor: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #6366F1',
  textAlign: 'center' as const,
}

const testHeading = {
  color: '#4338CA',
  margin: '0 0 15px 0',
  fontSize: '24px',
  fontWeight: '700',
}

const testText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const orderSection = {
  backgroundColor: '#F9FAFB',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E5E7EB',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 20px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const orderGrid = {
  display: 'grid',
  gap: '12px',
}

const orderRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
}

const orderLabel = {
  color: '#6B7280',
  fontWeight: '500',
}

const orderValue = {
  color: '#111827',
  fontWeight: '600',
}

const totalRow = {
  borderTop: '2px solid #E5E7EB',
  paddingTop: '15px',
  marginTop: '10px',
}

const totalLabel = {
  color: '#111827',
  fontWeight: '700',
  fontSize: '18px',
}

const totalValue = {
  color: '#059669',
  fontWeight: '700',
  fontSize: '18px',
}

const featuresSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const featuresList = {
  display: 'grid',
  gap: '20px',
}

const feature = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
}

const featureIcon = {
  fontSize: '24px',
  lineHeight: '1',
}

const featureTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 5px 0',
}

const featureDescription = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
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
}

const successSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
  textAlign: 'center' as const,
}

const successHeading = {
  color: '#047857',
  margin: '0 0 15px 0',
  fontSize: '20px',
  fontWeight: '700',
}

const successText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const infoSection = {
  backgroundColor: '#F3F4F6',
  padding: '25px',
  borderRadius: '15px',
}

const infoList = {
  display: 'grid',
  gap: '8px',
}

const infoItem = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0',
}

export default TestEmail