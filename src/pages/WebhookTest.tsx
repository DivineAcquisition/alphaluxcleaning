import React from 'react';
import { Helmet } from 'react-helmet-async';
import { EnhancedWebhookTester } from '@/components/admin/EnhancedWebhookTester';

export function WebhookTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Webhook Testing - AlphaLux Cleaning</title>
        <meta name="description" content="Test webhook integrations for AlphaLux Cleaning booking system" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Webhook Testing Interface
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test LEAD_CREATED and BOOKING_CONFIRMED webhooks with realistic data
          </p>
        </div>
        
        <EnhancedWebhookTester />
      </div>
    </div>
  );
}