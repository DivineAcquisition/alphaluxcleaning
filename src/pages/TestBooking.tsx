import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const TestBooking = () => {
  const [testSessionId, setTestSessionId] = useState('test_session_123');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const createTestOrder = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: testSessionId,
          amount: 9999, // $99.99 in cents
          status: 'paid',
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '(555) 123-4567',
          currency: 'usd',
          service_details: null, // Will be filled in by form
          scheduled_date: null,
          scheduled_time: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test order:', error);
        alert('Error creating test order: ' + error.message);
        return;
      }

      console.log('Test order created:', data);
      // Navigate to payment confirmation with the test session ID
      navigate(`/payment-confirmation?session_id=${testSessionId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating test order');
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
              onClick={createTestOrder}
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create New Test Order'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={navigateToExisting}
              className="w-full"
            >
              Use Existing Session ID
            </Button>

            <Button 
              variant="secondary"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Test Flow:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create or use existing test order</li>
              <li>Fill in service details form</li>
              <li>Schedule your service</li>
              <li>See confirmation</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBooking;