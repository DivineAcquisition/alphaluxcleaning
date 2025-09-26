import React from 'react';
import { EmailTestButton } from '@/components/EmailTestButton';
import { EmailSystemTest } from '@/components/EmailSystemTest';

export const EmailTools = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              📧 Email Testing Tools
            </h1>
            <p className="text-muted-foreground text-lg">
              Test and debug email functionality for the Bay Area Cleaning Pros system.
            </p>
          </div>

          <div className="grid gap-6">
            {/* New Email System Test */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">📧 Email System Test</h2>
              <EmailSystemTest />
            </div>

            {/* Legacy Email Test Section */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">🧪 Legacy Test Email</h2>
              <EmailTestButton />
            </div>

            {/* Debug Information */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Email Sender Details</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Test emails sent from: <code className="bg-muted px-2 py-1 rounded">onboarding@resend.dev</code></li>
                    <li>• Production emails sent from: <code className="bg-muted px-2 py-1 rounded">noreply@notify.bayareacleaningpros.com</code></li>
                    <li>• Admin emails sent from: <code className="bg-muted px-2 py-1 rounded">admin@bayareacleaningpros.com</code></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Supabase Function Logs</h3>
                  <a 
                    href="https://supabase.com/dashboard/project/yltvknkqnzdeiqckqjha/functions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Edge Function Logs →
                  </a>
                </div>
              </div>
            </div>

            {/* Setup Checklist */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Resend Setup Checklist</h2>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-sm">Resend API key configured in Supabase secrets</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-sm">Domain verified in Resend dashboard</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-sm">Auth email hook configured in Supabase</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-sm">Email templates rendering correctly</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTools;