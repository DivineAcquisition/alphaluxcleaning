import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EmailBase, ActionButton } from './email-base.tsx';

interface CustomerFeedbackNotificationProps {
  subcontractorName: string;
  customerName: string;
  serviceDate: string;
  serviceAddress: string;
  rating: number;
  feedback?: string;
  dashboardUrl: string;
}

export const CustomerFeedbackNotification = ({
  subcontractorName,
  customerName,
  serviceDate,
  serviceAddress,
  rating,
  feedback,
  dashboardUrl,
}: CustomerFeedbackNotificationProps) => {
  const getStarRating = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingMessage = (rating: number) => {
    if (rating >= 5) return "Excellent work! 🎉";
    if (rating >= 4) return "Great job! 👏";
    if (rating >= 3) return "Good work! 👍";
    if (rating >= 2) return "Room for improvement 📈";
    return "Let's work on this together 💪";
  };

  return (
    <EmailBase preview={`${rating} star review from ${customerName}`}>
      <Section style={section}>
        <Heading style={h1}>
          {rating >= 4 ? '🎉' : '📊'} Customer Feedback Received
        </Heading>
        
        <Text style={text}>
          Hi {subcontractorName},
        </Text>

        <Text style={text}>
          You've received feedback from a recent service! Here are the details:
        </Text>

        <Section style={detailsSection}>
          <Text style={detailsText}>
            <strong>Customer:</strong> {customerName}
          </Text>
          <Text style={detailsText}>
            <strong>Service Date:</strong> {serviceDate}
          </Text>
          <Text style={detailsText}>
            <strong>Location:</strong> {serviceAddress}
          </Text>
        </Section>

        <Section style={ratingSection}>
          <Text style={ratingHeader}>
            <strong>Rating Received:</strong>
          </Text>
          <Text style={starsText}>
            {getStarRating(rating)}
          </Text>
          <Text style={ratingText}>
            {rating}/5 stars - {getRatingMessage(rating)}
          </Text>
        </Section>

        {feedback && (
          <Section style={feedbackSection}>
            <Text style={feedbackHeader}>
              <strong>Customer Comments:</strong>
            </Text>
            <Text style={feedbackText}>
              "{feedback}"
            </Text>
          </Section>
        )}

        {rating >= 4 ? (
          <Text style={text}>
            Congratulations on the excellent service! Keep up the great work. Happy customers lead to more opportunities and better ratings.
          </Text>
        ) : (
          <Text style={text}>
            Thank you for your service. Every feedback is an opportunity to improve and provide even better service to our customers.
          </Text>
        )}

        <Text style={text}>
          You can view all your feedback and performance metrics in your dashboard:
        </Text>
        
        <ActionButton href={dashboardUrl}>
          View Dashboard
        </ActionButton>

        <Text style={text}>
          Keep up the excellent work! Customer satisfaction is key to building a successful cleaning business.
        </Text>

        <Text style={text}>
          Best regards,<br />
          AlphaLux Cleaning Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default CustomerFeedbackNotification;

// Styles
const section = {
  padding: '0 20px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const detailsText = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '8px 0',
};

const ratingSection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const ratingHeader = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const starsText = {
  fontSize: '28px',
  margin: '12px 0',
};

const ratingText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '8px 0 0 0',
};

const feedbackSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const feedbackHeader = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const feedbackText = {
  color: '#0f172a',
  fontSize: '16px',
  lineHeight: '1.6',
  fontStyle: 'italic',
  margin: '0',
};