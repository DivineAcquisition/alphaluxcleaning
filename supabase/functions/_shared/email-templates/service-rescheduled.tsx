import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

// Service Rescheduled Email Template
interface ServiceRescheduledEmailProps {
  customerName: string;
  cleaningType: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  serviceAddress?: string;
}

export const ServiceRescheduledEmail = ({
  customerName,
  cleaningType,
  oldDate,
  oldTime,
  newDate,
  newTime,
  serviceAddress,
}: ServiceRescheduledEmailProps) => (
  <BaseEmailTemplate previewText={`${customerName}, your ${cleaningType} service has been rescheduled for ${newDate}`}>
    
    {/* Header Section */}
    <Section style={headerSection}>
      <Heading style={headerHeading}>📅 Service Rescheduled</Heading>
      <Text style={headerText}>
        Hi {customerName}, we wanted to inform you that your <strong>{cleaningType}</strong> service 
        has been rescheduled. We apologize for any inconvenience and appreciate your understanding.
      </Text>
    </Section>

    {/* Schedule Change Details */}
    <Section style={detailsSection}>
      <Heading style={sectionHeading}>📋 Schedule Change Details</Heading>
      
      <div style={scheduleComparison}>
        {/* Previous Schedule */}
        <div style={scheduleBox}>
          <div style={scheduleHeader}>
            <span style={scheduleIcon}>❌</span>
            <Text style={scheduleTitle}>Previous Schedule</Text>
          </div>
          <div style={scheduleContent}>
            <Text style={scheduleDate}>{oldDate}</Text>
            <Text style={scheduleTime}>{oldTime}</Text>
          </div>
        </div>

        {/* Arrow */}
        <div style={arrowContainer}>
          <span style={arrowIcon}>➡️</span>
        </div>

        {/* New Schedule */}
        <div style={{...scheduleBox, ...newScheduleBox}}>
          <div style={scheduleHeader}>
            <span style={scheduleIcon}>✅</span>
            <Text style={scheduleTitle}>New Schedule</Text>
          </div>
          <div style={scheduleContent}>
            <Text style={{...scheduleDate, ...newScheduleDate}}>{newDate}</Text>
            <Text style={{...scheduleTime, ...newScheduleTime}}>{newTime}</Text>
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
      <Heading style={sectionHeading}>🔔 What to Expect</Heading>
      <div style={expectationList}>
        <div style={expectationItem}>
          <span style={expectationNumber}>1</span>
          <Text style={expectationText}>
            <strong>Reminder Notifications:</strong> You'll receive SMS and email reminders 24 hours before your new appointment
          </Text>
        </div>
        <div style={expectationItem}>
          <span style={expectationNumber}>2</span>
          <Text style={expectationText}>
            <strong>Professional Team:</strong> Our fully insured and bonded cleaning professionals will arrive on time
          </Text>
        </div>
        <div style={expectationItem}>
          <span style={expectationNumber}>3</span>
          <Text style={expectationText}>
            <strong>Quality Service:</strong> We'll provide the same exceptional {cleaningType} service you've come to expect
          </Text>
        </div>
      </div>
    </Section>

    {/* Action Section */}
    <Section style={actionSection}>
      <Button href="#" style={ctaButton}>
        📱 Manage My Services
      </Button>
      <Text style={actionText}>
        Need to make changes? Use our customer portal to reschedule, add services, or contact support.
      </Text>
    </Section>

    {/* Support Section */}
    <Section style={supportSection}>
      <Heading style={supportHeading}>❓ Questions or Concerns?</Heading>
      <Text style={supportText}>
        We understand that schedule changes can be inconvenient. Our customer service team is standing by 
        to help with any questions or to discuss alternative scheduling options.
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
        🙏 Thank you for your continued trust in Bay Area Cleaning Professionals. 
        We're committed to providing you with exceptional service and look forward to seeing you on {newDate}!
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

const detailsSection = {
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

const scheduleComparison = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '20px',
  alignItems: 'center',
  marginBottom: '30px',
}

const scheduleBox = {
  backgroundColor: '#FEF2F2',
  padding: '20px',
  borderRadius: '12px',
  border: '2px solid #FECACA',
  textAlign: 'center' as const,
}

const newScheduleBox = {
  backgroundColor: '#ECFDF5',
  border: '2px solid #BBF7D0',
}

const scheduleHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '15px',
}

const scheduleIcon = {
  fontSize: '20px',
}

const scheduleTitle = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const scheduleContent = {
  textAlign: 'center' as const,
}

const scheduleDate = {
  color: '#DC2626',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 5px 0',
}

const scheduleTime = {
  color: '#DC2626',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const newScheduleDate = {
  color: '#059669',
}

const newScheduleTime = {
  color: '#059669',
}

const arrowContainer = {
  textAlign: 'center' as const,
}

const arrowIcon = {
  fontSize: '24px',
  color: '#8B5CF6',
}

const addressSection = {
  backgroundColor: '#F0F9FF',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #BAE6FD',
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
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '14px',
  flexShrink: '0',
}

const expectationText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const actionSection = {
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
  marginBottom: '15px',
}

const actionText = {
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

export default ServiceRescheduledEmail