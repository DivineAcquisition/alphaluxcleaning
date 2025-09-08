import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { checkStripeReady } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { CustomStripePayment } from '@/components/payment/CustomStripePayment';

const StripeTestPage = () => {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [configTest, setConfigTest] = useState<any>(null);
  const [paymentIntentTest, setPaymentIntentTest] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    runStripeTests();
  }, []);

  const runStripeTests = async () => {
    console.log('🔍 Starting Stripe integration tests...');

    // Test 1: Check if Stripe is ready
    try {
      const ready = await checkStripeReady();
      setStripeReady(ready);
      setTestResults(prev => ({ ...prev, stripeReady: ready }));
      console.log('✅ Stripe ready test:', ready);
    } catch (error) {
      console.error('❌ Stripe ready test failed:', error);
      setStripeReady(false);
      setTestResults(prev => ({ ...prev, stripeReady: false, stripeError: error }));
    }

    // Test 2: Test get-stripe-config function
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-config');
      if (error) throw error;
      
      setConfigTest({ success: true, data });
      setTestResults(prev => ({ ...prev, configTest: { success: true, data } }));
      console.log('✅ Stripe config test:', data);
    } catch (error) {
      console.error('❌ Stripe config test failed:', error);
      setConfigTest({ success: false, error });
      setTestResults(prev => ({ ...prev, configTest: { success: false, error } }));
    }

    // Test 3: Test create-payment-intent function with minimal data
    try {
      const testPaymentData = {
        amount: 1000, // $10.00 for testing
        customerEmail: 'test@stripe-test.com',
        customerName: 'Stripe Test User',
        customerPhone: '555-0123',
        cleaningType: 'Standard Cleaning',
        frequency: 'One-time'
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: testPaymentData
      });

      if (error) throw error;

      setPaymentIntentTest({ success: true, data });
      setTestResults(prev => ({ ...prev, paymentIntentTest: { success: true, data } }));
      console.log('✅ Payment intent test:', data);
    } catch (error) {
      console.error('❌ Payment intent test failed:', error);
      setPaymentIntentTest({ success: false, error });
      setTestResults(prev => ({ ...prev, paymentIntentTest: { success: false, error } }));
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    console.log('✅ Test payment completed successfully!', orderId);
    setShowPaymentForm(false);
    alert(`Test payment successful! Order ID: ${orderId}`);
  };

  const handlePaymentCancel = () => {
    console.log('❌ Test payment cancelled');
    setShowPaymentForm(false);
  };

  const renderTestResult = (title: string, result: any, testKey: string) => {
    if (result === null || result === undefined) {
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">{title}:</span>
          <span className="text-gray-600">Testing...</span>
        </div>
      );
    }

    const success = result === true || result.success === true;
    const IconComponent = success ? CheckCircle : XCircle;
    const colorClass = success ? 'text-green-600' : 'text-red-600';
    const bgClass = success ? 'bg-green-50' : 'bg-red-50';

    return (
      <div className={`p-3 rounded-lg ${bgClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className={`h-5 w-5 ${colorClass}`} />
          <span className="font-medium">{title}:</span>
          <span className={colorClass}>{success ? 'PASS' : 'FAIL'}</span>
        </div>
        {result.data && (
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
        {result.error && (
          <div className="text-red-600 text-sm mt-1">
            Error: {typeof result.error === 'string' ? result.error : result.error.message || JSON.stringify(result.error)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Stripe Integration Test Suite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This page tests the Stripe payment integration. All tests use safe, non-charging test data.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {renderTestResult('Stripe Client Ready', stripeReady, 'stripeReady')}
              {renderTestResult('Stripe Config Retrieval', configTest, 'configTest')}
              {renderTestResult('Payment Intent Creation', paymentIntentTest, 'paymentIntentTest')}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={runStripeTests} variant="outline">
                Re-run Tests
              </Button>
              
              {stripeReady && paymentIntentTest?.success && (
                <Button 
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Test Payment Form
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {showPaymentForm && (
          <Card>
            <CardHeader>
              <CardTitle>Test Payment Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> Use test card number 4242 4242 4242 4242 with any future expiry date and any CVC.
                </p>
              </div>
              
              <CustomStripePayment
                paymentData={{
                  amount: 1000, // $10.00
                  customerEmail: 'test@stripe-test.com',
                  customerName: 'Stripe Test User',
                  customerPhone: '555-0123',
                  cleaningType: 'Integration Test',
                  frequency: 'One-time'
                }}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StripeTestPage;