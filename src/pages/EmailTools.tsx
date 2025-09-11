import React from 'react';
import { EmailTestButton } from '@/components/EmailTestButton';

export const EmailTools = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Email Testing Tools</h1>
          <p className="text-muted-foreground">
            Test email functionality and debug email delivery issues
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Test Email Function</h2>
          <EmailTestButton />
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Test Email Function:</strong> Uses onboarding@resend.dev sender (verified by default)</p>
            <p><strong>Production Emails:</strong> Will use notifications@bayareacleaningpros.com (verify domain in Resend)</p>
            <p><strong>Configuration:</strong> No authentication required for testing</p>
          </div>
          
          <div className="mt-4">
            <a 
              href="https://supabase.com/dashboard/project/kqoezqzogleaaupjzxch/functions/test-email/logs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              View Function Logs
            </a>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Resend Setup Checklist</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="resend-account" />
              <label htmlFor="resend-account">Create Resend account at resend.com</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="api-key" />
              <label htmlFor="api-key">Create API key and add to Supabase secrets</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="domain-verify" />
              <label htmlFor="domain-verify">Verify domain bayareacleaningpros.com in Resend</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test-success" />
              <label htmlFor="test-success">Test email sends successfully</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};