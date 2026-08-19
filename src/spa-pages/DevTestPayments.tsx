import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  ArrowLeft,
  Play,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface PaymentTest {
  id: string;
  name: string;
  description: string;
  testCardNumber: string;
  expectedResult: 'success' | 'failure';
  amount: number;
  paymentType: 'full' | 'deposit';
}

export function DevTestPayments() {
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [customAmount, setCustomAmount] = useState('100.00');
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    timestamp: string;
    testName: string;
    success: boolean;
    message: string;
    paymentIntentId?: string;
  }>>([]);

  const paymentTests: PaymentTest[] = [
    {
      id: 'success-visa',
      name: 'Successful Visa Payment',
      description: 'Test successful payment with Visa card',
      testCardNumber: '4242424242424242',
      expectedResult: 'success',
      amount: 150.00,
      paymentType: 'full'
    },
    {
      id: 'success-deposit',
      name: 'Successful 20% Deposit',
      description: 'Test successful 20% deposit payment',
      testCardNumber: '4242424242424242',
      expectedResult: 'success',
      amount: 200.00,
      paymentType: 'deposit'
    },
    {
      id: 'declined-card',
      name: 'Declined Card',
      description: 'Test payment with declined card',
      testCardNumber: '4000000000000002',
      expectedResult: 'failure',
      amount: 100.00,
      paymentType: 'full'
    },
    {
      id: 'insufficient-funds',
      name: 'Insufficient Funds',
      description: 'Test payment with insufficient funds',
      testCardNumber: '4000000000009995',
      expectedResult: 'failure',
      amount: 75.00,
      paymentType: 'full'
    },
    {
      id: 'authentication-required',
      name: '3D Secure Authentication',
      description: 'Test payment requiring 3D Secure authentication',
      testCardNumber: '4000002500003155',
      expectedResult: 'success',
      amount: 120.00,
      paymentType: 'full'
    },
    {
      id: 'processing-error',
      name: 'Processing Error',
      description: 'Test payment with processing error',
      testCardNumber: '4000000000000119',
      expectedResult: 'failure',
      amount: 90.00,
      paymentType: 'full'
    }
  ];

  const runPaymentTest = async (testId?: string) => {
    const test = testId ? paymentTests.find(t => t.id === testId) : null;
    if (!test && !testId) {
      toast.error('Please select a test to run');
      return;
    }

    setIsRunning(true);
    try {
      const testData = test || {
        name: 'Custom Payment Test',
        testCardNumber: '4242424242424242',
        amount: parseFloat(customAmount),
        paymentType,
        expectedResult: 'success' as const
      };

      // Create test booking data
      const bookingData = {
        serviceType: 'regular',
        frequency: 'one_time',
        homeSize: '1500-2000',
        zipCode: '75001',
        state: 'TX',
        totalPrice: testData.amount,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        contactNumber: '(555) 123-4567',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '75001'
        }
      };

      // Call create-payment edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          fullAmount: testData.amount,
          booking_data: bookingData,
          payment_type: testData.paymentType === 'deposit' ? 'deposit_20' : 'full_payment',
          customerEmail: bookingData.customerEmail,
          customerName: bookingData.customerName,
          testCard: testData.testCardNumber
        }
      });

      const result = {
        timestamp: new Date().toISOString(),
        testName: testData.name,
        success: !error && data?.success,
        message: error ? error.message : (data?.message || 'Payment processed'),
        paymentIntentId: data?.paymentIntentId
      };

      setTestResults(prev => [result, ...prev]);

      if (result.success) {
        toast.success(`Payment test passed: ${testData.name}`);
      } else {
        toast.error(`Payment test failed: ${testData.name}`);
      }

    } catch (error) {
      console.error('Payment test error:', error);
      const result = {
        timestamp: new Date().toISOString(),
        testName: test?.name || 'Custom Test',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [result, ...prev]);
      toast.error('Payment test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    for (const test of paymentTests) {
      await runPaymentTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Payment Testing - Dev Dashboard</title>
        <meta name="description" content="Test payment flows with various scenarios" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dev-test')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Payment Testing</h1>
            </div>
            <p className="text-muted-foreground">
              Test payment flows with various card scenarios and amounts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pre-defined Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Pre-defined Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {paymentTests.map((test) => (
                    <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{test.name}</h4>
                          <Badge variant={test.expectedResult === 'success' ? 'default' : 'destructive'}>
                            {test.expectedResult}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">${test.amount.toFixed(2)}</span>
                          <Button
                            size="sm"
                            onClick={() => runPaymentTest(test.id)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button onClick={runAllTests} disabled={isRunning} className="w-full">
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Custom Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Custom Payment Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="100.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentType} onValueChange={(value: 'full' | 'deposit') => setPaymentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Pay in Full</SelectItem>
                        <SelectItem value="deposit">20% Deposit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={() => runPaymentTest()}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Custom Test
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No test results yet</p>
                    <p className="text-sm">Run a payment test to see results</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {getResultIcon(result.success)}
                          <span className="font-medium text-sm">{result.testName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{result.message}</p>
                        {result.paymentIntentId && (
                          <p className="text-xs font-mono bg-muted p-1 rounded">
                            {result.paymentIntentId}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe Test Cards Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Stripe Test Cards</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div>
                  <strong>Success:</strong> 4242424242424242
                </div>
                <div>
                  <strong>Declined:</strong> 4000000000000002
                </div>
                <div>
                  <strong>Insufficient:</strong> 4000000000009995
                </div>
                <div>
                  <strong>3D Secure:</strong> 4000002500003155
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}