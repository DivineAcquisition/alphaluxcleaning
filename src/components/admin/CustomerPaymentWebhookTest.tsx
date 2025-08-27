import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TestTube2, 
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestOrder {
  id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  amount: number;
  status: string;
  test_data: any;
  webhook_response?: any;
  webhook_status?: string;
}

interface WebhookTestResult {
  success: boolean;
  message: string;
  webhook_response?: any;
  error?: string;
}

export function CustomerPaymentWebhookTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Test order form state
  const [testOrderForm, setTestOrderForm] = useState<Omit<TestOrder, 'id' | 'status' | 'test_data'>>({
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '(555) 123-4567',
    service_type: 'deep_cleaning',
    amount: 299.99
  });

  const samplePayload = {
    customer: {
      name: testOrderForm.customer_name,
      email: testOrderForm.customer_email,
      phone: testOrderForm.customer_phone
    },
    payment: {
      amount: testOrderForm.amount,
      currency: 'USD',
      status: 'completed',
      payment_method: 'card',
      transaction_id: `test_txn_${Date.now()}`
    },
    service: {
      type: testOrderForm.service_type,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00 AM - 12:00 PM'
    },
    order_id: selectedOrderId || `test_order_${Date.now()}`,
    webhook_test: true,
    timestamp: new Date().toISOString()
  };

  const createTestOrder = async () => {
    setIsCreatingOrder(true);
    
    try {
      const { data, error } = await supabase
        .from('webhook_test_orders')
        .insert({
          customer_name: testOrderForm.customer_name,
          customer_email: testOrderForm.customer_email,
          customer_phone: testOrderForm.customer_phone,
          service_type: testOrderForm.service_type,
          amount: testOrderForm.amount,
          status: 'pending',
          test_data: samplePayload
        })
        .select()
        .single();

      if (error) throw error;

      setTestOrders([...testOrders, data]);
      setSelectedOrderId(data.id);
      toast.success('Test order created successfully!');
    } catch (error) {
      console.error('Error creating test order:', error);
      toast.error('Failed to create test order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const loadTestOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_test_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTestOrders(data || []);
    } catch (error) {
      console.error('Error loading test orders:', error);
      toast.error('Failed to load test orders');
    }
  };

  const testCustomerPaymentWebhook = async () => {
    if (!selectedOrderId) {
      toast.error('Please select or create a test order first');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Testing customer payment webhook with payload:', samplePayload);
      
      const { data, error } = await supabase.functions.invoke('customer-payment-webhook', {
        body: samplePayload
      });

      if (error) {
        console.error('Customer payment webhook test error:', error);
        throw error;
      }

      console.log('Customer payment webhook test response:', data);
      
      // Update the test order with webhook results
      await supabase
        .from('webhook_test_orders')
        .update({
          webhook_response: data,
          webhook_status: data?.success ? 'success' : 'failed',
          status: 'completed'
        })
        .eq('id', selectedOrderId);

      setTestResult({
        success: data?.success || false,
        message: data?.message || 'Webhook test completed',
        webhook_response: data
      });
      
      if (data?.success) {
        toast.success(`Customer payment webhook test successful!`);
      } else {
        toast.error(`Customer payment webhook test failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing customer payment webhook:', error);
      setTestResult({
        success: false,
        message: error.message || 'Failed to test customer payment webhook',
        error: error.message
      });
      toast.error('Failed to test customer payment webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
      toast.success('Sample payload copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy payload');
    }
  };

  // Load test orders on component mount
  useEffect(() => {
    loadTestOrders();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Customer Payment Webhook Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Create Test Order Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Test Order</h3>
              <Button onClick={loadTestOrders} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={testOrderForm.customer_name}
                  onChange={(e) => setTestOrderForm({...testOrderForm, customer_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input
                  type="email"
                  value={testOrderForm.customer_email}
                  onChange={(e) => setTestOrderForm({...testOrderForm, customer_email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input
                  value={testOrderForm.customer_phone}
                  onChange={(e) => setTestOrderForm({...testOrderForm, customer_phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select
                  value={testOrderForm.service_type}
                  onValueChange={(value) => setTestOrderForm({...testOrderForm, service_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                    <SelectItem value="regular_cleaning">Regular Cleaning</SelectItem>
                    <SelectItem value="move_out_cleaning">Move-out Cleaning</SelectItem>
                    <SelectItem value="post_construction">Post Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={testOrderForm.amount}
                  onChange={(e) => setTestOrderForm({...testOrderForm, amount: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <Button 
              onClick={createTestOrder} 
              disabled={isCreatingOrder}
              className="w-full"
            >
              <TestTube2 className="h-4 w-4 mr-2" />
              {isCreatingOrder ? 'Creating...' : 'Create Test Order'}
            </Button>
          </div>

          <Separator />

          {/* Select Test Order & Test Webhook */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Customer Payment Webhook</h3>
            
            {testOrders.length > 0 && (
              <div className="space-y-2">
                <Label>Select Test Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {testOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id!}>
                        {order.customer_name} - ${order.amount} - {order.service_type}
                        {order.webhook_status && (
                          <Badge className="ml-2" variant={order.webhook_status === 'success' ? 'default' : 'destructive'}>
                            {order.webhook_status}
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button 
              onClick={testCustomerPaymentWebhook} 
              disabled={isLoading || !selectedOrderId}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing Webhook...' : 'Test Customer Payment Webhook'}
            </Button>
          </div>

          <Separator />

          {/* Sample Payload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Webhook Payload</h3>
              <div className="flex gap-2">
                <Button onClick={copyPayload} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
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
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(samplePayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Webhook Test Results</h3>
                
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
                    <p className="text-sm text-muted-foreground mb-3">
                      {testResult.message}
                    </p>
                    
                    {testResult.webhook_response && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Webhook Response:</p>
                        <div className="bg-muted p-3 rounded text-xs">
                          <pre>{JSON.stringify(testResult.webhook_response, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {testResult.error && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-destructive mb-2">Error Details:</p>
                        <div className="bg-destructive/10 p-3 rounded text-xs text-destructive">
                          {testResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}