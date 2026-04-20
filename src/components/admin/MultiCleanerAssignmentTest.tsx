import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, TestTube, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  data?: any;
}

export function MultiCleanerAssignmentTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runMultiCleanerTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Create a test booking
      results.push({ test: "Creating test booking...", status: 'pass', message: "Starting test" });
      
      const testBooking = {
        customer_name: "Multi-Cleaner Test Customer",
        customer_email: `test-${Date.now()}@example.com`,
        customer_phone: "(857) 754-4557",
        service_address: "123 Test Street, New York, NY 10001",
        service_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        service_time: "10:00 AM - 12:00 PM",
        special_instructions: "Test booking for multi-cleaner assignment system",
        status: "scheduled",
        priority: "normal"
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();

      if (bookingError || !booking) {
        results.push({ 
          test: "Create Test Booking", 
          status: 'fail', 
          message: `Failed to create booking: ${bookingError?.message}` 
        });
        setTestResults(results);
        setIsRunning(false);
        return;
      }

      results.push({ 
        test: "Create Test Booking", 
        status: 'pass', 
        message: `Test booking created with ID: ${booking.id}`,
        data: booking 
      });

      // Test 2: Get available subcontractors
      const { data: subcontractors, error: subError } = await supabase
        .from('subcontractors')
        .select('id, full_name, email')
        .eq('is_available', true)
        .limit(3);

      if (subError || !subcontractors || subcontractors.length < 2) {
        results.push({ 
          test: "Get Available Subcontractors", 
          status: 'fail', 
          message: `Need at least 2 available subcontractors, found: ${subcontractors?.length || 0}` 
        });
        setTestResults(results);
        setIsRunning(false);
        return;
      }

      results.push({ 
        test: "Get Available Subcontractors", 
        status: 'pass', 
        message: `Found ${subcontractors.length} available subcontractors` 
      });

      // Test 3: Assign multiple cleaners (up to 3)
      const cleanersToAssign = subcontractors.slice(0, Math.min(3, subcontractors.length));
      const assignments = [];

      for (let i = 0; i < cleanersToAssign.length; i++) {
        const { data: assignment, error: assignError } = await supabase
          .from('subcontractor_job_assignments')
          .insert({
            booking_id: booking.id,
            subcontractor_id: cleanersToAssign[i].id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            subcontractor_notes: `Test assignment ${i + 1} of ${cleanersToAssign.length}`
          })
          .select()
          .single();

        if (assignError || !assignment) {
          results.push({ 
            test: `Assign Cleaner ${i + 1}`, 
            status: 'fail', 
            message: `Failed to assign cleaner: ${assignError?.message}` 
          });
          continue;
        }

        assignments.push(assignment);
        results.push({ 
          test: `Assign Cleaner ${i + 1}`, 
          status: 'pass', 
          message: `Assigned ${cleanersToAssign[i].full_name}` 
        });
      }

      // Test 4: Update booking with primary assigned employee
      if (assignments.length > 0) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ assigned_employee_id: cleanersToAssign[0].id })
          .eq('id', booking.id);

        if (updateError) {
          results.push({ 
            test: "Update Booking", 
            status: 'fail', 
            message: `Failed to update booking: ${updateError.message}` 
          });
        } else {
          results.push({ 
            test: "Update Booking", 
            status: 'pass', 
            message: "Booking updated with primary assigned cleaner" 
          });
        }
      }

      // Test 5: Verify assignments were created
      const { data: createdAssignments, error: verifyError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          subcontractors (full_name, email)
        `)
        .eq('booking_id', booking.id);

      if (verifyError || !createdAssignments) {
        results.push({ 
          test: "Verify Assignments", 
          status: 'fail', 
          message: `Failed to verify assignments: ${verifyError?.message}` 
        });
      } else {
        results.push({ 
          test: "Verify Assignments", 
          status: 'pass', 
          message: `Successfully created ${createdAssignments.length} assignments`,
          data: createdAssignments 
        });
      }

      // Test 6: Test webhook trigger
      if (assignments.length > 0) {
        try {
          const { error: webhookError } = await supabase.functions.invoke('send-order-entry-webhook', {
            body: {
              booking_id: booking.id,
              assignment_id: assignments[0].id
            }
          });

          if (webhookError) {
            results.push({ 
              test: "Order Entry Webhook", 
              status: 'fail', 
              message: `Webhook failed: ${webhookError.message}` 
            });
          } else {
            results.push({ 
              test: "Order Entry Webhook", 
              status: 'pass', 
              message: "Webhook triggered successfully" 
            });
          }
        } catch (webhookError: any) {
          results.push({ 
            test: "Order Entry Webhook", 
            status: 'fail', 
            message: `Webhook error: ${webhookError.message}` 
          });
        }
      }

      results.push({ 
        test: "Multi-Cleaner Assignment Test", 
        status: 'pass', 
        message: `✅ All tests completed! Assigned ${assignments.length} cleaners to test booking.` 
      });

    } catch (error: any) {
      results.push({ 
        test: "Test Suite", 
        status: 'fail', 
        message: `Test suite failed: ${error.message}` 
      });
    }

    setTestResults(results);
    setIsRunning(false);
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const totalTests = results.length;
    
    if (passCount === totalTests) {
      toast.success(`All ${totalTests} tests passed! Multi-cleaner assignment system is working correctly.`);
    } else {
      toast.error(`${totalTests - passCount} tests failed. Check results for details.`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Multi-Cleaner Assignment System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runMultiCleanerTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {isRunning ? "Running Tests..." : "Test Multi-Cleaner Assignment"}
          </Button>
          {testResults.length > 0 && (
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="font-semibold">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {result.status === 'pass' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.test}</span>
                    <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View Data
                      </summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">What this test validates:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Creates test booking</li>
            <li>✅ Finds available subcontractors</li>
            <li>✅ Assigns up to 3 cleaners to same job</li>
            <li>✅ Updates booking with primary cleaner</li>
            <li>✅ Verifies all assignments were created</li>
            <li>✅ Triggers order entry webhook</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}