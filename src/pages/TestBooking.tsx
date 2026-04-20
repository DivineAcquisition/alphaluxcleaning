import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TestBooking = () => {
  const [testSessionId, setTestSessionId] = useState('test_session_123');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createTestBooking = async () => {
    setCreating(true);
    try {
      // First create a test customer
      const customerId = crypto.randomUUID();
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          name: 'Test Customer',
          first_name: 'Test',
          last_name: 'Customer',
          email: 'test@example.com',
          phone: '(857) 754-4557',
          address: '123 Test Street',
          address_line1: '123 Test Street',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102'
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating test customer:', customerError);
        toast({
          title: 'Error',
          description: 'Error creating test customer: ' + customerError.message,
          variant: 'destructive'
        });
        return;
      }

      // Generate a unique session ID
      const uniqueSessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a confirmed booking to trigger HCP sync
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerId,
          service_type: 'standard',
          frequency: 'one-time',
          sqft_or_bedrooms: '1000-1500sqft',
          est_price: 150.00,
          status: 'confirmed', // This will trigger the HCP sync
          service_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          time_slot: '09:00-12:00',
          zip_code: '94102',
          stripe_checkout_session_id: uniqueSessionId,
          special_instructions: 'Test booking created for HCP integration testing',
          source_channel: 'TEST_BOOKING',
          property_details: {
            bedrooms: 2,
            bathrooms: 2,
            pets: false,
            parking: 'street'
          }
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating test booking:', bookingError);
        toast({
          title: 'Error',
          description: 'Error creating test booking: ' + bookingError.message,
          variant: 'destructive'
        });
        return;
      }

      console.log('Test booking created:', booking);
      toast({
        title: 'Success',
        description: `Test booking created with ID: ${booking.id}. Check HCP Logs to see sync status.`
      });

      setTestSessionId(uniqueSessionId);
      // Navigate to HCP logs to see the sync result
      navigate('/admin/integrations/housecall-pro/logs');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Error creating test booking',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const navigateToExisting = () => {
    navigate(`/payment-confirmation?session_id=${testSessionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Test Booking Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionId">Test Session ID</Label>
            <Input
              id="sessionId"
              value={testSessionId}
              onChange={(e) => setTestSessionId(e.target.value)}
              placeholder="Enter test session ID"
            />
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={createTestBooking}
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating Test Booking...' : 'Create Test Booking & Trigger HCP Sync'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/integrations/housecall-pro')}
              className="w-full"
            >
              HCP Settings
            </Button>

            <Button 
              variant="outline"
              onClick={() => navigate('/admin/integrations/housecall-pro/logs')}
              className="w-full"
            >
              View HCP Sync Logs
            </Button>

            <Button 
              variant="secondary"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>HCP Integration Test:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Creates a test customer and confirmed booking</li>
              <li>Triggers the HCP sync via database trigger</li>
              <li>Creates customer and job in Housecall Pro</li>
              <li>View results in HCP Sync Logs</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Ensure HCP API key is configured in settings first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBooking;