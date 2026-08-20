import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createWebhookPayload, emitWebhook, type BookingData } from '@/lib/webhook-utils';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

export const BulkZapierSender = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const loadRecentBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        full_name,
        zip_code,
        service_type,
        frequency,
        est_price,
        service_date,
        address_line1,
        sqft_or_bedrooms,
        status,
        source_channel,
        created_at,
        customers ( email, phone, name )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  };

  const transformBookingToComprehensiveData = (booking: any): BookingData => {
    const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
    const name = String(booking.full_name || customer?.name || '').trim();
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    const sqftMatch = String(booking.sqft_or_bedrooms || '').match(/(\d+)/);
    const squareFootage = sqftMatch ? parseInt(sqftMatch[1], 10) : 1500;
    const totalAmount = Number(booking.est_price || 0) / 100;

    return {
      customerInfo: {
        firstName,
        lastName,
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: {
          line1: booking.address_line1 || '',
          city: '',
          state: '',
          postalCode: booking.zip_code || '',
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
        subtotal: totalAmount * 0.91,
        taxAmount: totalAmount * 0.09,
        totalAmount,
      },
      paymentInfo: {
        paymentIntentId: `pi_${String(booking.id).replace(/-/g, '').slice(0, 24)}`,
        sessionId: `cs_${String(booking.id).replace(/-/g, '').slice(0, 24)}`,
      }
    };
  };

  const sendAllBookings = async () => {
    setLoading(true);
    setResults([]);

    const sendResults = [];
    let recentBookings: any[] = [];
    try {
      recentBookings = await loadRecentBookings();
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Could not load bookings',
        description: error.message || 'Failed to query live bookings',
        variant: 'destructive',
      });
      return;
    }

    if (recentBookings.length === 0) {
      setLoading(false);
      toast({
        title: 'No bookings',
        description: 'There are no recent bookings to send.',
      });
      return;
    }

    for (const booking of recentBookings) {
      try {
        const comprehensiveData = transformBookingToComprehensiveData(booking);
        const payload = createWebhookPayload(comprehensiveData, booking.id);
        const result = await emitWebhook(payload);

        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }

        sendResults.push({
          booking_id: booking.id,
          customer_name: booking.full_name || 'Customer',
          status: 'success',
          response: { success: true, payload_type: 'comprehensive' }
        });
      } catch (error: any) {
        sendResults.push({
          booking_id: booking.id,
          customer_name: booking.full_name || 'Customer',
          status: 'error',
          error: error.message
        });
      }

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
          Load the latest bookings from the database and send them to the live Zapier URL.
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
              Send Recent Bookings to Zapier
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
          Sends to the live Zapier URL in edge-function secrets (<code>ZAPIER_WEBHOOK_URL</code>).
        </div>
      </CardContent>
    </Card>
  );
};
