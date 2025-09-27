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

interface TestEmailProps {
  message?: string;
  testData?: any;
}

export const TestEmail = ({
  message = "This is a test email",
  testData,
}: TestEmailProps) => {
  return (
    <EmailBase preview="Test email from your application">
      <Section style={section}>
        <Heading style={h1}>
          🧪 Test Email
        </Heading>
        
        <Text style={text}>
          {message}
        </Text>

        <Text style={text}>
          This email was sent to verify that your email system is working correctly.
        </Text>

        {testData && (
          <Section style={dataSection}>
            <Text style={dataHeader}>
              <strong>Test Data:</strong>
            </Text>
            <Text style={dataText}>
              {JSON.stringify(testData, null, 2)}
            </Text>
          </Section>
        )}

        <Text style={text}>
          If you received this email, your email configuration is working properly! 🎉
        </Text>

        <Text style={text}>
          Time sent: {new Date().toISOString()}
        </Text>

        <Text style={text}>
          Best regards,<br />
          Your Application
        </Text>
      </Section>
    </EmailBase>
  );
};

export default TestEmail;

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

const dataSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const dataHeader = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const dataText = {
  color: '#4b5563',
  fontSize: '12px',
  fontFamily: 'monospace',
  lineHeight: '1.4',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};