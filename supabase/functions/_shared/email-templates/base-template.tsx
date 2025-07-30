import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface BaseEmailTemplateProps {
  previewText: string;
  children: React.ReactNode;
}

export const BaseEmailTemplate = ({
  previewText,
  children,
}: BaseEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        
        {/* Header */}
        <Section style={header}>
          <Heading style={headerHeading}>Bay Area Cleaning Professionals</Heading>
        </Section>
        
        {/* Main Content */}
        <Section style={content}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Bay Area Cleaning Professionals<br />
            📧 info@bayareacleaningpros.com | 📞 (415) 987-6543
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Simple, clean styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  padding: '20px',
}

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '30px',
}

const headerHeading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
}

const content = {
  padding: '0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
  borderTop: '1px solid #e5e7eb',
  marginTop: '30px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

export default BaseEmailTemplate