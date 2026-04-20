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
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface EmailBaseProps {
  preview: string;
  children: React.ReactNode;
  isMarketing?: boolean;
}

/**
 * AlphaLux Cleaning — transactional email shell.
 * Palette:
 *  - Navy:       #0F2A44
 *  - Navy Deep:  #1B314B
 *  - Gold:       #A17938
 *  - Gold Light: #ECC98B
 *  - Gold Pale:  #F6DFA8
 *  - Cream:      #FCFBF7
 */
export const EmailBase = ({
  preview,
  children,
  isMarketing = false,
}: EmailBaseProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={topBar} />
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Link href="https://alphaluxcleaning.com">
              <Img
                src="https://alphaluxcleaning.com/wp-content/uploads/2024/08/alphalux-logo.png"
                width="180"
                height="60"
                alt="AlphaLux Cleaning"
                style={logo}
              />
            </Link>
            <Text style={tagline}>A Higher Standard of Clean</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={brandName}>AlphaLux Cleaning</Text>
            <Text style={footerText}>
              Premium Residential & Commercial Cleaning
              <br />
              Long Island, NY • New Jersey • Texas • California
            </Text>

            <Text style={footerText}>
              <Link href="tel:+18577544557" style={footerLink}>
                +1 (857) 754-4557
              </Link>
              {" • "}
              <Link
                href="mailto:support@alphaluxcleaning.com"
                style={footerLink}
              >
                support@alphaluxcleaning.com
              </Link>
            </Text>

            {isMarketing && (
              <Text style={footerText}>
                <Link href="{{UnsubscribeURL}}" style={footerLink}>
                  Unsubscribe
                </Link>
                {" • "}
                <Link
                  href="https://alphaluxcleaning.com/privacy-policy"
                  style={footerLink}
                >
                  Privacy Policy
                </Link>
              </Text>
            )}

            <Text style={copyright}>
              © {new Date().getFullYear()} AlphaLux Cleaning. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Container>
    </Body>
  </Html>
);

export const GoogleGuaranteedBadge = () => (
  <Section style={trustBadgeContainer}>
    <div style={trustBadge}>
      <div style={badgeIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z"
            fill="#A17938"
          />
          <path
            d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
            fill="white"
          />
        </svg>
      </div>
      <div style={badgeText}>
        <Text style={badgeTitle}>Google Guaranteed</Text>
        <Text style={badgeSubtitle}>Backed by Google's guarantee</Text>
      </div>
    </div>
  </Section>
);

export const ActionButton = ({
  href,
  children,
  style: customStyle,
}: {
  href: string;
  children: React.ReactNode;
  style?: any;
}) => (
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
        <td style={tableCellValue}>
          {booking.service_date} ({booking.time_window})
        </td>
      </tr>
      <tr>
        <td style={tableCell}>Address:</td>
        <td style={tableCellValue}>
          {booking.address_line1}
          <br />
          {booking.city}, {booking.state} {booking.postal_code}
        </td>
      </tr>
      <tr style={totalRow}>
        <td style={tableCell}>Total:</td>
        <td style={tableCellValue}>
          <strong>${booking.price_final}</strong>
        </td>
      </tr>
    </table>
  </Section>
);

// Shared brand styles for use by individual templates
export const brandStyles = {
  headingPrimary: {
    color: "#0F2A44",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1.2,
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  headingSecondary: {
    color: "#0F2A44",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 12px 0",
  } as React.CSSProperties,
  paragraph: {
    color: "#1B314B",
    fontSize: "16px",
    lineHeight: 1.6,
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  muted: {
    color: "#5a6b7d",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "0 0 12px 0",
  } as React.CSSProperties,
  callout: {
    backgroundColor: "#FCFBF7",
    border: "1px solid #ECC98B",
    borderLeft: "4px solid #A17938",
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "20px 0",
    color: "#0F2A44",
    fontSize: "15px",
    lineHeight: 1.6,
  } as React.CSSProperties,
};

// Styles
const main: React.CSSProperties = {
  backgroundColor: "#FCFBF7",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  margin: 0,
  padding: 0,
};

const outer: React.CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  padding: 0,
};

const topBar: React.CSSProperties = {
  background:
    "linear-gradient(135deg, #F6DFA8 0%, #ECC98B 40%, #A17938 100%)",
  height: "6px",
  width: "100%",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  boxShadow: "0 2px 12px rgba(15, 42, 68, 0.06)",
};

const header: React.CSSProperties = {
  borderBottom: "1px solid #F0E9D6",
  padding: "32px 20px 20px 20px",
  marginBottom: 0,
  textAlign: "center" as const,
  backgroundColor: "#ffffff",
};

const logo: React.CSSProperties = {
  margin: "0 auto",
};

const tagline: React.CSSProperties = {
  margin: "12px 0 0 0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "13px",
  fontStyle: "italic",
  color: "#A17938",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const content: React.CSSProperties = {
  padding: "36px 28px",
  backgroundColor: "#ffffff",
};

const divider: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid #F0E9D6",
  margin: "0",
};

const footer: React.CSSProperties = {
  padding: "28px 24px 32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#FCFBF7",
};

const brandName: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "16px",
  fontWeight: 700,
  color: "#0F2A44",
  letterSpacing: "0.02em",
};

const footerText: React.CSSProperties = {
  color: "#5a6b7d",
  fontSize: "13px",
  lineHeight: "1.55",
  margin: "4px 0",
};

const footerLink: React.CSSProperties = {
  color: "#A17938",
  textDecoration: "none",
  fontWeight: 600,
};

const copyright: React.CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: "11px",
  color: "#a5adb8",
};

const buttonStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, #F6DFA8 0%, #ECC98B 45%, #A17938 100%)",
  borderRadius: "999px",
  color: "#0F2A44",
  fontSize: "16px",
  fontWeight: 700,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 36px",
  margin: "16px 0",
  boxShadow: "0 6px 18px rgba(161, 121, 56, 0.35)",
  letterSpacing: "0.02em",
};

// OrderSummary component styles
const orderSummary: React.CSSProperties = {
  backgroundColor: "#FCFBF7",
  padding: "24px",
  borderRadius: "12px",
  margin: "24px 0",
  border: "1px solid #F0E9D6",
};

const h2: React.CSSProperties = {
  color: "#0F2A44",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  borderBottom: "2px solid #ECC98B",
  paddingBottom: "8px",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableCell: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "14px",
  color: "#5a6b7d",
  borderBottom: "1px solid #EEE6D4",
  verticalAlign: "top",
  width: "40%",
};

const tableCellValue: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "14px",
  color: "#0F2A44",
  borderBottom: "1px solid #EEE6D4",
  fontWeight: "500",
};

const totalRow: React.CSSProperties = {
  borderTop: "2px solid #A17938",
};

// Google Guaranteed Badge Styles (branded gold)
const trustBadgeContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const trustBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#FCFBF7",
  padding: "12px 24px",
  borderRadius: "999px",
  border: "1px solid #ECC98B",
};

const badgeIcon: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const badgeText: React.CSSProperties = {
  textAlign: "left" as const,
};

const badgeTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#0F2A44",
  margin: "0",
  lineHeight: "1.2",
};

const badgeSubtitle: React.CSSProperties = {
  fontSize: "11px",
  color: "#A17938",
  margin: "2px 0 0 0",
  lineHeight: "1.2",
};
