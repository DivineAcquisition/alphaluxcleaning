import {
  Heading,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { EmailBase, ActionButton } from "./email-base.tsx";

interface ReferralRewardEarnedEmailProps {
  first_name: string;
  amount: string;
  referred_name: string;
  app_url: string;
}

export const ReferralRewardEarnedEmail = ({
  first_name,
  amount,
  referred_name,
  app_url,
}: ReferralRewardEarnedEmailProps) => (
  <EmailBase preview={`You earned ${amount} credit!`}>
    <Heading style={h1}>
      🎉 You earned {amount}!
    </Heading>
    
    <Text style={text}>
      Great news, {first_name}! {referred_name} just booked their first 
      cleaning with AlphaLuxClean using your referral link.
    </Text>

    <Section style={rewardSection}>
      <Text style={rewardTitle}>💰 Your Reward</Text>
      <Text style={amountText}>{amount}</Text>
      <Text style={rewardSubtext}>
        Credit applied to your account
      </Text>
    </Section>

    <Text style={text}>
      This credit will automatically be applied to your next cleaning service. 
      Keep sharing your referral link to earn even more rewards!
    </Text>

    <Section style={ctaSection}>
      <ActionButton href={`${app_url}/account/referrals`}>
        View My Referrals →
      </ActionButton>
    </Section>

    <Section style={shareSection}>
      <Text style={shareTitle}>🚀 Keep earning!</Text>
      <Text style={shareText}>
        Share your referral link with more friends and family. There's no limit 
        to how much you can earn - $25 for every person who books!
      </Text>
    </Section>

    <Text style={footerText}>
      Thanks for spreading the word about AlphaLuxClean! ✨
    </Text>
  </EmailBase>
);

const h1 = {
  color: "#1B314B",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#1B314B",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const rewardSection = {
  backgroundColor: "#e8f5e8",
  padding: "32px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "2px solid #4caf50",
  margin: "24px 0",
};

const rewardTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1B314B",
  margin: "0 0 16px 0",
};

const amountText = {
  fontSize: "36px",
  fontWeight: "bold",
  color: "#4caf50",
  margin: "0 0 8px 0",
};

const rewardSubtext = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const shareSection = {
  backgroundColor: "#EFF7FE",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const shareTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1B314B",
  margin: "0 0 12px 0",
};

const shareText = {
  fontSize: "14px",
  color: "#1B314B",
  margin: "0",
  lineHeight: "1.5",
};

const footerText = {
  fontSize: "16px",
  color: "#1B314B",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};