import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { TestResult } from '@/hooks/useBookingFlowTest';

interface TestScenarioRunnerProps {
  result: TestResult;
  onRerun?: () => void;
}

export function TestScenarioRunner({ result, onRerun }: TestScenarioRunnerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const passedChecks = result.checks.filter((c) => c.passed).length;
  const totalChecks = result.checks.length;
  const successRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

  const statusIcon = {
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    passed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
  }[result.status];

  const statusColor = {
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    passed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }[result.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {statusIcon}
              {result.scenario.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {result.scenario.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {result.status !== 'running' && onRerun && (
              <Button variant="outline" size="sm" onClick={onRerun}>
                <Play className="h-3 w-3 mr-1" />
                Rerun
              </Button>
            )}
            <Badge className={statusColor}>
              {result.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {passedChecks} / {totalChecks} checks passed
              </span>
              {result.duration && (
                <span className="text-muted-foreground">
                  {result.duration}ms
                </span>
              )}
            </div>
            <Progress value={successRate} className="h-2" />
          </div>

          {/* Test Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ZIP Code:</span>
              <span className="ml-2 font-medium">{result.scenario.zipCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Home Size:</span>
              <span className="ml-2 font-medium">{result.scenario.homeSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Service Type:</span>
              <span className="ml-2 font-medium">{result.scenario.serviceType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Frequency:</span>
              <span className="ml-2 font-medium">{result.scenario.frequency}</span>
            </div>
          </div>

          {/* Expand/Collapse Checks */}
          {result.checks.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>

              {isExpanded && (
                <div className="space-y-2 pt-2 border-t">
                  {result.checks.map((check, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                    >
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{check.name}</p>
                        {check.message && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {check.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {result.error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive font-medium">Error:</p>
              <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
            </div>
          )}

          {/* Booking ID */}
          {result.bookingId && (
            <div className="text-xs text-muted-foreground">
              Booking ID: <code className="font-mono">{result.bookingId}</code>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
