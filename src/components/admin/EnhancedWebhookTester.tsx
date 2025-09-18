import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { WebhookPayload, createWebhookPayload, emitWebhook } from '@/lib/webhook-utils';

interface TestResult {
  success: boolean;
  message: string;
  idempotency_key?: string;
  response?: any;
  error?: string;
}

export function EnhancedWebhookTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [activeTab, setActiveTab] = useState('configured');

  // Sample booking data for both lead and confirmed booking scenarios
  const sampleLeadData = {
    customerInfo: {
      firstName: "John",
      lastName: "Smith", 
      email: "john.smith@example.com",
      phone: "(555) 123-4567",
      address: {
        line1: "123 Test Street",
        line2: "Apt 2B",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102"
      }
    },
    serviceDetails: {
      serviceType: "Deep",
      frequency: "One-time",
      squareFootage: 1500,
      bedrooms: 2,
      bathrooms: 2,
      addOns: ["inside_oven", "inside_fridge"],
      specialInstructions: "Focus on kitchen deep cleaning"
    }
  };

  const sampleBookingData = {
    ...sampleLeadData,
    schedulingInfo: {
      selectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectedTimeSlot: "10:00 AM - 12:00 PM"
    },
    pricing: {
      subtotal: 349,
      taxAmount: 35,
      totalAmount: 384
    },
    paymentInfo: {
      paymentIntentId: `pi_test_${Date.now()}`,
      sessionId: `cs_test_${Date.now()}`
    }
  };

  const testLeadCreated = async () => {
    await testWebhook('LEAD_CREATED', sampleLeadData);
  };

  const testBookingConfirmed = async () => {
    await testWebhook('BOOKING_CONFIRMED', sampleBookingData);
  };

  const testWebhook = async (type: 'LEAD_CREATED' | 'BOOKING_CONFIRMED', bookingData: any) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const idempotencyKey = `test-${type.toLowerCase()}-${Date.now()}`;
      const bookingId = `booking_${Date.now()}`;
      
      const payload: WebhookPayload = createWebhookPayload(
        type,
        bookingData,
        idempotencyKey,
        bookingId
      );

      console.log(`Testing ${type} webhook with payload:`, payload);
      
      const result = await emitWebhook(payload);
      
      setTestResult({
        success: result.success,
        message: result.success 
          ? `${type} webhook sent successfully!` 
          : `${type} webhook failed: ${result.error}`,
        idempotency_key: idempotencyKey,
        error: result.error
      });

      if (result.success) {
        toast.success(`${type} webhook test successful!`);
      } else {
        toast.error(`${type} webhook test failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error testing ${type} webhook:`, error);
      setTestResult({
        success: false,
        message: `${type} webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`${type} webhook test failed`);
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
      console.log('Testing custom webhook:', customWebhookUrl);
      
      const payload = createWebhookPayload(
        'BOOKING_CONFIRMED',
        sampleBookingData,
        `custom-test-${Date.now()}`,
        `booking_${Date.now()}`
      );

      // Send directly to custom webhook URL
      const response = await fetch(customWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      setTestResult({
        success: true,
        message: `Custom webhook request sent successfully to ${customWebhookUrl}. Check your webhook receiver for the payload.`
      });

      toast.success('Custom webhook test sent!');
    } catch (error) {
      console.error('Error testing custom webhook:', error);
      setTestResult({
        success: false,
        message: `Custom webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error('Custom webhook test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPayload = async (type: 'LEAD_CREATED' | 'BOOKING_CONFIRMED') => {
    try {
      const data = type === 'LEAD_CREATED' ? sampleLeadData : sampleBookingData;
      const payload = createWebhookPayload(type, data, `sample-${Date.now()}`, `booking_${Date.now()}`);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(`${type} payload copied to clipboard!`);
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
            Enhanced Webhook Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configured">Configured Webhooks</TabsTrigger>
              <TabsTrigger value="custom">Custom Webhook</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configured" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Test Webhook Events</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send realistic webhook payloads to your configured Zapier endpoint
                  </p>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={testLeadCreated}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Send className="h-4 w-4" />
                      Test LEAD_CREATED
                    </Button>
                    
                    <Button
                      onClick={testBookingConfirmed}
                      disabled={isLoading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CheckCircle className="h-4 w-4" />
                      Test BOOKING_CONFIRMED
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Test Custom Webhook URL</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test a specific webhook URL without configuring it in your system
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
                    className="w-full mt-2"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Send className="h-4 w-4 mr-2" />
                    Test Custom Webhook
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* Sample Payloads */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sample Payloads</h3>
              <div className="flex gap-2">
                <Button onClick={() => copyPayload('LEAD_CREATED')} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Lead
                </Button>
                <Button onClick={() => copyPayload('BOOKING_CONFIRMED')} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Booking
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
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">LEAD_CREATED Payload:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(createWebhookPayload('LEAD_CREATED', sampleLeadData, 'sample-lead', 'booking_sample'), null, 2)}
                  </pre>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">BOOKING_CONFIRMED Payload:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(createWebhookPayload('BOOKING_CONFIRMED', sampleBookingData, 'sample-booking', 'booking_sample'), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <>
              <Separator className="my-6" />
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
                      {testResult.idempotency_key && (
                        <Badge variant="outline" className="text-xs">
                          {testResult.idempotency_key}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testResult.message}
                    </p>
                    
                    {testResult.error && (
                      <div className="mt-2 text-sm text-destructive">
                        <strong>Error:</strong> {testResult.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground mt-6 p-4 bg-muted/50 rounded-lg">
            <p><strong>Current Webhook URL:</strong> {'{ZAPIER_CATCH_HOOK_URL from environment}'}</p>
            <p className="mt-1">These tests use the same webhook infrastructure as your live booking system, including idempotency checks and retry logic.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}