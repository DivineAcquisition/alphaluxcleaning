import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const BulkZapierSender = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const recentBookings = [
    {
      booking_id: "2aff012e-f1fd-4bdd-93e1-5cd2f982e764",
      customer_name: "Malik Sannie",
      customer_email: "asannie74@gmail.com",
      customer_phone: "4436486798",
      service_type: "regular",
      frequency: "oneTime", 
      total_amount: 91.52,
      service_date: "2025-10-02",
      address: "7404 Executive Place, Lanham, TX 78704",
      zip_code: "77521",
      status: "confirmed",
      source_channel: "UI_DIRECT",
      sqft_or_bedrooms: "under-1000",
      created_at: "2025-09-27T03:57:34.768Z"
    },
    {
      booking_id: "12e9748d-e3b8-453e-a97f-fa5de63a100d",
      customer_name: "Malik Sannie", 
      customer_email: "asannie74@gmail.com",
      customer_phone: "4436486798",
      service_type: "regular",
      frequency: "oneTime",
      total_amount: 114.40,
      service_date: "2025-10-03", 
      address: "7404 Executive Place, Lanham, TX 78704",
      zip_code: "77521",
      status: "confirmed",
      source_channel: "UI_DIRECT",
      sqft_or_bedrooms: "1000-1500", 
      created_at: "2025-09-27T02:37:51.748Z"
    },
    {
      booking_id: "dcae932d-8696-4883-b0ce-591e26821364",
      customer_name: "Malik Sannie",
      customer_email: "asannie74@gmail.com", 
      customer_phone: "4436486798",
      service_type: "deep",
      frequency: "oneTime",
      total_amount: 160.16,
      service_date: "2025-10-02",
      address: "7404 Executive Place, Lanham, TX 78704",
      zip_code: "77521", 
      status: "confirmed",
      source_channel: "UI_DIRECT",
      sqft_or_bedrooms: "1000-1500",
      created_at: "2025-09-26T21:41:53.640Z"
    },
    {
      booking_id: "a1f4bdd3-d9dc-4054-88bf-8fb916321623",
      customer_name: "Malik Sannie",
      customer_email: "asannie74@gmail.com",
      customer_phone: "4436486798",
      service_type: "regular",
      frequency: "oneTime",
      total_amount: 114.40,
      service_date: "2025-10-01",
      address: "7404 Executive Place, Lanham, TX 78704",
      zip_code: "77521",
      status: "confirmed", 
      source_channel: "UI_DIRECT",
      sqft_or_bedrooms: "1000-1500",
      created_at: "2025-09-25T13:06:32.355Z"
    },
    {
      booking_id: "6f13e2eb-c8fd-4947-a594-3d05adbc6b0a",
      customer_name: "Malik",
      customer_email: "contact@divineacquisition.io",
      customer_phone: "4436486798",
      service_type: "standard",
      frequency: "one-time",
      total_amount: 304.00,
      service_date: "2025-09-19",
      address: "1140 Ward St",
      zip_code: "90009",
      status: "pending",
      source_channel: "UI_DIRECT", 
      sqft_or_bedrooms: "2750",
      created_at: "2025-09-15T13:00:42.026Z"
    },
    {
      booking_id: "6324db34-0adc-40eb-93be-b591dedbf6f3",
      customer_name: "Malik Sannie",
      customer_email: "asannie74@gmail.com",
      customer_phone: "4436486798",
      service_type: "standard",
      frequency: "one-time", 
      total_amount: 304.00,
      service_date: "2025-09-17",
      address: "7404 Executive Place, Lanham, TX 78704",
      zip_code: "90009",
      status: "pending",
      source_channel: "UI_DIRECT",
      sqft_or_bedrooms: "2750", 
      created_at: "2025-09-14T23:00:12.404Z"
    }
  ];

  const sendAllBookings = async () => {
    setLoading(true);
    setResults([]);
    
    const sendResults = [];

    for (const booking of recentBookings) {
      try {
        const { data, error } = await supabase.functions.invoke('send-transaction-to-zapier', {
          body: {
            transactionData: booking,
            type: 'booking_confirmed'
          }
        });

        if (error) throw error;

        sendResults.push({
          booking_id: booking.booking_id,
          customer_name: booking.customer_name,
          status: 'success',
          response: data
        });
        
        console.log(`✅ Sent booking ${booking.booking_id} to Zapier:`, data);
        
      } catch (error: any) {
        console.error(`❌ Failed to send booking ${booking.booking_id}:`, error);
        sendResults.push({
          booking_id: booking.booking_id,
          customer_name: booking.customer_name,
          status: 'error',
          error: error.message
        });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(sendResults);
    setLoading(false);

    const successCount = sendResults.filter(r => r.status === 'success').length;
    const errorCount = sendResults.filter(r => r.status === 'error').length;

    toast({
      title: "Bulk Send Complete",
      description: `✅ ${successCount} sent successfully, ❌ ${errorCount} failed`,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>📤 Send Recent Bookings to Zapier</CardTitle>
        <p className="text-muted-foreground">
          Send all {recentBookings.length} recent bookings to your Zapier webhook
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={sendAllBookings} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '⏳ Sending...' : `📤 Send ${recentBookings.length} Bookings to Zapier`}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h3 className="font-semibold">Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-sm ${
                  result.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="font-medium">
                  {result.status === 'success' ? '✅' : '❌'} {result.customer_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {result.booking_id}
                </div>
                {result.error && (
                  <div className="text-xs text-red-600 mt-1">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/24603039/um6me4v/
        </div>
      </CardContent>
    </Card>
  );
};