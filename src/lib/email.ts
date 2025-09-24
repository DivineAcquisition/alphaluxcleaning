import { supabase } from "@/integrations/supabase/client";

export interface SendEmailRequest {
  companyId: string;
  to: string;
  templateKey: string;
  variables: Record<string, any>;
}

export const sendEmail = async (request: SendEmailRequest) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-system-email', {
      body: request
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (
  customerEmail: string,
  customerName: string,
  serviceDate: string,
  serviceTime: string,
  portalUrl?: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: customerEmail,
    templateKey: 'booking_confirmation',
    variables: {
      customer_name: customerName,
      service_date: serviceDate,
      service_time: serviceTime,
      portal_url: portalUrl
    }
  });
};

export const sendBookingReminder = async (
  customerEmail: string,
  customerName: string,
  serviceDate: string,
  serviceTime: string,
  reminderType: '24h' | '1h' = '24h'
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: customerEmail,
    templateKey: reminderType === '24h' ? 'booking_reminder_24h' : 'booking_reminder_1h',
    variables: {
      customer_name: customerName,
      service_date: serviceDate,
      service_time: serviceTime
    }
  });
};

export const sendPaymentReceipt = async (
  customerEmail: string,
  customerName: string,
  amount: string,
  transactionId: string,
  serviceDate: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: customerEmail,
    templateKey: 'receipt',
    variables: {
      customer_name: customerName,
      amount,
      transaction_id: transactionId,
      service_date: serviceDate
    }
  });
};

export const sendPortalMagicLink = async (
  customerEmail: string,
  magicLink: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: customerEmail,
    templateKey: 'portal_magic_link',
    variables: {
      magic_link: magicLink
    }
  });
};

export const sendOTP = async (
  email: string,
  code: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: email,
    templateKey: 'otp',
    variables: {
      code
    }
  });
};

export const sendJobOffer = async (
  subcontractorEmail: string,
  subcontractorName: string,
  serviceDate: string,
  serviceTime: string,
  address: string,
  payout: string,
  acceptUrl: string,
  declineUrl: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: subcontractorEmail,
    templateKey: 'sub_offer',
    variables: {
      subcontractor_name: subcontractorName,
      service_date: serviceDate,
      service_time: serviceTime,
      address,
      payout,
      accept_url: acceptUrl,
      decline_url: declineUrl
    }
  });
};

export const sendJobReminder = async (
  subcontractorEmail: string,
  subcontractorName: string,
  serviceTime: string,
  customerName: string,
  address: string
) => {
  return sendEmail({
    companyId: '550e8400-e29b-41d4-a716-446655440000',
    to: subcontractorEmail,
    templateKey: 'sub_reminder',
    variables: {
      subcontractor_name: subcontractorName,
      service_time: serviceTime,
      customer_name: customerName,
      address
    }
  });
};