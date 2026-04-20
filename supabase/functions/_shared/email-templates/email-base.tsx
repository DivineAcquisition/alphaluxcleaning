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
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface EmailBaseProps {
  preview: string;
  children: React.ReactNode;
  isMarketing?: boolean;
}

/**
 * AlphaLux Cleaning — branded email shell.
 * Palette (black & gold):
 *  - Ink:        #0A0A0B
 *  - Black:      #15120F
 *  - Warm Black: #1A1410
 *  - Elev Black: #272017
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
        {/* Top gold bar */}
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

          {/* Content */}
          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={brandName}>AlphaLux Cleaning</Text>
            <Text style={footerText}>
              Premium Residential & Commercial Cleaning
              <br />
              Serving Long Island, NY • New Jersey
              <br />
              Phone:{" "}
              <Link href="tel:+18577544557" style={link}>
                +1 (857) 754-4557
              </Link>
            </Text>

            <Text style={footerLinks}>
              <Link href="https://alphaluxcleaning.com/contact-us" style={link}>
                Contact Support
              </Link>
              {" • "}
              <Link
                href="https://alphaluxcleaning.com/privacy-policy"
                style={link}
              >
                Privacy Policy
              </Link>
              {isMarketing && (
                <>
                  {" • "}
                  <Link
                    href="https://alphaluxcleaning.com/email-preferences"
                    style={link}
                  >
                    Email Preferences
                  </Link>
                  {" • "}
                  <Link
                    href="https://alphaluxcleaning.com/unsubscribe"
                    style={link}
                  >
                    Unsubscribe
                  </Link>
                </>
              )}
            </Text>

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

// Shared button component (branded gold CTA)
export const ActionButton = ({
  href,
  children,
  style: customStyle,
}: {
  href: string;
  children: React.ReactNode;
  style?: any;
}) => (
  <Button href={href} style={{ ...button, ...customStyle }}>
    {children}
  </Button>
);

// Shared section styles exported for per-template use
export const brandStyles = {
  headingPrimary: {
    color: "#15120F",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1.2,
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  headingSecondary: {
    color: "#15120F",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 12px 0",
  } as React.CSSProperties,
  paragraph: {
    color: "#1A1410",
    fontSize: "16px",
    lineHeight: 1.6,
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  muted: {
    color: "#5a5348",
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
    color: "#15120F",
    fontSize: "15px",
    lineHeight: 1.6,
  } as React.CSSProperties,
  promoBadge: {
    display: "inline-block",
    background:
      "linear-gradient(135deg, #F6DFA8 0%, #ECC98B 45%, #A17938 100%)",
    color: "#0A0A0B",
    borderRadius: "999px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  detailRow: {
    padding: "10px 0",
    borderBottom: "1px solid #EEE6D4",
    fontSize: "15px",
    color: "#1A1410",
  } as React.CSSProperties,
};

// Styles
const main: React.CSSProperties = {
  backgroundColor: "#FCFBF7",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
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
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0",
  backgroundColor: "#ffffff",
  boxShadow: "0 2px 12px rgba(15, 42, 68, 0.06)",
};

const header: React.CSSProperties = {
  padding: "28px 20px 24px 20px",
  borderBottom: "1px solid #F0E9D6",
  textAlign: "center" as const,
  backgroundColor: "#0A0A0B",
};

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto",
};

const tagline: React.CSSProperties = {
  margin: "12px 0 0 0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "13px",
  fontStyle: "italic",
  color: "#ECC98B",
  letterSpacing: "0.12em",
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
  backgroundColor: "#0A0A0B",
  color: "#F6DFA8",
};

const brandName: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "16px",
  fontWeight: 700,
  color: "#ECC98B",
  letterSpacing: "0.04em",
};

const footerText: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(246, 223, 168, 0.8)",
};

const footerLinks: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontSize: "12px",
  color: "rgba(246, 223, 168, 0.65)",
};

const copyright: React.CSSProperties = {
  margin: "8px 0 0 0",
  fontSize: "11px",
  color: "rgba(246, 223, 168, 0.55)",
};

const link: React.CSSProperties = {
  color: "#ECC98B",
  textDecoration: "none",
  fontWeight: 600,
};

const button: React.CSSProperties = {
  background:
    "linear-gradient(135deg, #F6DFA8 0%, #ECC98B 45%, #A17938 100%)",
  borderRadius: "999px",
  color: "#0A0A0B",
  fontSize: "15px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 36px",
  margin: "20px 0",
  boxShadow: "0 8px 20px rgba(161, 121, 56, 0.45)",
  letterSpacing: "0.1em",
};
