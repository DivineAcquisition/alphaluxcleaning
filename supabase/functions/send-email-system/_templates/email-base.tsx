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
        {/* Header — navy band with the official AlphaLux Clean logo */}
        <Section style={header}>
          <Link href="https://app.alphaluxclean.com">
            <Img
              src="https://app.alphaluxclean.com/brand/alphalux-logo.png"
              width="180"
              height="60"
              alt="AlphaLux Clean"
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
            <Link href="mailto:support@alphaluxcleaning.com" style={footerLink}>
              support@alphaluxcleaning.com
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

// Brand palette — kept in sync with src/index.css token map.
//   Navy ink:        #1B314B
//   Deep navy:       #0E1C2E
//   Bright blue:     #0F77CC
//   Light blue:      #3DA0EB
//   Pale blue:       #D7ECFA
//   Cream bg:        #F8F8F7
//   Slate body:      #5B6B80
//   Border:          #DBE3EC
const COLORS = {
  navy: '#1B314B',
  navyDeep: '#0E1C2E',
  blue: '#0F77CC',
  blueDeep: '#0C5FA6',
  blueLight: '#3DA0EB',
  bluePale: '#D7ECFA',
  cream: '#F8F8F7',
  body: '#5B6B80',
  border: '#DBE3EC',
};

const main = {
  backgroundColor: COLORS.cream,
  fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  color: COLORS.navy,
};

const container = {
  margin: '0 auto',
  padding: '0 0 48px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 16px -4px rgba(27, 49, 75, 0.12)',
};

const header = {
  backgroundColor: COLORS.navy,
  padding: '24px 20px',
  marginBottom: '0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  filter: 'drop-shadow(0 2px 8px rgba(15, 119, 204, 0.35))',
};

const content = {
  padding: '24px 28px 8px',
};

const footer = {
  borderTop: `1px solid ${COLORS.border}`,
  paddingTop: '20px',
  paddingBottom: '20px',
  marginTop: '32px',
  textAlign: 'center' as const,
  backgroundColor: COLORS.cream,
};

const footerText = {
  color: COLORS.body,
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 16px',
};

const footerLink = {
  color: COLORS.blue,
  textDecoration: 'none',
  fontWeight: '500',
};

const buttonStyle = {
  backgroundColor: COLORS.blue,
  borderRadius: '8px',
  color: '#ffffff !important',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '16px 0',
  boxShadow: `0 4px 12px ${COLORS.blue}33`,
};

const orderSummary = {
  backgroundColor: COLORS.cream,
  padding: '24px',
  borderRadius: '10px',
  margin: '24px 0',
  border: `1px solid ${COLORS.border}`,
};

const h2 = {
  color: COLORS.navy,
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 16px 0',
  letterSpacing: '-0.02em',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableCell = {
  padding: '10px 0',
  fontSize: '14px',
  color: COLORS.body,
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
  width: '40%',
};

const tableCellValue = {
  padding: '10px 0',
  fontSize: '14px',
  color: COLORS.navy,
  borderBottom: `1px solid ${COLORS.border}`,
  fontWeight: '500',
};

const totalRow = {
  borderTop: `2px solid ${COLORS.blue}`,
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