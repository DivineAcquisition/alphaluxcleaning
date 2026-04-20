import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createWebhookPayload, emitWebhook, type BookingData } from '@/lib/webhook-utils';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

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

  // Transform booking record to comprehensive BookingData format
  const transformBookingToComprehensiveData = (booking: any): BookingData => {
    const [firstName, ...lastNameParts] = booking.customer_name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    // Parse address
    const addressParts = booking.address.split(', ');
    const [line1, city, stateZip] = addressParts;
    const [state] = stateZip?.split(' ') || ['NY'];
    
    // Extract square footage from sqft_or_bedrooms field
    const sqftMatch = booking.sqft_or_bedrooms.match(/(\d+)/);
    const squareFootage = sqftMatch ? parseInt(sqftMatch[1]) : 
      booking.sqft_or_bedrooms === 'under-1000' ? 900 :
      booking.sqft_or_bedrooms === '1000-1500' ? 1250 :
      booking.sqft_or_bedrooms === '1500-2000' ? 1750 : 
      parseInt(booking.sqft_or_bedrooms) || 1500;

    return {
      customerInfo: {
        firstName,
        lastName,
        email: booking.customer_email,
        phone: booking.customer_phone,
        address: {
          line1: line1 || booking.address,
          city: city || 'New York',
          state: state || 'NY',
          postalCode: booking.zip_code,
        }
      },
      serviceDetails: {
        serviceType: booking.service_type,
        frequency: booking.frequency,
        squareFootage,
        bedrooms: squareFootage < 1000 ? 2 : squareFootage < 1500 ? 3 : 4,
        bathrooms: squareFootage < 1000 ? 1 : squareFootage < 1500 ? 2 : 3,
        addOns: [],
        specialInstructions: '',
      },
      schedulingInfo: {
        selectedDate: booking.service_date,
        selectedTimeSlot: '10:00 AM - 12:00 PM',
      },
      pricing: {
        subtotal: booking.total_amount * 0.91, // Estimate before tax
        taxAmount: booking.total_amount * 0.09,
        totalAmount: booking.total_amount,
      },
      paymentInfo: {
        paymentIntentId: `pi_${booking.booking_id.replace(/-/g, '').slice(0, 24)}`,
        sessionId: `cs_${booking.booking_id.replace(/-/g, '').slice(0, 24)}`,
      }
    };
  };

  const sendAllBookings = async () => {
    setLoading(true);
    setResults([]);
    
    const sendResults = [];

    for (const booking of recentBookings) {
      try {
        // Transform booking to comprehensive format
        const comprehensiveData = transformBookingToComprehensiveData(booking);
        
        // Create comprehensive webhook payload
        const payload = createWebhookPayload(
          comprehensiveData,
          booking.booking_id
        );
        
        // Send via comprehensive webhook emitter
        const result = await emitWebhook(payload);
        
        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }

        sendResults.push({
          booking_id: booking.booking_id,
          customer_name: booking.customer_name,
          status: 'success',
          response: { success: true, payload_type: 'comprehensive' }
        });
        
        console.log('Sent comprehensive booking', booking.booking_id, 'to Zapier');
        
      } catch (error: any) {
        console.error('Failed to send booking', booking.booking_id, ':', error);
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
      title: "Comprehensive Bulk Send Complete",
      description: `${successCount} comprehensive bookings sent, ${errorCount} failed`,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Recent Bookings to Zapier
        </CardTitle>
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
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {recentBookings.length} Bookings to Zapier
            </>
          )}
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
                  {result.status === 'success' ? (
                    <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                  ) : (
                    <XCircle className="inline h-4 w-4 mr-1 text-red-600" />
                  )}
                  {result.customer_name}
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