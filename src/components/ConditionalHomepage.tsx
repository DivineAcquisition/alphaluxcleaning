import React from 'react';
import { detectDomain } from '@/utils/domainDetection';
import Index from '@/pages/Index';
import GuestBooking from '@/pages/GuestBooking';

export function ConditionalHomepage() {
  const domainInfo = detectDomain();
  
  if (domainInfo.subdomain === 'book') {
    return <GuestBooking />;
  }
  
  return <Index />;
}