import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

// Service Resumed Email Template
interface ServiceResumedEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  nextServiceDate: string;
  nextServiceTime: string;
  serviceAddress?: string;
}

export const ServiceResumedEmail = ({
  customerName,
  cleaningType,
  frequency,
  nextServiceDate,
  nextServiceTime,
  serviceAddress,
}: ServiceResumedEmailProps) => (
  <BaseEmailTemplate previewText={`Welcome back ${customerName}! Your ${cleaningType} service has been resumed`}>
    
    {/* Welcome Back Header */}
    <Section style={headerSection}>
      <Heading style={headerHeading}>🎉 Welcome Back!</Heading>
      <Text style={headerText}>
        Hi {customerName}, we're thrilled to welcome you back! Your <strong>{cleaningType}</strong> service 
        has been successfully resumed and we're ready to provide you with the exceptional cleaning 
        experience you've come to expect.
      </Text>
    </Section>

    {/* Service Status */}
    <Section style={statusSection}>
      <Heading style={sectionHeading}>✅ Service Status: ACTIVE</Heading>
      
      <div style={statusCard}>
        <div style={statusHeader}>
          <span style={statusIcon}>🔄</span>
          <Text style={statusTitle}>SERVICE RESUMED</Text>
        </div>
        <Text style={statusDescription}>
          Your cleaning service is now active and scheduled to continue as planned
        </Text>
      </div>

      <div style={detailsGrid}>
        <div style={detailItem}>
          <span style={detailIcon}>🏠</span>
          <div>
            <Text style={detailLabel}>Service Type</Text>
            <Text style={detailValue}>{cleaningType}</Text>
          </div>
        </div>
        
        <div style={detailItem}>
          <span style={detailIcon}>📅</span>
          <div>
            <Text style={detailLabel}>Frequency</Text>
            <Text style={detailValue}>{frequency}</Text>
          </div>
        </div>
        
        <div style={detailItem}>
          <span style={detailIcon}>⏰</span>
          <div>
            <Text style={detailLabel}>Next Service</Text>
            <Text style={nextServiceValue}>{nextServiceDate} at {nextServiceTime}</Text>
          </div>
        </div>

        <div style={detailItem}>
          <span style={detailIcon}>✨</span>
          <div>
            <Text style={detailLabel}>Service Status</Text>
            <Text style={activeStatus}>ACTIVE & SCHEDULED</Text>
          </div>
        </div>
      </div>

      {serviceAddress && (
        <div style={addressSection}>
          <div style={addressHeader}>
            <span style={addressIcon}>📍</span>
            <Text style={addressTitle}>Service Address</Text>
          </div>
          <Text style={addressText}>{serviceAddress}</Text>
        </div>
      )}
    </Section>

    {/* What to Expect */}
    <Section style={expectationSection}>
      <Heading style={sectionHeading}>🌟 What to Expect</Heading>
      <div style={expectationList}>
        <div style={expectationItem}>
          <span style={expectationNumber}>1</span>
          <div>
            <Text style={expectationTitle}>Professional Team</Text>
            <Text style={expectationDescription}>Our experienced, insured, and bonded cleaning professionals will arrive on time</Text>
          </div>
        </div>
        <div style={expectationItem}>
          <span style={expectationNumber}>2</span>
          <div>
            <Text style={expectationTitle}>Complete Supplies</Text>
            <Text style={expectationDescription}>We bring all cleaning supplies, equipment, and eco-friendly products</Text>
          </div>
        </div>
        <div style={expectationItem}>
          <span style={expectationNumber}>3</span>
          <div>
            <Text style={expectationTitle}>Quality Assurance</Text>
            <Text style={expectationDescription}>Every cleaning is backed by our satisfaction guarantee</Text>
          </div>
        </div>
        <div style={expectationItem}>
          <span style={expectationNumber}>4</span>
          <div>
            <Text style={expectationTitle}>Consistent Service</Text>
            <Text style={expectationDescription}>We'll prioritize assigning your preferred cleaning team when available</Text>
          </div>
        </div>
      </div>
    </Section>

    {/* Reminders */}
    <Section style={reminderSection}>
      <Heading style={sectionHeading}>🔔 Service Reminders</Heading>
      <div style={reminderList}>
        <div style={reminderItem}>
          <span style={reminderIcon}>📱</span>
          <Text style={reminderText}>
            You'll receive SMS and email reminders 24 hours before each scheduled cleaning
          </Text>
        </div>
        <div style={reminderItem}>
          <span style={reminderIcon}>🗝️</span>
          <Text style={reminderText}>
            Please ensure easy access to your home or provide any special entry instructions
          </Text>
        </div>
        <div style={reminderItem}>
          <span style={reminderIcon}>🐕</span>
          <Text style={reminderText}>
            Let us know about any pets or special cleaning preferences through your customer portal
          </Text>
        </div>
      </div>
    </Section>

    {/* CTA Section */}
    <Section style={actionSection}>
      <Text style={actionPreText}>Manage your cleaning service anytime</Text>
      <Button href="#" style={ctaButton}>
        🏠 Access Customer Portal
      </Button>
      <Text style={actionPostText}>
        View schedules, update preferences, or contact support
      </Text>
    </Section>

    {/* Support Section */}
    <Section style={supportSection}>
      <Heading style={supportHeading}>❓ Questions or Special Requests?</Heading>
      <Text style={supportText}>
        Our customer service team is here to help with any questions, special cleaning requests, 
        or adjustments to your service schedule.
      </Text>
      <div style={contactInfo}>
        <Text style={contactItem}>📧 support@bayareacleaningpros.com</Text>
        <Text style={contactItem}>📞 (415) 987-6543</Text>
        <Text style={contactItem}>⏰ Available 7 days a week, 8 AM - 8 PM</Text>
      </div>
    </Section>

    {/* Welcome Back Message */}
    <Section style={welcomeBackSection}>
      <Text style={welcomeBackText}>
        🏡 Welcome back to the Bay Area Cleaning Professionals family! We're excited to continue 
        providing you with exceptional cleaning services. Thank you for your continued trust in us!
      </Text>
    </Section>

  </BaseEmailTemplate>
)

// Enhanced Styles
const headerSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #10B981',
  textAlign: 'center' as const,
}

const headerHeading = {
  color: '#047857',
  margin: '0 0 20px 0',
  fontSize: '32px',
  fontWeight: '700',
}

const headerText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const statusSection = {
  backgroundColor: '#F9FAFB',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E5E7EB',
}

const sectionHeading = {
  color: '#8B5CF6',
  margin: '0 0 25px 0',
  fontSize: '20px',
  fontWeight: '600',
}

const statusCard = {
  backgroundColor: '#ECFDF5',
  padding: '20px',
  borderRadius: '12px',
  border: '2px solid #BBF7D0',
  textAlign: 'center' as const,
  marginBottom: '25px',
}

const statusHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '10px',
}

const statusIcon = {
  fontSize: '24px',
}

const statusTitle = {
  color: '#047857',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
}

const statusDescription = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
}

const detailsGrid = {
  display: 'grid',
  gap: '20px',
  marginBottom: '25px',
}

const detailItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
}

const detailIcon = {
  fontSize: '20px',
  lineHeight: '1',
}

const detailLabel = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 5px 0',
}

const detailValue = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const nextServiceValue = {
  color: '#8B5CF6',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const activeStatus = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const addressSection = {
  backgroundColor: '#F0F9FF',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #BAE6FD',
  marginTop: '25px',
}

const addressHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px',
}

const addressIcon = {
  fontSize: '18px',
}

const addressTitle = {
  color: '#1D4ED8',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const addressText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
}

const expectationSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const expectationList = {
  display: 'grid',
  gap: '20px',
}

const expectationItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
}

const expectationNumber = {
  backgroundColor: '#8B5CF6',
  color: 'white',
  width: '35px',
  height: '35px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '16px',
  flexShrink: '0',
}

const expectationTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 5px 0',
}

const expectationDescription = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const reminderSection = {
  backgroundColor: '#F0F9FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #BAE6FD',
}

const reminderList = {
  display: 'grid',
  gap: '15px',
}

const reminderItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}

const reminderIcon = {
  fontSize: '18px',
  lineHeight: '1',
  marginTop: '2px',
}

const reminderText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const actionSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const actionPreText = {
  color: '#6B7280',
  fontSize: '16px',
  margin: '0 0 20px 0',
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
  marginBottom: '15px',
}

const actionPostText = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const supportSection = {
  backgroundColor: '#F3F4F6',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
}

const supportHeading = {
  color: '#059669',
  margin: '0 0 15px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const supportText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
}

const contactInfo = {
  display: 'grid',
  gap: '8px',
}

const contactItem = {
  color: '#8B5CF6',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const welcomeBackSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center' as const,
}

const welcomeBackText = {
  color: '#047857',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0',
  fontWeight: '500',
}

export default ServiceResumedEmail