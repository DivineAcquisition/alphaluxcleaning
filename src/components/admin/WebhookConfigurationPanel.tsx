import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Webhook, 
  TestTube2, 
  Eye, 
  Save, 
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  active: boolean;
  event_types: string[];
  headers: any;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  webhook_config_id: string | null;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  delivered_at: string | null;
  attempts: number;
  created_at: string;
}

export function WebhookConfigurationPanel() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['booking_created', 'booking_confirmed', 'payment_processed', 'lead_created']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [recentLogs, setRecentLogs] = useState<WebhookLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const availableEvents = [
    { id: 'booking_created', label: 'Booking Created', description: 'When a new booking is created' },
    { id: 'booking_confirmed', label: 'Booking Confirmed', description: 'When a booking is confirmed with payment' },
    { id: 'payment_processed', label: 'Payment Processed', description: 'When payment is processed' },
    { id: 'lead_created', label: 'Lead Created', description: 'When a new lead is generated' }
  ];

  useEffect(() => {
    loadWebhookConfig();
    loadRecentLogs();
  }, []);

  const loadWebhookConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading webhook config:', error);
        toast.error('Failed to load webhook configuration');
        return;
      }

      if (data) {
        setConfig(data);
        setWebhookUrl(data.url);
        setIsActive(data.active);
        setSelectedEvents(data.event_types);
      }
    } catch (error) {
      console.error('Error loading webhook config:', error);
      toast.error('Failed to load webhook configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading webhook logs:', error);
        return;
      }

      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    }
  };

  const saveConfiguration = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      toast.error('Please enter a valid webhook URL starting with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      const configData = {
        name: config?.name || 'Zapier Integration',
        url: webhookUrl.trim(),
        active: isActive,
        event_types: selectedEvents,
        headers: config?.headers || {},
        updated_at: new Date().toISOString()
      };

      if (config) {
        // Update existing configuration
        const { error } = await supabase
          .from('webhook_configurations')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Create new configuration
        const { error } = await supabase
          .from('webhook_configurations')
          .insert(configData);

        if (error) throw error;
      }

      toast.success('Webhook configuration saved successfully');
      loadWebhookConfig();
    } catch (error) {
      console.error('Error saving webhook config:', error);
      toast.error('Failed to save webhook configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL first');
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('webhook-delivery-test', {
        body: { test: true }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Webhook test successful! Check the delivery logs below.');
        // Refresh logs after test
        setTimeout(() => loadRecentLogs(), 2000);
      } else {
        toast.error(`Webhook test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading webhook configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhook/booking"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL where booking webhooks should be sent. Get a test URL from{' '}
                <a 
                  href="https://webhook.site" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  webhook.site
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="webhook-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="webhook-active">Enable webhook notifications</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Webhook Events</Label>
            <div className="space-y-3">
              {availableEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <Switch
                    id={`event-${event.id}`}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`event-${event.id}`} className="text-sm font-medium">
                      {event.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={saveConfiguration} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button onClick={testWebhook} variant="outline" disabled={isTesting || !webhookUrl.trim()}>
              <TestTube2 className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Webhook'}
            </Button>
            <Button 
              onClick={() => setShowLogs(!showLogs)} 
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showLogs ? 'Hide Logs' : 'View Logs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Recent Webhook Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No webhook deliveries yet. Send a test webhook to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {log.delivered_at ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="font-medium">
                          {log.payload?.event_type || 'Webhook Test'}
                        </span>
                        <Badge variant={log.delivered_at ? 'default' : 'destructive'}>
                          {log.response_status || 'No Response'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Attempts: {log.attempts}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Config ID: {log.webhook_config_id || 'Direct Test'}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-1">
                          Error: {log.error_message}
                        </p>
                      )}
                      {log.response_body && log.response_body !== 'Webhook not found.' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Response: {log.response_body.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}