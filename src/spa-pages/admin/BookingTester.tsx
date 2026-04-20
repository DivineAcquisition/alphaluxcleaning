import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestScenarioRunner } from '@/components/admin/TestScenarioRunner';
import { useBookingFlowTest } from '@/hooks/useBookingFlowTest';
import { HAPPY_PATH_SCENARIOS, EDGE_CASE_SCENARIOS, ALL_TEST_SCENARIOS } from '@/lib/test-scenarios';
import { Play, Loader2, RotateCcw, CheckCircle2, XCircle, TestTube } from 'lucide-react';
import { useState } from 'react';

export default function BookingTester() {
  const { isRunning, currentTest, results, runTestSuite, runTest, clearResults } = useBookingFlowTest();
  const [selectedSuite, setSelectedSuite] = useState<'happy' | 'edge' | 'all'>('happy');

  const handleRunSuite = () => {
    const scenarios = {
      happy: HAPPY_PATH_SCENARIOS,
      edge: EDGE_CASE_SCENARIOS,
      all: ALL_TEST_SCENARIOS,
    }[selectedSuite];

    runTestSuite(scenarios);
  };

  const passedTests = results.filter((r) => r.status === 'passed').length;
  const failedTests = results.filter((r) => r.status === 'failed').length;
  const totalTests = results.length;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Automated Booking Flow Tester - AlphaLux Admin</title>
        <meta name="description" content="Run automated tests on the booking flow" />
      </Helmet>

      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <TestTube className="h-8 w-8 text-primary" />
            Automated Booking Flow Tester
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate customer behavior and validate all booking steps
          </p>
        </div>

        {/* Test Suite Selection & Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Suite Controls</CardTitle>
            <CardDescription>
              Select and run automated test scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <Button
                  variant={selectedSuite === 'happy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSuite('happy')}
                >
                  Happy Path ({HAPPY_PATH_SCENARIOS.length})
                </Button>
                <Button
                  variant={selectedSuite === 'edge' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSuite('edge')}
                >
                  Edge Cases ({EDGE_CASE_SCENARIOS.length})
                </Button>
                <Button
                  variant={selectedSuite === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSuite('all')}
                >
                  All Tests ({ALL_TEST_SCENARIOS.length})
                </Button>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleRunSuite}
                disabled={isRunning}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test Suite
                  </>
                )}
              </Button>

              {results.length > 0 && !isRunning && (
                <Button
                  onClick={clearResults}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalTests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {passedTests}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {failedTests}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{successRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {isRunning && currentTest && (
          <div className="mb-4">
            <Badge variant="secondary" className="animate-pulse">
              Running: {currentTest}
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result) => (
            <TestScenarioRunner
              key={result.scenario.id}
              result={result}
              onRerun={() => runTest(result.scenario)}
            />
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <Card>
            <CardContent className="text-center py-12">
              <TestTube className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests run yet</h3>
              <p className="text-muted-foreground mb-4">
                Select a test suite above and click "Run Test Suite" to begin
              </p>
              <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto text-left">
                <p><strong>Happy Path:</strong> Tests standard booking flows across all configurations</p>
                <p><strong>Edge Cases:</strong> Tests error handling and unusual scenarios</p>
                <p><strong>All Tests:</strong> Runs complete test suite</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
