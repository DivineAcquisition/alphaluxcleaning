import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Mail, 
  Send, 
  Settings, 
  Eye, 
  Webhook, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailSettings {
  id?: string;
  company_id: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  brand: {
    logo_url?: string;
    color_hex: string;
  };
}

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  react_component_key: string;
}

interface EmailEvent {
  id: string;
  template_key: string;
  to_email: string;
  status: string;
  created_at: string;
  message_id?: string;
}

const templateConfig = {
  'booking_confirmation': { name: 'Booking Confirmation', category: 'Customer' },
  'booking_reminder_24h': { name: 'Booking Reminder (24h)', category: 'Customer' },
  'booking_reminder_1h': { name: 'Booking Reminder (1h)', category: 'Customer' },
  'receipt': { name: 'Receipt / Payment Confirmation', category: 'Customer' },
  'portal_magic_link': { name: 'Customer Portal Magic Link', category: 'Customer' },
  'otp': { name: 'OTP (6-digit)', category: 'Customer' },
  'sub_offer': { name: 'New Job Offer', category: 'Subcontractor' },
  'sub_reminder': { name: 'Job Reminder', category: 'Subcontractor' },
  'timeoff_update': { name: 'Time-Off Request Update', category: 'Subcontractor' },
  'stripe_capture_needed': { name: 'Payment Capture Required', category: 'Admin' },
  'stripe_connect_issue': { name: 'Stripe Connect Issue', category: 'Admin' },
  'low_availability_alert': { name: 'Low Availability Alert', category: 'Admin' }
};

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    from_name: 'AlphaLux Cleaning',
    from_email: 'notifications@alphaluxclean.com',
    reply_to: '',
    brand: {
      logo_url: '',
      color_hex: '#A58FFF'
    }
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadEmailSettings();
    loadTemplates();
    loadEvents();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('company_id', '550e8400-e29b-41d4-a716-446655440000')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email settings:', error);
        return;
      }

      if (data) {
        setSettings({
          ...data,
          brand: (typeof data.brand === 'object' && data.brand !== null) 
            ? data.brand as { logo_url?: string; color_hex: string }
            : { logo_url: '', color_hex: '#A58FFF' }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('template_key');

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .eq('company_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_settings')
        .upsert({
          company_id: settings.company_id,
          from_name: settings.from_name,
          from_email: settings.from_email,
          reply_to: settings.reply_to || null,
          brand: settings.brand
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error("Failed to save email settings");
        return;
      }

      toast.success("Email settings saved successfully!");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !selectedTemplate) {
      toast.error("Please enter an email address and select a template");
      return;
    }

    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          companyId: '550e8400-e29b-41d4-a716-446655440000',
          to: testEmail,
          templateKey: selectedTemplate,
          variables: {
            customer_name: 'Test Customer',
            service_date: '2024-01-15',
            code: '123456'
          }
        }
      });

      if (error) {
        console.error('Test email error:', error);
        toast.error("Failed to send test email");
        return;
      }

      toast.success("Test email sent successfully!");
      loadEvents(); // Refresh events
    } catch (error) {
      console.error('Test email error:', error);
      toast.error("Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'sent': { label: 'Sent', variant: 'secondary' as const },
      'delivered': { label: 'Delivered', variant: 'default' as const },
      'opened': { label: 'Opened', variant: 'default' as const },
      'clicked': { label: 'Clicked', variant: 'default' as const },
      'bounced': { label: 'Bounced', variant: 'destructive' as const },
      'failed': { label: 'Failed', variant: 'destructive' as const },
      'queued': { label: 'Queued', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: 'outline' as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/email/webhook/resend`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!");
  };

  if (loading) {
    return (
      <AdminLayout title="Email Settings" description="Configure email templates and delivery">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Email Settings" 
      description="Configure email templates, notifications, and delivery settings"
    >
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Sender Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sender Identity
              </CardTitle>
              <CardDescription>
                Configure your email sender details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={settings.from_name}
                    onChange={(e) => setSettings({...settings, from_name: e.target.value})}
                    placeholder="AlphaLux Cleaning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings({...settings, from_email: e.target.value})}
                    placeholder="notifications@alphaluxclean.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To Email (Optional)</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={settings.reply_to || ''}
                  onChange={(e) => setSettings({...settings, reply_to: e.target.value})}
                  placeholder="support@alphaluxcleaning.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Color</Label>
                <Input
                  id="brand-color"
                  type="color"
                  value={settings.brand.color_hex}
                  onChange={(e) => setSettings({
                    ...settings, 
                    brand: {...settings.brand, color_hex: e.target.value}
                  })}
                />
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Manage and preview email templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(templateConfig).map(([key, config]) => {
                    const template = templates.find(t => t.template_key === key);
                    return (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Category: {config.category}
                          </div>
                          {template && (
                            <div className="text-sm text-muted-foreground">
                              Subject: {template.subject}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Preview: {config.name}</DialogTitle>
                                <DialogDescription>
                                  Email template preview with sample data
                                </DialogDescription>
                              </DialogHeader>
                              <div className="border rounded p-4 bg-gray-50">
                                <div className="text-center mb-4">
                                  <div className="text-lg font-semibold text-purple-600">
                                    {settings.from_name}
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Subject:</strong> {template?.subject || 'Loading...'}</div>
                                  <div className="border-t pt-2 mt-2">
                                    <p>This is a preview of the {config.name.toLowerCase()} email template.</p>
                                    <p className="text-muted-foreground mt-2">
                                      Template variables will be replaced with actual data when sent.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Test Send
                </CardTitle>
                <CardDescription>
                  Send a test email to verify your configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Test Email Address</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(templateConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={sendTestEmail} disabled={sendingTest}>
                  {sendingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {sendingTest ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Delivery Logs
              </CardTitle>
              <CardDescription>
                Track email delivery status and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {new Date(event.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {templateConfig[event.template_key as keyof typeof templateConfig]?.name || 
                         event.template_key}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.to_email}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.message_id || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No email events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure email delivery webhooks for real-time status updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/api/email/webhook/resend`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this URL to your Resend webhook configuration to receive delivery events.
                </p>
              </div>

              <div className="border rounded p-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Webhook Status: Active</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Webhooks are configured and ready to receive events.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Events</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Email Sent</div>
                  <div>• Email Delivered</div>
                  <div>• Email Opened</div>
                  <div>• Email Clicked</div>
                  <div>• Email Bounced</div>
                  <div>• Delivery Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}