import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

const EMAIL_TEMPLATES = [
  {
    key: 'test_email',
    name: 'Basic Test Email',
    description: 'Simple test email to verify configuration',
    function: 'test-email'
  },
  {
    key: 'booking_confirmation',
    name: 'Booking Confirmation',
    description: 'Email sent when a booking is confirmed',
    function: 'send-order-confirmation'
  },
  {
    key: 'referral_reward',
    name: 'Referral Reward',
    description: 'Email for referral program notifications',
    function: 'send-referral-email'
  },
  {
    key: 'booking_started',
    name: 'Booking Started',
    description: 'Email when customer starts booking process',
    function: 'emails-queue',
    template: 'booking_started',
    payload: {
      first_name: "Test Customer",
      booking_id: "test-123",
      app_url: "https://app.alphaluxclean.com",
      service_type: "Standard Cleaning",
      price_final: "$150.00"
    }
  },
  {
    key: 'lead_welcome',
    name: 'Lead Welcome',
    description: 'Welcome email for new leads',
    function: 'emails-queue',
    template: 'lead_welcome',
    payload: {
      first_name: "Test Customer",
      email: "test@example.com",
      app_url: "https://app.alphaluxclean.com"
    }
  },
  {
    key: 'payment_failed',
    name: 'Payment Failed',
    description: 'Notification when payment fails',
    function: 'emails-queue',
    template: 'payment_failed',
    payload: {
      first_name: "Test Customer",
      service_date: "January 15, 2024",
      app_url: "https://app.alphaluxclean.com"
    }
  },
  {
    key: 'recurring_upsell',
    name: 'Recurring Service Upsell',
    description: 'Marketing email for recurring services',
    function: 'emails-queue',
    template: 'recurring_upsell',
    payload: {
      first_name: "Test Customer",
      booking_id: "test-123",
      app_url: "https://app.alphaluxclean.com"
    }
  },
  {
    key: 'reminder_2h',
    name: '2-Hour Service Reminder',
    description: 'Reminder sent 2 hours before service',
    function: 'emails-queue',
    template: 'reminder_2h',
    payload: {
      first_name: "Test Customer",
      service_type: "Standard Cleaning",
      time_window: "10:00 AM - 12:00 PM",
      support_phone: "(555) 123-4567",
      address_line1: "123 Test St, San Francisco, CA"
    }
  }
];

export const EmailSystemTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select an email template to test",
        variant: "destructive"
      });
      return;
    }

    const template = EMAIL_TEMPLATES.find(t => t.key === selectedTemplate);
    if (!template) return;

    setLoading(true);
    try {
      let functionCall;
      
      if (template.function === 'emails-queue') {
        // Use the emails-queue function for template-based emails
        functionCall = supabase.functions.invoke('emails-queue', {
          body: {
            to: testEmail,
            name: "Test Customer",
            template: template.template,
            payload: template.payload,
            category: template.key.includes('upsell') ? 'marketing' : 'transactional'
          }
        });
      } else {
        // Use direct function calls for simple emails
        functionCall = supabase.functions.invoke(template.function, {
          body: { testEmail }
        });
      }

      const { data, error } = await functionCall;

      if (error) throw error;

      if (data.success || data.ok) {
        toast({
          title: "Email Sent!",
          description: `${template.name} queued successfully to ${testEmail}`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "Email Test Failed",
        description: error.message || 'Failed to send test email',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateData = EMAIL_TEMPLATES.find(t => t.key === selectedTemplate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email System Testing</CardTitle>
        <CardDescription>
          Test all configured email templates and delivery systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Test Email Address</label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select an email template to test" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplateData && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Template Details:</p>
              <p className="text-sm text-muted-foreground">{selectedTemplateData.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Function: {selectedTemplateData.function}
                {selectedTemplateData.template && ` → ${selectedTemplateData.template}`}
              </p>
            </div>
          )}
          
          <Button 
            onClick={sendTestEmail}
            disabled={loading || !selectedTemplate || !testEmail}
            className="w-full"
          >
            {loading ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};