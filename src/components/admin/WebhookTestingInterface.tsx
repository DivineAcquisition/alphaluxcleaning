import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebhookTestResult {
  success: boolean;
  message: string; 
  results?: Array<{
    config_id: string;
    webhook_url: string;
    success: boolean;
    status: number | null;
    error?: string;
  }>;
}

export function WebhookTestingInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');

  const samplePayload = {
    bookingStep: 'confirmation',
    serviceType: 'deep_clean',
    frequency: 'one_time',
    addOns: ['inside_oven', 'inside_fridge', 'inside_microwave'],
    serviceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
    serviceTime: '10:00 AM - 12:00 PM',
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '(857) 754-4557',
      address: '123 Test Street',
      city: 'New York',
      state: 'CA',
      zipCode: '94102'
    },
    basePrice: 349,
    totalPrice: 399,
    paymentAmount: 399,
    paymentType: 'full' as const,
    orderId: `test-order-${Date.now()}`,
    bookingId: `test-booking-${Date.now()}`
  };

  const testConfiguredWebhooks = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Testing configured webhooks with payload:', samplePayload);
      
      const { data, error } = await supabase.functions.invoke('enhanced-booking-webhook', {
        body: samplePayload
      });

      if (error) {
        console.error('Webhook test error:', error);
        throw error;
      }

      console.log('Webhook test response:', data);
      setTestResult(data);
      
      if (data.success) {
        toast.success(`Webhook test completed: ${data.message}`);
      } else {
        toast.error(`Webhook test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing webhooks:', error);
      setTestResult({
        success: false,
        message: error.message || 'Failed to test webhooks'
      });
      toast.error('Failed to test webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomWebhook = async () => {
    if (!customWebhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (!customWebhookUrl.startsWith('http://') && !customWebhookUrl.startsWith('https://')) {
      toast.error('Please enter a valid webhook URL starting with http:// or https://');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const testPayload = {
        ...samplePayload,
        webhookUrl: customWebhookUrl.trim()
      };

      console.log('Testing custom webhook:', customWebhookUrl);
      
      const { data, error } = await supabase.functions.invoke('send-booking-webhook', {
        body: testPayload
      });

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.success 
          ? `Webhook sent successfully to ${customWebhookUrl}` 
          : `Webhook failed: ${data.error}`
      });

      if (data.success) {
        toast.success('Custom webhook test successful!');
      } else {
        toast.error(`Custom webhook test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing custom webhook:', error);
      setTestResult({
        success: false,
        message: error.message || 'Failed to test custom webhook'
      });
      toast.error('Failed to test custom webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
      toast.success('Sample payload copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy payload');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Webhook Testing Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test Configured Webhooks */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Configured Webhooks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will send a test booking payload to all active webhook configurations.
              </p>
              <Button 
                onClick={testConfiguredWebhooks} 
                disabled={isLoading}
                className="w-full"
              >
                <TestTube2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Testing...' : 'Test All Configured Webhooks'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Test Custom Webhook */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Custom Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Test a specific webhook URL without adding it to your configuration.
              </p>
              <div className="space-y-2">
                <Label htmlFor="custom-webhook">Custom Webhook URL</Label>
                <Input
                  id="custom-webhook"
                  type="url"
                  placeholder="https://your-app.com/webhook/test"
                  value={customWebhookUrl}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get a test URL from{' '}
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
              <Button 
                onClick={testCustomWebhook} 
                disabled={isLoading || !customWebhookUrl.trim()}
                variant="outline"
                className="w-full mt-2"
              >
                <TestTube2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Testing...' : 'Test Custom Webhook'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Sample Payload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sample Payload</h3>
              <div className="flex gap-2">
                <Button onClick={copyPayload} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  onClick={() => setShowPayload(!showPayload)} 
                  variant="outline" 
                  size="sm"
                >
                  {showPayload ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {showPayload && (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(samplePayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={testResult.success ? 'default' : 'destructive'}>
                        {testResult.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testResult.message}
                    </p>
                    
                    {testResult.results && testResult.results.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Individual Results:</p>
                        {testResult.results.map((result, index) => (
                          <div key={index} className="text-xs bg-muted p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs">
                                {result.webhook_url}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={result.success ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {result.status || 'No Response'}
                                </Badge>
                              </div>
                            </div>
                            {result.error && (
                              <p className="text-destructive text-xs mt-1">
                                {result.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}