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
  response?: any;
  error?: string;
}

export function EnhancedWebhookTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [activeTab, setActiveTab] = useState('configured');

  // Sample booking data with complete required fields
  const sampleBookingData = {
    customerInfo: {
      firstName: "Maria",
      lastName: "Lopez", 
      email: "maria.lopez@example.com",
      phone: "+1 832-555-0182",
      address: {
        line1: "1245 Elmwood Drive",
        line2: "",
        city: "Baytown",
        state: "TX",
        postalCode: "77520"
      }
    },
    serviceDetails: {
      serviceType: "Deep Clean",
      frequency: "One-Time",
      squareFootage: 2200,
      bedrooms: 3,
      bathrooms: 2,
      dwellingType: "house",
      flooringType: "hardwood,carpet",
      addOns: ["inside_oven", "inside_fridge"],
      specialInstructions: "Focus on kitchen and baseboards"
    },
    schedulingInfo: {
      selectedDate: "2025-10-06",
      selectedTimeSlot: "9:00 AM - 12:00 PM"
    },
    pricing: {
      subtotal: 335,
      discountAmount: 50,
      discountRate: 15,
      taxAmount: 0,
      totalAmount: 285
    },
    paymentInfo: {
      paymentIntentId: `pi_3NEZr7E22`,
      paymentMethod: "Stripe",
      paymentStatus: "Authorized"
    }
  };

  // Sample recurring booking data with weekly frequency
  const sampleRecurringData = {
    customerInfo: {
      firstName: "Sarah",
      lastName: "Johnson", 
      email: "sarah.johnson@example.com",
      phone: "+1 713-555-9876",
      address: {
        line1: "456 Oak Avenue",
        line2: "Suite 100",
        city: "New York",
        state: "TX",
        postalCode: "77002"
      }
    },
    serviceDetails: {
      serviceType: "Standard Clean",
      frequency: "Bi-Weekly",
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      dwellingType: "apartment",
      flooringType: "tile,laminate",
      addOns: [],
      specialInstructions: "Please use eco-friendly products"
    },
    schedulingInfo: {
      selectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectedTimeSlot: "10:00 AM - 12:00 PM"
    },
    pricing: {
      subtotal: 200,
      discountAmount: 0,
      discountRate: 0,
      taxAmount: 0,
      totalAmount: 200
    },
    paymentInfo: {
      subscriptionId: `sub_test_${Date.now()}`,
      paymentMethod: "Stripe",
      paymentStatus: "Active"
    }
  };

  const testOneTimeBooking = async () => {
    await testWebhook('One-Time Booking', sampleBookingData);
  };

  const testRecurringBooking = async () => {
    await testWebhook('Recurring Booking', sampleRecurringData);
  };

  const testWebhook = async (label: string, bookingData: any) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
      
      const payload: WebhookPayload = createWebhookPayload(
        bookingData,
        bookingId
      );

      console.log(`Testing ${label} webhook with payload:`, payload);
      
      const result = await emitWebhook(payload);
      
      setTestResult({
        success: result.success,
        message: result.success 
          ? `${label} webhook sent successfully to Zapier!` 
          : `${label} webhook failed: ${result.error}`,
        error: result.error
      });

      if (result.success) {
        toast.success(`${label} webhook test successful!`);
      } else {
        toast.error(`${label} webhook test failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error testing ${label} webhook:`, error);
      setTestResult({
        success: false,
        message: `${label} webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`${label} webhook test failed`);
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
      
      const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
      const payload = createWebhookPayload(
        sampleRecurringData,
        bookingId
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

  const copyPayload = async (type: 'ONE_TIME' | 'RECURRING') => {
    try {
      const data = type === 'RECURRING' ? sampleRecurringData : sampleBookingData;
      const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
      const payload = createWebhookPayload(data, bookingId);
      
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(`${type === 'RECURRING' ? 'Recurring' : 'One-Time'} booking payload copied to clipboard!`);
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
                  
                  <div className="grid gap-3">
                    <Button
                      onClick={testOneTimeBooking}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Send className="h-4 w-4" />
                      Test One-Time Booking
                    </Button>
                    
                    <Button
                      onClick={testRecurringBooking}
                      disabled={isLoading}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CheckCircle className="h-4 w-4" />
                      Test Recurring Booking (Bi-Weekly)
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
                <Button onClick={() => copyPayload('ONE_TIME')} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy One-Time
                </Button>
                <Button onClick={() => copyPayload('RECURRING')} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Recurring
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
                  <h4 className="font-medium mb-2">One-Time Booking Payload:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(createWebhookPayload(sampleBookingData, 'BK-12345'), null, 2)}
                  </pre>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Recurring Bi-Weekly Booking Payload:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(createWebhookPayload(sampleRecurringData, 'BK-67890'), null, 2)}
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
            <p><strong>Current Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/24603039/um6me4v/</p>
            <p className="mt-1">These tests send webhooks to Zapier with the complete booking payload structure including customer info, job details, payment data, marketing attribution, and LTV metrics.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}