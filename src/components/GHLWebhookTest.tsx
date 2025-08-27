import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const GHLWebhookTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [testResults, setTestResults] = useState<Array<{
    timestamp: string;
    success: boolean;
    message: string;
  }>>([]);

  const sendTestWebhook = async () => {
    setIsLoading(true);
    
    try {
      const testData = {
        event_type: 'payment_successful',
        timestamp: new Date().toISOString(),
        source: 'bay_area_cleaning_pros',
        
        // Test Customer Information
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          address: {
            street: '123 Test Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102'
          }
        },
        
        // Test Service Details
        service: {
          type: 'residential_cleaning',
          cleaningType: 'deep_clean',
          homeSize: '3_bedroom',
          frequency: 'weekly',
          addOns: ['inside_oven', 'inside_fridge'],
          serviceDate: '2025-08-30',
          serviceTime: '10:00 AM',
          specialInstructions: 'Test booking - please use back door'
        },
        
        // Test Payment Information
        payment: {
          amount: 299.99,
          paymentType: 'pay_after_service',
          paymentAmount: 0,
          currency: 'USD',
          paymentIntentId: 'test_pi_' + Date.now(),
          status: 'successful'
        },
        
        // Test Pricing Breakdown
        pricing: {
          basePrice: 199.99,
          addOnsTotal: 50.00,
          discounts: {
            global: 40.00,
            frequency: 30.00,
            membership: 20.00,
            promo: 0
          },
          totalSavings: 90.00,
          finalTotal: 299.99
        },
        
        // Test Property Details
        property: {
          squareFootage: '2000-2500',
          bedrooms: '3',
          bathrooms: '2',
          dwellingType: 'single_family',
          flooringType: 'mixed'
        },
        
        // Test Booking Information
        booking: {
          id: 'test_booking_' + Date.now(),
          isRecurring: true,
          membershipAdded: true,
          promoCodeUsed: null,
          userAuthenticated: false
        },
        
        // Test Metadata
        metadata: {
          platform: 'web',
          processedAt: new Date().toISOString(),
          leadSource: 'website_booking',
          orderValue: 299.99,
          customerType: 'recurring',
          testMode: true
        }
      };

      console.log('Sending test data to GHL webhook:', testData);

      const { data, error } = await supabase.functions.invoke('send-ghl-payment-webhook', {
        body: testData
      });

      if (error) {
        throw error;
      }

      setLastResponse(data);
      
      const result = {
        timestamp: new Date().toLocaleString(),
        success: true,
        message: 'Webhook sent successfully'
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 4)]);
      
      toast.success('GHL webhook test sent successfully!');
      
    } catch (error) {
      console.error('Webhook test failed:', error);
      
      const result = {
        timestamp: new Date().toLocaleString(),
        success: false,
        message: error.message || 'Unknown error'
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 4)]);
      setLastResponse({ error: error.message });
      
      toast.error('Webhook test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            GHL Payment Webhook Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Test your GoHighLevel inbound webhook with sample payment data
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              Webhook URL: https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/94998e4d-5fcc-45ea-a91f-2585e8f88600
            </p>
          </div>
          
          <Button 
            onClick={sendTestWebhook} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending Test...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Webhook
              </>
            )}
          </Button>
          
          {lastResponse && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">Last Response:</h4>
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{result.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};