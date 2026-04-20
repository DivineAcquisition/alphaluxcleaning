import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Play, UserCheck } from "lucide-react";

export function SubcontractorUpdatesTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const { toast } = useToast();

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    const newCorrelationId = `test_${Date.now()}`;
    setCorrelationId(newCorrelationId);

    const mockSubcontractor = {
      id: `test_subcontractor_${newCorrelationId}`,
      full_name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "(857) 754-4557"
    };

    const baseIds = {
      assignment_id: `test_assignment_${newCorrelationId}`,
      order_id: `test_order_${newCorrelationId}`,
    };

    const testSequence = [
      {
        step: 1,
        name: "Assignment Accepted",
        data: {
          update_type: 'assignment_change',
          ...baseIds,
          subcontractor_id: mockSubcontractor.id,
          message: 'Assignment accepted by subcontractor',
          status: 'accepted',
          notes: 'Subcontractor has accepted the cleaning job and will arrive soon',
          testMode: true,
          mockSubcontractor,
          correlationId: newCorrelationId
        }
      },
      {
        step: 2,
        name: "En Route Status",
        data: {
          update_type: 'status_message',
          ...baseIds,
          subcontractor_id: mockSubcontractor.id,
          message: 'On my way to the location, ETA 20 minutes',
          estimated_arrival_minutes: 20,
          testMode: true,
          mockSubcontractor,
          correlationId: newCorrelationId
        }
      },
      {
        step: 3,
        name: "Check-In",
        data: {
          update_type: 'check_in',
          ...baseIds,
          subcontractor_id: mockSubcontractor.id,
          location: {
            address: "1234 Main Street, San Francisco, CA 94102",
            latitude: 37.7749,
            longitude: -122.4194
          },
          message: 'Arrived at customer location, starting service',
          photos: [
            { url: 'https://example.com/arrival.jpg', description: 'Arrived at location' }
          ],
          notes: 'Customer greeted, supplies ready, beginning cleaning service',
          testMode: true,
          mockSubcontractor,
          correlationId: newCorrelationId
        }
      },
      {
        step: 4,
        name: "Service Progress",
        data: {
          update_type: 'status_message',
          ...baseIds,
          subcontractor_id: mockSubcontractor.id,
          message: 'Service in progress - kitchen and bathrooms completed',
          testMode: true,
          mockSubcontractor,
          correlationId: newCorrelationId
        }
      },
      {
        step: 5,
        name: "Check-Out",
        data: {
          update_type: 'check_out',
          ...baseIds,
          subcontractor_id: mockSubcontractor.id,
          location: {
            address: "1234 Main Street, San Francisco, CA 94102",
            latitude: 37.7749,
            longitude: -122.4194
          },
          message: 'Service completed successfully, checking out',
          photos: [
            { url: 'https://example.com/kitchen_after.jpg', description: 'Kitchen cleaned' },
            { url: 'https://example.com/bathroom_after.jpg', description: 'Bathroom cleaned' },
            { url: 'https://example.com/living_room_after.jpg', description: 'Living room cleaned' }
          ],
          notes: 'All areas cleaned thoroughly, customer satisfied with results',
          testMode: true,
          mockSubcontractor,
          correlationId: newCorrelationId
        }
      }
    ];

    console.log(`Starting comprehensive subcontractor test sequence (${newCorrelationId}):`, testSequence);

    for (const test of testSequence) {
      try {
        console.log(`Step ${test.step}: Sending ${test.name} update...`, test.data);
        
        const { data, error } = await supabase.functions.invoke('send-subcontractor-updates', {
          body: test.data
        });

        if (error) {
          throw error;
        }

        const result = {
          step: test.step,
          name: test.name,
          success: true,
          data,
          timestamp: new Date().toISOString()
        };

        console.log(`Step ${test.step} successful:`, result);
        setTestResults(prev => [...prev, result]);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Step ${test.step} failed:`, error);
        const result = {
          step: test.step,
          name: test.name,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        setTestResults(prev => [...prev, result]);
        break; // Stop on first error
      }
    }

    setIsLoading(false);
    
    const successCount = testResults.filter(r => r.success).length + 1; // +1 for the final result
    
    toast({
      title: successCount === testSequence.length ? "Complete Success!" : "Partial Success",
      description: `${successCount}/${testSequence.length} webhook updates sent successfully`,
      variant: successCount === testSequence.length ? "default" : "destructive",
    });
  };

  const renderTestResults = () => {
    if (testResults.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Test Sequence Results:</h4>
          {correlationId && (
            <Badge variant="outline" className="text-xs">
              ID: {correlationId.split('_')[1]}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                  Step {result.step}
                </span>
                <span className="text-sm font-medium">{result.name}</span>
                {result.success ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                )}
              </div>
              
              {result.error && (
                <p className="text-xs text-red-600 mb-2">{result.error}</p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString()}
              </p>
              
              <details className="text-xs mt-2">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View Response
                </summary>
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sampleDataStructures = {
    check_in: {
      update_type: 'check_in',
      subcontractor_id: 'uuid',
      assignment_id: 'uuid', 
      order_id: 'uuid',
      location: { address: 'string', lat: 'number', lng: 'number' },
      message: 'string',
      photos: [{ url: 'string', description: 'string' }],
      notes: 'string'
    },
    check_out: {
      update_type: 'check_out', 
      subcontractor_id: 'uuid',
      assignment_id: 'uuid',
      order_id: 'uuid',
      location: { address: 'string', lat: 'number', lng: 'number' },
      message: 'string',
      photos: [{ url: 'string', description: 'string' }],
      notes: 'string'
    },
    status_message: {
      update_type: 'status_message',
      subcontractor_id: 'uuid',
      order_id: 'uuid', 
      message: 'string',
      estimated_arrival_minutes: 'number'
    },
    assignment_change: {
      update_type: 'assignment_change',
      subcontractor_id: 'uuid',
      assignment_id: 'uuid',
      order_id: 'uuid',
      message: 'string',
      status: 'string',
      notes: 'string'
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-500" />
          Subcontractor Updates Webhook Test
        </CardTitle>
        <CardDescription>
          Test complete subcontractor workflow with realistic data including names and emails (u6v07y3)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button
            onClick={runComprehensiveTest}
            disabled={isLoading}
            size="lg"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isLoading ? "Running Complete Test Sequence..." : "Run Complete Workflow Test"}
          </Button>
          
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
            <p className="font-medium mb-1">This test simulates a complete subcontractor workflow:</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Assignment accepted by subcontractor</li>
              <li>En route status with ETA</li>
              <li>Check-in at customer location with photos</li>
              <li>Service progress update</li>
              <li>Check-out with completion photos</li>
            </ol>
            <p className="mt-2">
              <strong>Mock Subcontractor:</strong> Sarah Johnson (sarah.johnson@example.com)
            </p>
          </div>
        </div>
        
        {renderTestResults()}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u6v07y3/</p>
          <p>Each webhook payload includes:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Subcontractor Details:</strong> Full name, email, phone number</li>
            <li><strong>Location Data:</strong> GPS coordinates and addresses</li>
            <li><strong>Photos & Notes:</strong> Visual documentation and messages</li>
            <li><strong>Timestamps:</strong> Real-time event tracking</li>
            <li><strong>Order Context:</strong> Customer and service details</li>
          </ul>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Sample Webhook Payload Structure
          </summary>
          <div className="mt-2">
            <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-48">
{`{
  "event_type": "subcontractor_update",
  "update_type": "check_in",
  "timestamp": "2024-01-15T10:30:00Z",
  "subcontractor": {
    "id": "uuid",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "phone": "(857) 754-4557"
  },
  "order": {
    "id": "uuid",
    "customer_name": "John Doe",
    "service_address": "1234 Main St",
    "service_date": "2024-01-15",
    "status": "in_progress"
  },
  "location": {
    "address": "1234 Main Street, SF, CA",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "photos": [
    {"url": "...", "description": "Arrival photo"}
  ],
  "notes": "Customer greeted, starting service",
  "metadata": {
    "webhook_version": "1.0",
    "environment": "production"
  }
}`}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}