import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  TestTube, 
  Play, 
  ArrowLeft,
  Home,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';

export function DevTestScenarios() {
  const navigate = useNavigate();
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const testScenarios = [
    {
      id: 'regular-small-tx',
      title: 'Regular Cleaning - Small Home (TX)',
      description: 'Weekly regular cleaning for 1000-1500 sq ft home in Texas',
      icon: Home,
      color: 'bg-blue-500',
      data: {
        serviceType: 'regular',
        frequency: 'weekly',
        homeSize: '1000-1500',
        zipCode: '75001',
        state: 'TX',
        estimate: false
      }
    },
    {
      id: 'deep-large-ca',
      title: 'Deep Cleaning - Large Home (CA)',
      description: 'One-time deep cleaning for 3000+ sq ft home in California',
      icon: Zap,
      color: 'bg-purple-500',
      data: {
        serviceType: 'deep',
        frequency: 'one_time',
        homeSize: '3001-4000',
        zipCode: '90210',
        state: 'CA',
        estimate: false
      }
    },
    {
      id: 'moveout-medium-tx',
      title: 'Move-Out Cleaning - Medium Home',
      description: 'Move-out cleaning for 2000-2500 sq ft home',
      icon: Users,
      color: 'bg-green-500',
      data: {
        serviceType: 'move_out',
        frequency: 'one_time',
        homeSize: '2001-2500',
        zipCode: '78701',
        state: 'TX',
        estimate: false
      }
    },
    {
      id: 'regular-biweekly-ca',
      title: 'Bi-Weekly Regular (CA)',
      description: 'Bi-weekly regular cleaning with discount pricing',
      icon: Calendar,
      color: 'bg-cyan-500',
      data: {
        serviceType: 'regular',
        frequency: 'biweekly',
        homeSize: '1501-2000',
        zipCode: '90401',
        state: 'CA',
        estimate: false
      }
    },
    {
      id: 'estimate-required',
      title: 'Large Home - Estimate Required',
      description: '5000+ sq ft home requiring custom estimate',
      icon: MapPin,
      color: 'bg-orange-500',
      data: {
        serviceType: 'regular',
        frequency: 'monthly',
        homeSize: '5001+',
        zipCode: '75205',
        state: 'TX',
        estimate: true
      }
    },
    {
      id: 'full-payment-test',
      title: 'Full Payment Flow Test',
      description: 'Test complete payment in full flow',
      icon: DollarSign,
      color: 'bg-emerald-500',
      data: {
        serviceType: 'deep',
        frequency: 'one_time',
        homeSize: '2501-3000',
        zipCode: '90210',
        state: 'CA',
        paymentType: 'full',
        estimate: false
      }
    }
  ];

  const runScenario = async (scenario: any) => {
    setRunningScenario(scenario.id);
    
    try {
      // Create URL with test parameters
      const params = new URLSearchParams({
        test: 'true',
        scenario: scenario.id,
        serviceType: scenario.data.serviceType,
        frequency: scenario.data.frequency,
        homeSize: scenario.data.homeSize,
        zipCode: scenario.data.zipCode,
        state: scenario.data.state,
        ...(scenario.data.paymentType && { paymentType: scenario.data.paymentType })
      });

      toast.success(`Starting test scenario: ${scenario.title}`);
      
      // Navigate to booking form with pre-filled data
      navigate(`/?${params.toString()}`);
      
    } catch (error) {
      console.error('Error running scenario:', error);
      toast.error('Failed to start test scenario');
    } finally {
      setRunningScenario(null);
    }
  };

  const runAllScenarios = async () => {
    toast.info('Running all scenarios would open multiple tabs. Use individual scenarios for now.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Test Scenarios - Dev Dashboard</title>
        <meta name="description" content="Pre-built test scenarios for comprehensive booking flow testing" />
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
              <TestTube className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Test Scenarios</h1>
            </div>
            <p className="text-muted-foreground">
              Pre-configured booking scenarios for comprehensive testing
            </p>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scenario Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={runAllScenarios} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Run All Scenarios
              </Button>
              <Badge variant="secondary">
                {testScenarios.length} Scenarios Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => {
            const IconComponent = scenario.icon;
            const isRunning = runningScenario === scenario.id;
            
            return (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${scenario.color} text-white`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </CardHeader>
                <CardContent>
                  {/* Scenario Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service:</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.data.serviceType}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frequency:</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.data.frequency}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size:</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.data.homeSize} sq ft
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.data.zipCode}, {scenario.data.state}
                      </Badge>
                    </div>
                    {scenario.data.estimate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimate:</span>
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => runScenario(scenario)}
                    disabled={isRunning}
                    className="w-full"
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Scenario
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use Test Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Select a test scenario that matches your testing needs</li>
              <li>Click "Run Scenario" to navigate to the booking form with pre-filled data</li>
              <li>Complete the booking flow to test end-to-end functionality</li>
              <li>Check the database inspector to verify data was created correctly</li>
              <li>Test different payment options (full payment vs 20% deposit)</li>
              <li>Verify confirmation emails and webhook integrations</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}