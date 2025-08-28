import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mail, Send, Settings, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function EmailSettings() {
  const [smtpSettings, setSmtpSettings] = useState({
    host: "smtp.gmail.com",
    port: "587"
  });
  
  const [testEmail, setTestEmail] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [notifications, setNotifications] = useState({
    booking: true,
    cancellation: true,
    reminder: false,
    payment: true
  });

  const handleSaveSettings = () => {
    toast.success("SMTP settings saved successfully!");
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsTestingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-email-confirmation', {
        body: { testEmail }
      });

      if (error) {
        console.error('Email test error:', error);
        toast.error(`Email test failed: ${error.message || 'Unknown error'}`);
      } else if (data?.success) {
        toast.success("Test email sent successfully! Check your inbox.");
      } else {
        toast.error(`Email test failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Email test error:', error);
      toast.error("Failed to send test email. Please check your configuration.");
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <AdminLayout 
      title="Email Settings" 
      description="Configure email templates, notifications, and delivery settings"
    >
      <div className="space-y-6">
        <AdminGrid columns={2} gap="lg">
          <AdminCard
            title="Email Configuration"
            description="SMTP settings and delivery configuration"
            icon={<Settings className="h-5 w-5" />}
          >
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <Button className="w-full">Save Configuration</Button>
            </div>
          </AdminCard>

          <AdminCard
            title="Notification Settings"
            description="Control automated email notifications"
            icon={<Bell className="h-5 w-5" />}
          >
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="booking-emails">Booking Confirmations</Label>
                <Switch id="booking-emails" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-emails">Service Reminders</Label>
                <Switch id="reminder-emails" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="completion-emails">Completion Notifications</Label>
                <Switch id="completion-emails" defaultChecked />
              </div>
            </div>
          </AdminCard>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Customize the content and design of automated emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-template">Welcome Email Template</Label>
              <Textarea 
                id="welcome-template" 
                placeholder="Welcome to Bay Area Cleaning Pros..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation-template">Booking Confirmation Template</Label>
              <Textarea 
                id="confirmation-template" 
                placeholder="Your cleaning service has been confirmed..."
                rows={4}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input 
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestEmail} disabled={isTestingEmail}>
                  {isTestingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isTestingEmail ? 'Sending...' : 'Test Email'}
                </Button>
                <Button variant="outline">Save Templates</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}