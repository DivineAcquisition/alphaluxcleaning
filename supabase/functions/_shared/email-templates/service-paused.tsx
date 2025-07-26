import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

// Service Paused Email Template
interface ServicePausedEmailProps {
  customerName: string;
  cleaningType: string;
  frequency: string;
  pausedUntil: string;
  lastServiceDate: string;
  serviceAddress?: string;
}

export const ServicePausedEmail = ({
  customerName,
  cleaningType,
  frequency,
  pausedUntil,
  lastServiceDate,
  serviceAddress,
}: ServicePausedEmailProps) => (
  <BaseEmailTemplate previewText={`${customerName}, your ${cleaningType} service has been paused until ${pausedUntil}`}>
    
    {/* Header Section */}
    <Section style={headerSection}>
      <Heading style={headerHeading}>⏸️ Service Temporarily Paused</Heading>
      <Text style={headerText}>
        Hi {customerName}, we've successfully paused your <strong>{cleaningType}</strong> service as requested. 
        Your service is now on hold and no charges will occur during this period.
      </Text>
    </Section>

    {/* Service Status Details */}
    <Section style={statusSection}>
      <Heading style={sectionHeading}>📊 Current Service Status</Heading>
      
      <div style={statusCard}>
        <div style={statusHeader}>
          <span style={statusIcon}>⏸️</span>
          <Text style={statusTitle}>PAUSED</Text>
        </div>
        <Text style={statusDescription}>
          Your cleaning service is temporarily on hold until <strong>{pausedUntil}</strong>
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
          <span style={detailIcon}>✅</span>
          <div>
            <Text style={detailLabel}>Last Service Date</Text>
            <Text style={detailValue}>{lastServiceDate}</Text>
          </div>
        </div>

        <div style={detailItem}>
          <span style={detailIcon}>🔄</span>
          <div>
            <Text style={detailLabel}>Resume Date</Text>
            <Text style={resumeValue}>{pausedUntil}</Text>
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

    {/* Important Information */}
    <Section style={infoSection}>
      <Heading style={sectionHeading}>📝 Important Information</Heading>
      <div style={infoList}>
        <div style={infoItem}>
          <span style={infoIcon}>💰</span>
          <Text style={infoText}>
            <strong>No Charges:</strong> You won't be billed for any services during the pause period
          </Text>
        </div>
        <div style={infoItem}>
          <span style={infoIcon}>📱</span>
          <Text style={infoText}>
            <strong>Easy Resume:</strong> Use the button below or your customer portal to resume anytime
          </Text>
        </div>
        <div style={infoItem}>
          <span style={infoIcon}>🔔</span>
          <Text style={infoText}>
            <strong>Automatic Resume:</strong> Service will automatically resume on {pausedUntil} unless extended
          </Text>
        </div>
        <div style={infoItem}>
          <span style={infoIcon}>👥</span>
          <Text style={infoText}>
            <strong>Same Team:</strong> When you resume, we'll prioritize assigning your preferred cleaning team
          </Text>
        </div>
      </div>
    </Section>

    {/* Resume Action */}
    <Section style={actionSection}>
      <Text style={actionPreText}>Ready to resume your cleaning service?</Text>
      <Button href="#" style={ctaButton}>
        🔄 Resume My Service Now
      </Button>
      <Text style={actionPostText}>
        Or you can resume your service anytime through your customer portal
      </Text>
    </Section>

    {/* Support Section */}
    <Section style={supportSection}>
      <Heading style={supportHeading}>❓ Need Assistance?</Heading>
      <Text style={supportText}>
        Our customer service team is here to help with any questions about your paused service, 
        changing your resume date, or making other adjustments to your cleaning schedule.
      </Text>
      <div style={contactInfo}>
        <Text style={contactItem}>📧 support@bayareacleaningpros.com</Text>
        <Text style={contactItem}>📞 (415) 987-6543</Text>
        <Text style={contactItem}>⏰ Available 7 days a week, 8 AM - 8 PM</Text>
      </div>
    </Section>

    {/* Appreciation Section */}
    <Section style={appreciationSection}>
      <Text style={appreciationText}>
        🙏 Thank you for being a valued Bay Area Cleaning Professionals customer. 
        We look forward to serving you again when you're ready to resume your cleaning service!
      </Text>
    </Section>

  </BaseEmailTemplate>
)

// Enhanced Styles
const headerSection = {
  backgroundColor: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
  padding: '30px',
  borderRadius: '15px',
  marginBottom: '30px',
  borderLeft: '5px solid #F59E0B',
  textAlign: 'center' as const,
}

const headerHeading = {
  color: '#92400E',
  margin: '0 0 20px 0',
  fontSize: '28px',
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
  backgroundColor: '#FEF3C7',
  padding: '20px',
  borderRadius: '12px',
  border: '2px solid #FDE68A',
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
  color: '#92400E',
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

const resumeValue = {
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

const infoSection = {
  backgroundColor: '#FEF7FF',
  padding: '25px',
  borderRadius: '15px',
  marginBottom: '30px',
  border: '1px solid #E9D5FF',
}

const infoList = {
  display: 'grid',
  gap: '15px',
}

const infoItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}

const infoIcon = {
  fontSize: '18px',
  lineHeight: '1',
  marginTop: '2px',
}

const infoText = {
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
  backgroundColor: 'linear-gradient(135deg, #059669, #10B981)',
  color: 'white',
  padding: '15px 30px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  boxShadow: '0 10px 20px rgba(5, 150, 105, 0.3)',
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

const appreciationSection = {
  backgroundColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center' as const,
}

const appreciationText = {
  color: '#047857',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0',
  fontWeight: '500',
}

export default ServicePausedEmail