import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CleanupResult {
  payments_deleted: number;
  bookings_deleted: number;  
  customers_deleted: number;
  events_deleted: number;
  email_jobs_deleted: number;
  integration_logs_deleted: number;
  total_deleted: number;
}

export const DeleteTestData = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const { toast } = useToast();

  const handleDeleteTestData = async () => {
    if (!confirm("⚠️ Are you sure you want to delete ALL test data? This action cannot be undone!")) {
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('delete-test-data', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setResult(data.result);
        toast({
          title: "✅ Test Data Cleaned",
          description: `Successfully deleted ${data.result.total_deleted} test records`,
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error cleaning test data:', error);
      toast({
        variant: "destructive",
        title: "❌ Cleanup Failed",
        description: error instanceof Error ? error.message : 'Failed to clean test data',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Delete Test Data
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            Permanently remove all test bookings, payments, and customer data
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <h4 className="font-medium text-destructive mb-2">⚠️ Warning: This Action is Irreversible</h4>
          <p className="text-sm text-muted-foreground">
            This will permanently delete:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
            <li>• All test bookings (source_channel = 'UI_DIRECT')</li>
            <li>• Associated payments and transactions</li>
            <li>• Test customer records</li>
            <li>• Related events and integration logs</li>
            <li>• Email jobs for test customers</li>
          </ul>
        </div>

        <Button 
          onClick={handleDeleteTestData} 
          disabled={isDeleting}
          variant="destructive"
          className="w-full"
        >
          {isDeleting ? "🗑️ Deleting Test Data..." : "🗑️ Delete All Test Data"}
        </Button>

        {result && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-green-600">✅ Cleanup Completed</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Payments: {result.payments_deleted}</div>
              <div>Bookings: {result.bookings_deleted}</div>
              <div>Customers: {result.customers_deleted}</div>
              <div>Events: {result.events_deleted}</div>
              <div>Email Jobs: {result.email_jobs_deleted}</div>
              <div>Integration Logs: {result.integration_logs_deleted}</div>
              <div className="col-span-2 font-medium border-t pt-2 mt-2">
                Total Deleted: {result.total_deleted} records
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};