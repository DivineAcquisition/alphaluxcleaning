import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getHCPConfig, syncBookingToHCP, retryFailedSync, getHCPSyncLogs } from '@/lib/hcp';
import { TestTube, Play, RefreshCw, Eye, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  bookingData: any;
  expectedResult: string;
}

const testScenarios: TestScenario[] = [
  {
    id: 'standard-cleaning',
    name: 'Standard Cleaning',
    description: 'Basic recurring cleaning service',
    bookingData: {
      service_type: 'standard',
      frequency: 'bi-weekly',
      sqft_or_bedrooms: '1000-1500sqft'
    },
    expectedResult: 'Creates customer and recurring job in HCP'
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning',
    description: 'One-time deep cleaning service',
    bookingData: {
      service_type: 'deep',
      frequency: 'one-time',
      sqft_or_bedrooms: '2000-2500sqft'
    },
    expectedResult: 'Creates customer and one-time job in HCP'
  },
  {
    id: 'move-in-out',
    name: 'Move In/Out',
    description: 'Move in/out cleaning with addons',
    bookingData: {
      service_type: 'move-in-out',
      frequency: 'one-time',
      sqft_or_bedrooms: '1500-2000sqft',
      addons: ['inside_oven', 'inside_fridge', 'inside_cabinets']
    },
    expectedResult: 'Creates customer and job with addon line items'
  }
];

export default function HCPTestSuite() {
  const [hcpConfig, setHcpConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHCPConfig();
    loadSyncLogs();
  }, []);

  const loadHCPConfig = async () => {
    try {
      const config = await getHCPConfig();
      setHcpConfig(config);
    } catch (error) {
      console.error('Failed to load HCP config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await getHCPSyncLogs({ limit: 20 });
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const createTestCustomer = async () => {
    const customerId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: customerId,
        name: `Test Customer ${Date.now()}`,
        first_name: 'Test',
        last_name: `Customer${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: '(857) 754-4557',
        address: '123 Test Street',
        address_line1: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const runTestScenario = async (scenario: TestScenario) => {
    setRunningTests(prev => new Set([...prev, scenario.id]));
    
    try {
      // Create test customer
      const customer = await createTestCustomer();

      // Create test booking with scenario data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customer.id,
          service_type: scenario.bookingData.service_type,
          frequency: scenario.bookingData.frequency,
          sqft_or_bedrooms: scenario.bookingData.sqft_or_bedrooms,
          est_price: 150.00,
          status: 'confirmed',
          service_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time_slot: '09:00-12:00',
          zip_code: '94102',
          special_instructions: `Test scenario: ${scenario.name}`,
          source_channel: 'HCP_TEST_SUITE',
          addons: scenario.bookingData.addons ? { addons: scenario.bookingData.addons } : null,
          property_details: {
            bedrooms: 2,
            bathrooms: 2,
            pets: false,
            parking: 'street'
          }
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Wait a moment for the trigger to fire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check sync result
      const syncResult = await supabase
        .from('hcp_sync_log')
        .select('*')
        .eq('booking_id', booking.id)
        .single();

      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          success: true,
          booking,
          customer,
          syncResult: syncResult.data,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: 'Test Completed',
        description: `${scenario.name} test completed successfully`
      });

    } catch (error) {
      console.error(`Test ${scenario.id} failed:`, error);
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: 'Test Failed',
        description: `${scenario.name} test failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(scenario.id);
        return next;
      });
      
      // Refresh logs
      await loadSyncLogs();
    }
  };

  const runAllTests = async () => {
    for (const scenario of testScenarios) {
      if (!runningTests.has(scenario.id)) {
        await runTestScenario(scenario);
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : 
                   status === 'failed' ? 'destructive' : 
                   status === 'pending' ? 'secondary' : 'outline';
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (configLoading) {
    return (
      <AdminLayout title="HCP Test Suite" description="Comprehensive testing for Housecall Pro integration">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="HCP Test Suite" description="Comprehensive testing for Housecall Pro integration">
      <div className="space-y-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hcpConfig ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={hcpConfig.enabled ? 'default' : 'secondary'}>
                    {hcpConfig.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <Badge variant={hcpConfig.test_mode ? 'secondary' : 'default'}>
                    {hcpConfig.test_mode ? 'Test' : 'Production'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Key</p>
                  <p className="text-sm font-mono">
                    {hcpConfig.api_key ? '****' + hcpConfig.api_key.slice(-4) : 'Not Set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base URL</p>
                  <p className="text-xs text-muted-foreground">{hcpConfig.base_url}</p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  HCP configuration not found. Please configure the integration first.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList>
            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Test Scenarios</h3>
              <Button onClick={runAllTests} disabled={runningTests.size > 0}>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </Button>
            </div>

            <div className="grid gap-4">
              {testScenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runTestScenario(scenario)}
                        disabled={runningTests.has(scenario.id) || !hcpConfig?.enabled}
                      >
                        {runningTests.has(scenario.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Service:</strong> {scenario.bookingData.service_type}</p>
                      <p className="text-sm"><strong>Frequency:</strong> {scenario.bookingData.frequency}</p>
                      <p className="text-sm"><strong>Size:</strong> {scenario.bookingData.sqft_or_bedrooms}</p>
                      <p className="text-sm text-muted-foreground">{scenario.expectedResult}</p>
                      
                      {testResults[scenario.id] && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {testResults[scenario.id].success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-semibold">
                              {testResults[scenario.id].success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          {testResults[scenario.id].error && (
                            <p className="text-sm text-red-600">{testResults[scenario.id].error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Sync Logs</h3>
              <Button onClick={loadSyncLogs} size="sm" disabled={logsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {syncLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-semibold">Booking ID: {log.booking_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(log.status)}
                        <Badge variant="outline">{log.attempts} attempts</Badge>
                      </div>
                    </div>
                    {log.last_error && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {log.last_error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results Summary</h3>
            
            {Object.keys(testResults).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No test results yet. Run some tests to see results here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(testResults).map(([scenarioId, result]: [string, any]) => {
                  const scenario = testScenarios.find(s => s.id === scenarioId);
                  return (
                    <Card key={scenarioId}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {scenario?.name}
                        </CardTitle>
                        <CardDescription>
                          Executed: {new Date(result.timestamp).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {result.success ? (
                          <div className="space-y-2">
                            <p className="text-sm"><strong>Booking ID:</strong> {result.booking?.id}</p>
                            <p className="text-sm"><strong>Customer:</strong> {result.customer?.name}</p>
                            {result.syncResult && (
                              <div>
                                <p className="text-sm"><strong>HCP Sync Status:</strong> {result.syncResult.status}</p>
                                {result.syncResult.hcp_customer_id && (
                                  <p className="text-sm"><strong>HCP Customer ID:</strong> {result.syncResult.hcp_customer_id}</p>
                                )}
                                {result.syncResult.hcp_job_id && (
                                  <p className="text-sm"><strong>HCP Job ID:</strong> {result.syncResult.hcp_job_id}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{result.error}</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}