import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface CustomerWelcomeEmailProps {
  fullName: string;
  portalUrl?: string;
}

export const CustomerWelcomeEmail = ({
  fullName,
  portalUrl,
}: CustomerWelcomeEmailProps) => (
  <BaseEmailTemplate previewText={`Welcome to Bay Area Cleaning Professionals, ${fullName}! Your account is ready.`}>
    
    <Heading style={heading}>Welcome to Bay Area Cleaning Professionals!</Heading>
    
    <Text style={text}>
      Dear {fullName},
    </Text>
    
    <Text style={text}>
      Thank you for choosing Bay Area Cleaning Professionals! Your customer account has been successfully created, and you now have access to our comprehensive service platform.
    </Text>

    <Section style={featuresSection}>
      <Heading style={subHeading}>🏠 What You Can Do</Heading>
      <Text style={featureText}>📅 <strong>Book Services:</strong> Schedule regular cleanings, deep cleans, and specialized services</Text>
      <Text style={featureText}>💳 <strong>Manage Billing:</strong> View invoices, update payment methods, and track expenses</Text>
      <Text style={featureText}>⭐ <strong>Track History:</strong> Review past services and leave feedback for your cleaners</Text>
      <Text style={featureText}>🏆 <strong>Premium Membership:</strong> Unlock exclusive discounts and priority booking</Text>
      <Text style={featureText}>📞 <strong>24/7 Support:</strong> Get help whenever you need it through our customer portal</Text>
    </Section>

    <Section style={servicesSection}>
      <Heading style={subHeading}>🧽 Our Services</Heading>
      <Text style={text}>
        • <strong>Regular House Cleaning:</strong> Weekly, bi-weekly, or monthly maintenance<br/>
        • <strong>Deep Cleaning:</strong> Comprehensive top-to-bottom cleaning<br/>
        • <strong>Move-In/Move-Out:</strong> Complete cleaning for relocations<br/>
        • <strong>Post-Construction:</strong> Specialized cleaning after renovations<br/>
        • <strong>Commercial Cleaning:</strong> Office and business space maintenance
      </Text>
    </Section>

    {portalUrl && (
      <Section style={buttonSection}>
        <Button href={portalUrl} style={button}>
          Access Your Customer Portal
        </Button>
      </Section>
    )}

    <Section style={contactSection}>
      <Heading style={subHeading}>Get Started Today</Heading>
      <Text style={text}>
        Ready to experience spotless cleaning? Log in to your customer portal to:
      </Text>
      <Text style={text}>
        ✓ Schedule your first cleaning service<br/>
        ✓ Browse our service areas and pricing<br/>
        ✓ Set up your preferred payment method<br/>
        ✓ Connect with our customer support team
      </Text>
    </Section>

    <Text style={text}>
      We're excited to help you maintain a clean, comfortable space! Our professional team is ready to deliver exceptional cleaning services tailored to your needs.
    </Text>

  </BaseEmailTemplate>
)

// Styles
const heading = {
  color: '#10b981',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const subHeading = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const featureText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const featuresSection = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
}

const servicesSection = {
  backgroundColor: '#eff6ff',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
}

const contactSection = {
  backgroundColor: '#fef7ff',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '8px',
  display: 'inline-block',
}

export default CustomerWelcomeEmail