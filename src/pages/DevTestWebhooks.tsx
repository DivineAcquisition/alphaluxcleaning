import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Webhook } from 'lucide-react';
import { EnhancedWebhookTester } from '@/components/admin/EnhancedWebhookTester';
import { GHLWebhookTest } from '@/components/GHLWebhookTest';

export function DevTestWebhooks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Webhook Testing - Dev Dashboard</title>
        <meta name="description" content="Test webhook integrations and external API connections" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dev-test')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Webhook className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Webhook Testing</h1>
            </div>
            <p className="text-muted-foreground">
              Test webhook integrations with GoHighLevel, Zapier, and other external services
            </p>
          </div>
        </div>

        {/* Enhanced Webhook Tester */}
        <div className="mb-8">
          <EnhancedWebhookTester />
        </div>

        {/* GHL Webhook Test */}
        <div>
          <GHLWebhookTest />
        </div>
      </div>
    </div>
  );
}