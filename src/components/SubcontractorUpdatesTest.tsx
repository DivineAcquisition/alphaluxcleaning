import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, AlertCircle, MapPin, MessageSquare, UserCheck, Clock } from "lucide-react";

export function SubcontractorUpdatesTest() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [lastTestResults, setLastTestResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const sendUpdateTest = async (updateType: string, testData: any) => {
    setIsLoading(updateType);
    try {
      console.log(`Sending ${updateType} update test to webhook...`);
      
      const { data, error } = await supabase.functions.invoke('send-subcontractor-updates', {
        body: testData
      });

      if (error) {
        throw error;
      }

      console.log(`${updateType} webhook response:`, data);
      setLastTestResults(prev => ({ ...prev, [updateType]: data }));
      
      toast({
        title: "Success!",
        description: `${updateType.replace('_', ' ')} webhook triggered successfully`,
      });
    } catch (error) {
      console.error(`Error sending ${updateType}:`, error);
      setLastTestResults(prev => ({ ...prev, [updateType]: { error: error.message, success: false } }));
      
      toast({
        title: "Error",
        description: `Failed to send ${updateType.replace('_', ' ')} webhook`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const testCheckIn = () => {
    const testData = {
      update_type: 'check_in',
      subcontractor_id: `test_subcontractor_${Date.now()}`,
      assignment_id: `test_assignment_${Date.now()}`,
      order_id: `test_order_${Date.now()}`,
      location: {
        address: "456 Pine Street, San Francisco, CA 94102",
        latitude: 37.7749,
        longitude: -122.4194
      },
      message: 'Subcontractor checked in at customer location',
      photos: [
        { url: 'https://example.com/photo1.jpg', description: 'Arrival photo' }
      ],
      notes: 'Arrived on time, customer greeted at door'
    };
    sendUpdateTest('check_in', testData);
  };

  const testCheckOut = () => {
    const testData = {
      update_type: 'check_out',
      subcontractor_id: `test_subcontractor_${Date.now()}`,
      assignment_id: `test_assignment_${Date.now()}`,
      order_id: `test_order_${Date.now()}`,
      location: {
        address: "456 Pine Street, San Francisco, CA 94102",
        latitude: 37.7749,
        longitude: -122.4194
      },
      message: 'Service completed, checking out',
      photos: [
        { url: 'https://example.com/after1.jpg', description: 'Kitchen after cleaning' },
        { url: 'https://example.com/after2.jpg', description: 'Bathroom after cleaning' }
      ],
      notes: 'Service completed successfully, customer satisfied'
    };
    sendUpdateTest('check_out', testData);
  };

  const testStatusMessage = () => {
    const testData = {
      update_type: 'status_message',
      subcontractor_id: `test_subcontractor_${Date.now()}`,
      order_id: `test_order_${Date.now()}`,
      message: 'Running 15 minutes late due to traffic',
      estimated_arrival_minutes: 15
    };
    sendUpdateTest('status_message', testData);
  };

  const testAssignmentChange = () => {
    const testData = {
      update_type: 'assignment_change',
      subcontractor_id: `test_subcontractor_${Date.now()}`,
      assignment_id: `test_assignment_${Date.now()}`,
      order_id: `test_order_${Date.now()}`,
      message: 'Assignment status changed to: in_progress',
      status: 'in_progress',
      notes: 'Subcontractor accepted the job and is en route'
    };
    sendUpdateTest('assignment_change', testData);
  };

  const renderTestResult = (updateType: string) => {
    const result = lastTestResults[updateType];
    if (!result) return null;

    return (
      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{updateType.replace('_', ' ')}</span>
          {result.success !== false ? (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Success
            </Badge>
          ) : (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        
        {result.error && (
          <p className="text-xs text-red-600">{result.error}</p>
        )}
        
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Response
          </summary>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-24">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
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
          Test real-time subcontractor update webhooks (u6v07y3)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={testCheckIn}
            disabled={isLoading === 'check_in'}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading === 'check_in' && <Loader2 className="h-4 w-4 animate-spin" />}
            <MapPin className="h-4 w-4" />
            Test Check-In
          </Button>
          
          <Button
            onClick={testCheckOut}
            disabled={isLoading === 'check_out'}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading === 'check_out' && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle2 className="h-4 w-4" />
            Test Check-Out
          </Button>
          
          <Button
            onClick={testStatusMessage}
            disabled={isLoading === 'status_message'}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading === 'status_message' && <Loader2 className="h-4 w-4 animate-spin" />}
            <MessageSquare className="h-4 w-4" />
            Test Status Message
          </Button>
          
          <Button
            onClick={testAssignmentChange}
            disabled={isLoading === 'assignment_change'}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading === 'assignment_change' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Clock className="h-4 w-4" />
            Test Assignment Change
          </Button>
        </div>
        
        {Object.keys(lastTestResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Test Results:</h4>
            {Object.keys(lastTestResults).map(updateType => renderTestResult(updateType))}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u6v07y3/</p>
          <p>This webhook receives real-time updates for:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Check-in/Check-out:</strong> Location tracking with photos</li>
            <li><strong>Status Messages:</strong> ETA updates and communication</li>
            <li><strong>Assignment Changes:</strong> Job status transitions</li>
            <li><strong>Job Tracking:</strong> Real-time progress updates</li>
          </ul>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Sample Data Structures
          </summary>
          <div className="mt-2 space-y-3">
            {Object.entries(sampleDataStructures).map(([type, structure]) => (
              <div key={type}>
                <p className="font-medium mb-1">{type.replace('_', ' ')}:</p>
                <pre className="p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(structure, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}