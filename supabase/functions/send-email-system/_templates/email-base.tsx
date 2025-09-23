import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
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
              src="/brand/alphaluxclean-logo.png"
              width="180"
              height="60"
              alt="AlphaLuxClean"
              style={logo}
            />
          </Link>
        </Section>

        {/* Content */}
        <Section style={content}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            AlphaLuxClean<br />
            123 Main Street, Suite 100<br />
            Dallas, TX 75201<br />
            Phone: (555) 123-4567
          </Text>
          
          <Text style={footerLinks}>
            <Link href="https://app.alphaluxclean.com/contact" style={link}>
              Contact Support
            </Link>
            {" | "}
            <Link href="https://app.alphaluxclean.com/privacy" style={link}>
              Privacy Policy
            </Link>
            {isMarketing && (
              <>
                {" | "}
                <Link href="https://app.alphaluxclean.com/email-preferences" style={link}>
                  Email Preferences
                </Link>
                {" | "}
                <Link href="https://app.alphaluxclean.com/unsubscribe" style={link}>
                  Unsubscribe
                </Link>
              </>
            )}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
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

// Shared button component
export const ActionButton = ({ href, children, style: customStyle }: { href: string; children: React.ReactNode; style?: any }) => (
  <Button href={href} style={{ ...button, ...customStyle }}>
    {children}
  </Button>
);

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const header = {
  padding: "20px 0",
  borderBottom: "1px solid #eee",
  textAlign: "center" as const,
};

const logo = {
  display: "block",
  margin: "0 auto",
};

const content = {
  padding: "40px 20px",
};

const footer = {
  borderTop: "1px solid #eee",
  paddingTop: "20px",
  textAlign: "center" as const,
};

const footerText = {
  margin: "0 0 16px 0",
  fontSize: "14px",
  lineHeight: "1.4",
  color: "#666",
};

const footerLinks = {
  margin: "0",
  fontSize: "12px",
  color: "#999",
};

const link = {
  color: "#ECC98B",
  textDecoration: "none",
};

const h2 = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1A1A1A",
  margin: "0 0 20px 0",
};

const orderSummary = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableCell = {
  padding: "8px 0",
  fontSize: "14px",
  color: "#666",
  verticalAlign: "top" as const,
  width: "40%",
};

const tableCellValue = {
  padding: "8px 0",
  fontSize: "14px",
  color: "#1A1A1A",
  verticalAlign: "top" as const,
  fontWeight: "500",
};

const totalRow = {
  borderTop: "1px solid #ddd",
  paddingTop: "12px",
};

const button = {
  backgroundColor: "#ECC98B",
  borderRadius: "8px",
  color: "#1A1A1A",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  margin: "16px 0",
};