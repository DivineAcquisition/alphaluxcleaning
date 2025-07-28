import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Button,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { BaseEmailTemplate } from "./base-template";

export interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  cleaningType: string;
  frequency: string;
  squareFootage?: string;
  addOns: string;
  amount: string;
  serviceDetailsUrl: string;
}

export function OrderConfirmationEmail({
  customerName = "Valued Customer",
  orderId = "ORDER123",
  cleaningType = "Deep Cleaning",
  frequency = "One-time",
  squareFootage,
  addOns = "None",
  amount = "0.00",
  serviceDetailsUrl = "#",
}: OrderConfirmationEmailProps) {
  const previewText = `Order confirmation for your ${cleaningType} service - ${orderId}`;

  return (
    <BaseEmailTemplate previewText={previewText}>
      <Section style={headerSection}>
        <Text style={successText}>✅ Order Confirmed!</Text>
        <Heading style={mainHeading}>
          Thank you for choosing Bay Area Cleaning Pros
        </Heading>
        <Text style={subHeading}>
          Your cleaning service has been successfully booked
        </Text>
      </Section>

      <Section style={contentSection}>
        <Text style={greeting}>Hello {customerName},</Text>
        
        <Text style={paragraph}>
          Great news! We've received your order and payment. Here are the details of your booking:
        </Text>

        <Section style={orderDetailsBox}>
          <Heading as="h2" style={sectionHeading}>
            Order Details
          </Heading>
          
          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={labelText}>Order ID:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={valueText}>#{orderId}</Text>
            </Column>
          </Row>

          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={labelText}>Service Type:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={valueText}>{cleaningType}</Text>
            </Column>
          </Row>

          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={labelText}>Frequency:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={valueText}>{frequency}</Text>
            </Column>
          </Row>

          {squareFootage && (
            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Square Footage:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{squareFootage} sq ft</Text>
              </Column>
            </Row>
          )}

          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={labelText}>Add-ons:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={valueText}>{addOns}</Text>
            </Column>
          </Row>

          <Hr style={divider} />

          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={totalLabel}>Total Amount:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={totalAmount}>${amount}</Text>
            </Column>
          </Row>
        </Section>

        <Section style={nextStepsSection}>
          <Heading as="h2" style={sectionHeading}>
            What's Next?
          </Heading>
          
          <Text style={paragraph}>
            <strong>1.</strong> Complete your service details (address, special instructions, etc.)
          </Text>
          <Text style={paragraph}>
            <strong>2.</strong> Schedule your preferred date and time
          </Text>
          <Text style={paragraph}>
            <strong>3.</strong> Our professional team will arrive ready to clean
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={primaryButton} href={serviceDetailsUrl}>
            Complete Service Details
          </Button>
        </Section>

        <Section style={contactSection}>
          <Text style={contactHeading}>Need Help?</Text>
          <Text style={contactText}>
            📞 Phone: (281) 201-6112<br />
            ✉️ Email: support@bayareacleaningpros.com
          </Text>
        </Section>

        <Text style={footerText}>
          Thank you for choosing Bay Area Cleaning Pros. We look forward to providing you with exceptional cleaning service!
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}

// Styles
const headerSection = {
  padding: "40px 20px",
  textAlign: "center" as const,
  backgroundColor: "#f8f9fa",
  borderRadius: "8px 8px 0 0",
};

const successText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#10b981",
  margin: "0 0 16px 0",
};

const mainHeading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 12px 0",
  lineHeight: "1.3",
};

const subHeading = {
  fontSize: "16px",
  color: "#6b7280",
  margin: "0",
};

const contentSection = {
  padding: "40px 20px",
};

const greeting = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 20px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px 0",
};

const orderDetailsBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const sectionHeading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 20px 0",
};

const detailRow = {
  marginBottom: "12px",
};

const labelColumn = {
  width: "40%",
  verticalAlign: "top" as const,
};

const valueColumn = {
  width: "60%",
  verticalAlign: "top" as const,
};

const labelText = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  fontWeight: "500",
};

const valueText = {
  fontSize: "14px",
  color: "#1f2937",
  margin: "0",
  fontWeight: "600",
};

const totalLabel = {
  fontSize: "16px",
  color: "#1f2937",
  margin: "0",
  fontWeight: "bold",
};

const totalAmount = {
  fontSize: "18px",
  color: "#059669",
  margin: "0",
  fontWeight: "bold",
};

const divider = {
  margin: "16px 0",
  borderColor: "#d1d5db",
};

const nextStepsSection = {
  margin: "32px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#059669",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: "8px",
  display: "inline-block",
  border: "none",
};

const contactSection = {
  backgroundColor: "#f3f4f6",
  padding: "24px",
  borderRadius: "8px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const contactHeading = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 12px 0",
};

const contactText = {
  fontSize: "14px",
  color: "#374151",
  margin: "0",
  lineHeight: "1.6",
};

const footerText = {
  fontSize: "14px",
  color: "#6b7280",
  fontStyle: "italic",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};