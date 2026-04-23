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
  Img,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface EmailBaseProps {
  preview: string;
  children: React.ReactNode;
  isMarketing?: boolean;
}

export const EmailBase = ({ preview, children, isMarketing = false }: EmailBaseProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Link href="https://app.alphaluxclean.com">
            <Img
              src="https://app.alphaluxclean.com/logo.png"
              width="120"
              height="40"
              alt="AlphaLuxClean"
              style={logo}
            />
          </Link>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            <Link href="https://app.alphaluxclean.com" style={footerLink}>
              AlphaLuxClean
            </Link>
            <br />
            Premium cleaning services in Texas and California
          </Text>
          
          <Text style={footerText}>
            <Link href="tel:+15551234567" style={footerLink}>
              (555) 123-4567
            </Link>
            {" • "}
            <Link href="mailto:support@alphaluxclean.com" style={footerLink}>
              support@alphaluxclean.com
            </Link>
          </Text>

          {isMarketing && (
            <Text style={footerText}>
              <Link href="{{UnsubscribeURL}}" style={footerLink}>
                Unsubscribe
              </Link>
              {" • "}
              <Link href="https://app.alphaluxclean.com/privacy" style={footerLink}>
                Privacy Policy
              </Link>
            </Text>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
);

export const GoogleGuaranteedBadge = () => (
  <Section style={trustBadgeContainer}>
    <div style={trustBadge}>
      <div style={badgeIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" fill="#4CAF50"/>
          <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
        </svg>
      </div>
      <div style={badgeText}>
        <Text style={badgeTitle}>Google Guaranteed</Text>
        <Text style={badgeSubtitle}>Backed by Google's guarantee</Text>
      </div>
    </div>
  </Section>
);

export const ActionButton = ({ href, children, style: customStyle }: { href: string; children: React.ReactNode; style?: any }) => (
  <Link href={href} style={{ ...buttonStyle, ...customStyle }}>
    {children}
  </Link>
);

// Shared component for order summary table
export const OrderSummary = ({ booking }: { booking: any }) => (
  <Section style={orderSummary}>
    <Heading as="h2" style={h2}>
      Service Summary
    </Heading>
    <table style={table}>
      <tr>
        <td style={tableCell}>Service Type:</td>
        <td style={tableCellValue}>{booking.service_type}</td>
      </tr>
      <tr>
        <td style={tableCell}>Frequency:</td>
        <td style={tableCellValue}>{booking.frequency}</td>
      </tr>
      <tr>
        <td style={tableCell}>Home Size:</td>
        <td style={tableCellValue}>{booking.sqft_range}</td>
      </tr>
      {booking.addons_list && (
        <tr>
          <td style={tableCell}>Add-ons:</td>
          <td style={tableCellValue}>{booking.addons_list}</td>
        </tr>
      )}
      <tr>
        <td style={tableCell}>Date & Time:</td>
        <td style={tableCellValue}>{booking.service_date} ({booking.time_window})</td>
      </tr>
      <tr>
        <td style={tableCell}>Address:</td>
        <td style={tableCellValue}>
          {booking.address_line1}<br />
          {booking.city}, {booking.state} {booking.postal_code}
        </td>
      </tr>
      <tr style={totalRow}>
        <td style={tableCell}>Total:</td>
        <td style={tableCellValue}><strong>${booking.price_final}</strong></td>
      </tr>
    </table>
  </Section>
);

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  borderBottom: '1px solid #eaeaea',
  paddingBottom: '20px',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 20px',
};

const footer = {
  borderTop: '1px solid #eaeaea',
  paddingTop: '20px',
  marginTop: '40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const footerLink = {
  color: '#666666',
  textDecoration: 'underline',
};

const buttonStyle = {
  backgroundColor: '#1A1A1A',
  borderRadius: '6px',
  color: '#ffffff !important',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '16px 0',
};

// OrderSummary component styles
const orderSummary = {
  backgroundColor: '#f8f9fa',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
};

const h2 = {
  color: '#1A1A1A',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableCell = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#666',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
  width: '40%',
};

const tableCellValue = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#1A1A1A',
  borderBottom: '1px solid #eee',
  fontWeight: '500',
};

const totalRow = {
  borderTop: '2px solid #1A1A1A',
};

// Google Guaranteed Badge Styles
const trustBadgeContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const trustBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#E8F5E9',
  padding: '12px 24px',
  borderRadius: '8px',
  border: '1px solid #4CAF50',
};

const badgeIcon = {
  display: 'flex',
  alignItems: 'center',
};

const badgeText = {
  textAlign: 'left' as const,
};

const badgeTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#2E7D32',
  margin: '0',
  lineHeight: '1.2',
};

const badgeSubtitle = {
  fontSize: '11px',
  color: '#66BB6A',
  margin: '2px 0 0 0',
  lineHeight: '1.2',
};