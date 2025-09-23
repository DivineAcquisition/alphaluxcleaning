import React from 'react';
import { ReferralHub } from '@/components/ReferralHub';

export const Referrals: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Earn $25 for every friend you refer to AlphaLuxClean
          </p>
        </div>
        
        <ReferralHub />
      </div>
    </div>
  );
};