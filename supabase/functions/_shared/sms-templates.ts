/**
 * SMS Templates for OpenPhone Notifications
 * Keep messages under 160 characters for single SMS
 */

interface TemplateVariables {
  [key: string]: any;
}

export const SMS_TEMPLATES: Record<string, (vars: TemplateVariables) => string> = {
  booking_confirmed: (vars: TemplateVariables) => 
    `Hi ${vars.first_name}! Your ${vars.service_type} cleaning is confirmed for ${vars.service_date} (${vars.time_window}). Manage: ${vars.manage_link}`,
  
  referral_reward_earned: (vars: TemplateVariables) =>
    `🎉 Great news ${vars.first_name}! ${vars.referred_name} just booked their first cleaning. You earned ${vars.amount} credit! - AlphaLux Cleaning`,
  
  referral_welcome_credit: (vars: TemplateVariables) =>
    `Welcome ${vars.first_name}! ${vars.referrer_name} referred you. Enjoy ${vars.amount} credit on your account! - AlphaLux Cleaning`,
  
  black_friday_cyber90: (vars: TemplateVariables) =>
    `🖤 BLACK FRIDAY: Save $100 on your 90-Day Home Reset! Use code CYBER90 at checkout. Ends Dec 2nd. Book now: book.alphaluxclean.com?promo=CYBER90&source=sms - AlphaLux Cleaning`,
};

/**
 * Render an SMS template with variables
 */
export function renderSMSTemplate(templateId: string, variables: TemplateVariables): string {
  const template = SMS_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`SMS template not found: ${templateId}`);
  }
  return template(variables);
}
