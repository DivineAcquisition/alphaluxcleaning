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

export interface BookingAdminNotificationProps {
  orderId: string;
  bookingId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  service: {
    type: string;
    frequency: string;
    offerName?: string;
    visitCount?: number | null;
    isRecurring?: boolean;
  };
  schedule: {
    date: string;          // formatted "Monday, May 15, 2026"
    arrivalWindow: string; // formatted "1 – 3 PM"
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  pricing: {
    total: number;
    deposit: number;
    balance: number;
    promoCode?: string;
    promoDiscount?: number;
  };
  stripe?: {
    accountSlug?: string;          // "try" | "book"
    paymentIntentId?: string | null;
  };
  hcp?: {
    jobId?: string | null;
    customerId?: string | null;
  };
  ghl?: {
    contactId?: string | null;
  };
  secondVisit?: {
    date: string;
    arrivalWindow: string;
    type?: string;
  } | null;
  specialInstructions?: string | null;
  adminConsoleUrl?: string | null;
}

export const BookingAdminNotification = ({
  orderId,
  bookingId,
  customer,
  service,
  schedule,
  address,
  pricing,
  stripe,
  hcp,
  ghl,
  secondVisit,
  specialInstructions,
  adminConsoleUrl,
}: BookingAdminNotificationProps) => (
  <Html>
    <Head />
    <Preview>
      New booking: {customer.name} · {service.offerName || service.type} ·{' '}
      {schedule.date}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header — same gradient + h1 treatment as the customer
            confirmation email so ops sees a visually-consistent
            email family. */}
        <Section style={header}>
          <Heading style={h1}>New Paid Booking</Heading>
          <Text style={orderNumber}>Order #{orderId}</Text>
          <Text style={orderMeta}>
            ${pricing.total.toFixed(2)} · {service.offerName || service.type}
          </Text>
        </Section>

        <Section style={content}>
          {/* Customer */}
          <Section style={card}>
            <Heading style={cardHeading}>Customer</Heading>
            <Section style={detailRow}>
              <Text style={label}>Name:</Text>
              <Text style={value}>{customer.name}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Email:</Text>
              <Text style={value}>
                <Link href={`mailto:${customer.email}`} style={inlineLink}>
                  {customer.email}
                </Link>
              </Text>
            </Section>
            <Section style={detailRowLast}>
              <Text style={label}>Phone:</Text>
              <Text style={value}>
                {customer.phone ? (
                  <Link
                    href={`tel:${customer.phone.replace(/\D/g, '')}`}
                    style={inlineLink}
                  >
                    {customer.phone}
                  </Link>
                ) : (
                  '—'
                )}
              </Text>
            </Section>
          </Section>

          {/* Service & Schedule */}
          <Section style={card}>
            <Heading style={cardHeading}>Service & Schedule</Heading>
            <Section style={detailRow}>
              <Text style={label}>Service:</Text>
              <Text style={value}>
                {service.offerName || service.type}
                {service.visitCount && service.visitCount > 1
                  ? ` · ${service.visitCount} visits`
                  : ''}
              </Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Type:</Text>
              <Text style={value}>{service.type}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Frequency:</Text>
              <Text style={value}>
                {service.frequency}
                {service.isRecurring ? ' (recurring)' : ''}
              </Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Date:</Text>
              <Text style={value}>{schedule.date}</Text>
            </Section>
            <Section style={detailRowLast}>
              <Text style={label}>Arrival window:</Text>
              <Text style={value}>{schedule.arrivalWindow}</Text>
            </Section>
          </Section>

          {/* Follow-up visit (combo only) */}
          {secondVisit && (
            <Section style={card}>
              <Heading style={cardHeading}>
                Follow-up Visit (Deep + Standard Combo)
              </Heading>
              <Section style={detailRow}>
                <Text style={label}>Type:</Text>
                <Text style={value}>
                  {(secondVisit.type || 'standard').toUpperCase()}
                </Text>
              </Section>
              <Section style={detailRow}>
                <Text style={label}>Date:</Text>
                <Text style={value}>{secondVisit.date}</Text>
              </Section>
              <Section style={detailRowLast}>
                <Text style={label}>Arrival window:</Text>
                <Text style={value}>{secondVisit.arrivalWindow}</Text>
              </Section>
              <Text style={subtle}>
                Schedule the follow-up as a separate HCP job within 14 days of
                the initial Deep Clean.
              </Text>
            </Section>
          )}

          {/* Address */}
          <Section style={card}>
            <Heading style={cardHeading}>Service Address</Heading>
            <Section style={detailRowLast}>
              <Text style={value}>
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}, {address.state} {address.postalCode}
              </Text>
            </Section>
          </Section>

          {/* Pricing */}
          <Section style={card}>
            <Heading style={cardHeading}>Pricing</Heading>
            <Section style={detailRow}>
              <Text style={label}>Service total:</Text>
              <Text style={valueTotal}>${pricing.total.toFixed(2)}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Deposit paid:</Text>
              <Text style={valuePrimary}>${pricing.deposit.toFixed(2)}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={label}>Balance:</Text>
              <Text style={value}>${pricing.balance.toFixed(2)}</Text>
            </Section>
            {pricing.promoCode ? (
              <Section style={detailRowLast}>
                <Text style={label}>Promo:</Text>
                <Text style={value}>
                  {pricing.promoCode}
                  {pricing.promoDiscount
                    ? ` (-$${pricing.promoDiscount.toFixed(2)})`
                    : ''}
                </Text>
              </Section>
            ) : null}
          </Section>

          {/* Integrations */}
          <Section style={card}>
            <Heading style={cardHeading}>Integrations</Heading>
            <Section style={detailRow}>
              <Text style={label}>Booking ID:</Text>
              <Text style={mono}>{bookingId}</Text>
            </Section>
            {stripe?.accountSlug ? (
              <Section style={detailRow}>
                <Text style={label}>Stripe account:</Text>
                <Text style={value}>
                  {stripe.accountSlug === 'book' ? 'BOOK (CA/TX)' : 'TRY (NY)'}
                </Text>
              </Section>
            ) : null}
            {stripe?.paymentIntentId ? (
              <Section style={detailRow}>
                <Text style={label}>Stripe PI:</Text>
                <Text style={mono}>
                  <Link
                    href={`https://dashboard.stripe.com/payments/${stripe.paymentIntentId}`}
                    style={inlineLink}
                  >
                    {stripe.paymentIntentId}
                  </Link>
                </Text>
              </Section>
            ) : null}
            {hcp?.jobId ? (
              <Section style={detailRow}>
                <Text style={label}>HCP job:</Text>
                <Text style={mono}>{hcp.jobId}</Text>
              </Section>
            ) : (
              <Section style={detailRow}>
                <Text style={label}>HCP job:</Text>
                <Text style={subtleInline}>not yet synced</Text>
              </Section>
            )}
            {ghl?.contactId ? (
              <Section style={detailRowLast}>
                <Text style={label}>GHL contact:</Text>
                <Text style={mono}>{ghl.contactId}</Text>
              </Section>
            ) : (
              <Section style={detailRowLast}>
                <Text style={label}>GHL contact:</Text>
                <Text style={subtleInline}>not yet synced</Text>
              </Section>
            )}
          </Section>

          {/* Special instructions */}
          {specialInstructions ? (
            <Section style={card}>
              <Heading style={cardHeading}>Notes / Special Instructions</Heading>
              <Text style={instructionsText}>{specialInstructions}</Text>
            </Section>
          ) : null}

          {/* CTA */}
          {adminConsoleUrl ? (
            <Section style={buttonContainer}>
              <Link href={adminConsoleUrl} style={button}>
                Open booking in admin
              </Link>
            </Section>
          ) : null}
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            AlphaLux Clean — Internal Booking Notification
          </Text>
          <Text style={footerSubtle}>
            Sent to internal ops mailboxes only · do not forward.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BookingAdminNotification;

// ---------- Styles (mirror booking-confirmation.tsx) ----------

const main = {
  backgroundColor: '#F8F8F7',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '640px',
};

const header = {
  background: 'linear-gradient(135deg, #0F77CC 0%, #1B314B 100%)',
  padding: '28px 20px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0',
  padding: '0',
  letterSpacing: '-0.01em',
};

const orderNumber = {
  color: '#EFF7FE',
  fontSize: '14px',
  fontWeight: 600,
  margin: '8px 0 0 0',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

const orderMeta = {
  color: '#ffffff',
  fontSize: '15px',
  margin: '6px 0 0 0',
  opacity: 0.9,
};

const content = {
  backgroundColor: '#ffffff',
  padding: '28px 22px',
  borderRadius: '0 0 8px 8px',
};

const card = {
  backgroundColor: '#f9fafb',
  padding: '18px 20px',
  borderRadius: '8px',
  margin: '18px 0',
  border: '1px solid #e5e7eb',
};

const cardHeading = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#0F77CC',
  margin: '0 0 12px 0',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
};

const detailRow = {
  display: 'block',
  margin: '0 0 8px 0',
};

const detailRowLast = {
  display: 'block',
  margin: '0',
};

const label = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
  padding: '0',
  fontWeight: 500,
  display: 'inline-block',
  minWidth: '120px',
};

const value = {
  color: '#1B314B',
  fontSize: '14px',
  margin: '0',
  padding: '0',
  display: 'inline-block',
  fontWeight: 500,
};

const valuePrimary = {
  ...value,
  color: '#0F77CC',
  fontWeight: 700,
};

const valueTotal = {
  ...value,
  color: '#1B314B',
  fontWeight: 700,
};

const mono = {
  color: '#1B314B',
  fontSize: '12px',
  margin: '0',
  padding: '0',
  display: 'inline-block',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

const inlineLink = {
  color: '#0F77CC',
  textDecoration: 'none',
};

const subtle = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '10px 0 0 0',
  fontStyle: 'italic' as const,
};

const subtleInline = {
  ...value,
  color: '#9ca3af',
  fontWeight: 400,
  fontStyle: 'italic' as const,
};

const instructionsText = {
  color: '#1B314B',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  padding: '0',
  whiteSpace: 'pre-wrap' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 8px 0',
};

const button = {
  background: '#0F77CC',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  display: 'inline-block',
};

const footer = {
  textAlign: 'center' as const,
  padding: '18px 16px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
  fontWeight: 600,
};

const footerSubtle = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '4px 0 0 0',
};
