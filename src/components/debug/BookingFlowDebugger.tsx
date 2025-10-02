import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BookingFlowDebugger() {
  const [testData, setTestData] = useState({
    customerEmail: 'test@example.com',
    customerName: 'Test Customer',
    fullAmount: 200,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCreatePayment = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🚀 Testing create-payment function with data:', testData);
      
      const response = await supabase.functions.invoke('create-payment', {
        body: {
          payment_type: 'deposit_20',
          fullAmount: testData.fullAmount,
          booking_data: {
            serviceType: 'regular',
            homeSize: '1500',
            frequency: 'biweekly',
            addOns: [],
            serviceDate: '2025-01-01',
            serviceTime: '10:00 AM - 12:00 PM',
            totalPrice: testData.fullAmount,
            customerName: testData.customerName,
            customerEmail: testData.customerEmail,
          },
          customerEmail: testData.customerEmail,
          customerName: testData.customerName,
        }
      });

      console.log('📡 Response from create-payment:', response);
      
      setResult({
        success: !response.error,
        data: response.data,
        error: response.error,
        timestamp: new Date().toISOString()
      });

      if (response.error) {
        toast.error(`Test failed: ${response.error.message}`);
      } else if (response.data?.clientSecret) {
        toast.success('Payment intent created successfully!');
      } else {
        toast.error('No client secret received');
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
      toast.error(`Test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Booking Flow Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Customer Email</Label>
            <Input 
              value={testData.customerEmail}
              onChange={(e) => setTestData(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <Label>Customer Name</Label>
            <Input 
              value={testData.customerName}
              onChange={(e) => setTestData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Test Customer"
            />
          </div>
          
          <div>
            <Label>Full Amount ($)</Label>
            <Input 
              type="number"
              value={testData.fullAmount}
              onChange={(e) => setTestData(prev => ({ ...prev, fullAmount: parseFloat(e.target.value) || 0 }))}
              placeholder="200"
            />
          </div>
        </div>

        <Button 
          onClick={testCreatePayment}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test create-payment Function'}
        </Button>

        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Test Result:</h4>
            <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              <strong>Timestamp:</strong> {result.timestamp}
            </div>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}