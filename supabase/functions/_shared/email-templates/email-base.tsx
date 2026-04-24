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
              alt="AlphaLux Clean"
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
            AlphaLux Clean<br />
            Premium Cleaning Services<br />
            Texas & California<br />
            Phone: (972) 559-0223
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
  color: "#2C5282",
  textDecoration: "none",
};

const button = {
  backgroundColor: "#0F77CC",
  borderRadius: "8px",
  color: "#1B314B",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  margin: "16px 0",
};