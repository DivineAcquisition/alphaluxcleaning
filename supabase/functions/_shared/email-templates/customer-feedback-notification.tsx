import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface CustomerFeedbackNotificationProps {
  subcontractorName: string;
  customerName: string;
  serviceDate: string;
  serviceAddress: string;
  rating: number;
  feedback?: string;
  dashboardUrl?: string;
}

export const CustomerFeedbackNotification = ({
  subcontractorName,
  customerName,
  serviceDate,
  serviceAddress,
  rating,
  feedback,
  dashboardUrl,
}: CustomerFeedbackNotificationProps) => (
  <BaseEmailTemplate previewText={`Customer feedback from ${customerName} - ${rating} stars`}>
    
    <Heading style={heading}>Customer Feedback Received!</Heading>
    
    <Text style={text}>
      Hi {subcontractorName}, you've received feedback from your recent cleaning service.
    </Text>

    <Section style={feedbackSection}>
      <Heading style={subHeading}>Service Details</Heading>
      <Text style={detailText}><strong>Customer:</strong> {customerName}</Text>
      <Text style={detailText}><strong>Service Date:</strong> {serviceDate}</Text>
      <Text style={detailText}><strong>Address:</strong> {serviceAddress}</Text>
      
      <div style={ratingContainer}>
        <Text style={ratingLabel}>Customer Rating:</Text>
        <div style={starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                ...starStyle,
                color: star <= rating ? '#fbbf24' : '#d1d5db',
              }}
            >
              ★
            </span>
          ))}
          <Text style={ratingText}>{rating}/5 stars</Text>
        </div>
      </div>

      {feedback && (
        <>
          <Text style={feedbackLabel}><strong>Customer Comments:</strong></Text>
          <Text style={feedbackText}>"{feedback}"</Text>
        </>
      )}
    </Section>

    <Section style={rating >= 4 ? encouragementSection : improvementSection}>
      <Text style={rating >= 4 ? encouragementText : improvementText}>
        {rating >= 4 
          ? "🎉 Excellent work! Keep up the great service quality that makes our customers happy."
          : "💪 Use this feedback to continue improving your service quality. Every job is an opportunity to excel!"
        }
      </Text>
    </Section>

    {dashboardUrl && (
      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={button}>
          View Full Feedback
        </Button>
      </Section>
    )}

    <Text style={text}>
      Thank you for your dedication to providing excellent cleaning services!
    </Text>

  </BaseEmailTemplate>
)

// Styles
const heading = {
  color: '#10b981',
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

const detailText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const feedbackSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const ratingContainer = {
  margin: '15px 0',
}

const ratingLabel = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const starsContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
}

const starStyle = {
  fontSize: '24px',
  marginRight: '2px',
}

const ratingText = {
  color: '#6b7280',
  fontSize: '14px',
  marginLeft: '10px',
}

const feedbackLabel = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '15px 0 8px 0',
}

const feedbackText = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.5',
  fontStyle: 'italic',
  padding: '15px',
  backgroundColor: '#ffffff',
  borderLeft: '4px solid #10b981',
  borderRadius: '4px',
  margin: '8px 0',
}

const encouragementSection = {
  backgroundColor: '#dcfce7',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
}

const improvementSection = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
}

const encouragementText = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const improvementText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
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

export default CustomerFeedbackNotification