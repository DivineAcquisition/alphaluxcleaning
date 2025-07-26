import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
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
        {/* Header with Logo */}
        <Section style={header}>
          <div style={logoContainer}>
            <Img
              src="/lovable-uploads/ad3d4805-1acc-4581-a7a7-3709bfe43093.png"
              alt="Bay Area Cleaning Professionals"
              style={logo}
            />
          </div>
        </Section>
        
        {/* Main Content */}
        <Section style={content}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Bay Area Cleaning Professionals<br />
            📧 info@bayareacleaningpros.com | 📞 (415) 987-6543<br />
            🌐 bayareacleaningpros.com
          </Text>
          <Text style={copyright}>
            © 2024 Bay Area Cleaning Professionals. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)',
}

const header = {
  background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
  padding: '40px 30px',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'inline-block',
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  backdropFilter: 'blur(10px)',
}

const logo = {
  height: '80px',
  width: 'auto',
}

const content = {
  padding: '40px 30px',
}

const footer = {
  backgroundColor: 'linear-gradient(135deg, #374151, #4B5563)',
  padding: '30px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#D1D5DB',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
}

const copyright = {
  color: '#9CA3AF',
  fontSize: '12px',
  margin: '0',
}

export default BaseEmailTemplate