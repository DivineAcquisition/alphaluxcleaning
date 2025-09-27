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

interface SubcontractorWelcomeEmailProps {
  subcontractorName: string;
  loginUrl: string;
  onboardingUrl?: string;
}

export const SubcontractorWelcomeEmail = ({
  subcontractorName,
  loginUrl,
  onboardingUrl,
}: SubcontractorWelcomeEmailProps) => {
  return (
    <EmailBase preview="Welcome to our cleaning network!">
      <Section style={section}>
        <Heading style={h1}>
          🎉 Welcome to the Team!
        </Heading>
        
        <Text style={text}>
          Hi {subcontractorName},
        </Text>

        <Text style={text}>
          Welcome to our professional cleaning network! We're excited to have you join our team of skilled cleaning professionals.
        </Text>

        <Text style={text}>
          <strong>Next Steps:</strong>
        </Text>
        
        <Text style={text}>
          • Complete your profile setup<br />
          • Set your availability and service areas<br />
          • Review our service standards and procedures<br />
          • Start receiving job assignments
        </Text>

        {onboardingUrl && (
          <>
            <Text style={text}>
              Click the button below to complete your onboarding:
            </Text>
            
            <ActionButton href={onboardingUrl}>
              Complete Onboarding
            </ActionButton>
          </>
        )}

        <Text style={text}>
          You can access your dashboard anytime using the link below:
        </Text>
        
        <ActionButton href={loginUrl}>
          Access Dashboard
        </ActionButton>

        <Text style={text}>
          <strong>What to expect:</strong>
        </Text>
        
        <Text style={text}>
          • Flexible scheduling that works with your availability<br />
          • Competitive compensation for quality work<br />
          • Ongoing support from our team<br />
          • Opportunities for growth and additional services
        </Text>

        <Text style={text}>
          If you have any questions during the onboarding process, please don't hesitate to reach out to our support team.
        </Text>

        <Text style={text}>
          We look forward to working with you!
        </Text>

        <Text style={text}>
          Best regards,<br />
          The Team
        </Text>
      </Section>
    </EmailBase>
  );
};

export default SubcontractorWelcomeEmail;

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