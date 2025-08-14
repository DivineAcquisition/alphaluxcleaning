import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, CheckCircle, XCircle, Clock, AlertCircle, UserPlus } from 'lucide-react';

interface CleanerData {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  availability?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface OnboardingResult {
  email: string;
  full_name: string;
  status: 'success' | 'failed';
  auth_user_id?: string;
  onboarding_token?: string;
  temporary_password?: string;
  error?: string;
  tier_info?: {
    level: number;
    hourly_rate: number;
    monthly_fee: number;
  };
}

const AddSpreadsheetCleaners = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OnboardingResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Cleaners from the spreadsheet (excluding blue-highlighted ones)
  const cleanersToAdd: CleanerData[] = [
    {
      full_name: "Christal Bowen",
      email: "christalbowen85@gmail.com",
      city: "San Francisco",
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Elda Navarro", 
      email: "eldanavarro5@gmail.com",
      city: "Oakland",
      state: "CA", 
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Jennifer Sullins",
      email: "jennifersullins84@gmail.com",
      city: "San Jose",
      state: "CA",
      availability: "Part-time",
      emergency_contact_name: "To be updated", 
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Maria Bejarano",
      email: "mariabejarano22@gmail.com",
      city: "San Francisco", 
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Maria Lopez",
      email: "marialopez0587@gmail.com", 
      city: "Fremont",
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Milda Pairol",
      email: "mildapairol@gmail.com",
      city: "Daly City",
      state: "CA",
      availability: "Full-time", 
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Rikal Louis", 
      email: "rikallouis77@gmail.com",
      city: "Berkeley",
      state: "CA",
      availability: "Part-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Rosa Flores",
      email: "rosaflores.cleaning@gmail.com",
      city: "San Mateo",
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Rosa Flores", 
      email: "rosaflores0406@gmail.com",
      city: "Redwood City",
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Rosa Lopez",
      email: "rosalopez.bacp@gmail.com",
      city: "Hayward", 
      state: "CA",
      availability: "Full-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    },
    {
      full_name: "Maddison Roca",
      email: "maddisonroca.bacp@gmail.com",
      city: "Palo Alto",
      state: "CA", 
      availability: "Part-time",
      emergency_contact_name: "To be updated",
      emergency_contact_phone: "To be updated"
    }
  ];

  const handleBulkOnboard = async () => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setResults([]);

      toast({
        title: "Processing Started",
        description: `Starting bulk onboarding for ${cleanersToAdd.length} cleaners at Professional tier ($18/hr)...`
      });

      setProgress(25);

      // Call the bulk onboarding edge function
      const { data, error } = await supabase.functions.invoke('bulk-onboard-existing-cleaners', {
        body: {
          cleaners: cleanersToAdd,
          batch_size: 5
        }
      });

      if (error) {
        throw new Error(`Onboarding failed: ${error.message}`);
      }

      setProgress(100);

      if (data?.success) {
        setResults(data.results || []);
        
        const successful = data.results?.filter((r: OnboardingResult) => r.status === 'success').length || 0;
        const failed = data.results?.filter((r: OnboardingResult) => r.status === 'failed').length || 0;

        toast({
          title: "Bulk Onboarding Completed",
          description: `Successfully processed ${successful} cleaners. ${failed > 0 ? `${failed} failed.` : 'All cleaners can now access the subcontractor portal!'}`,
          variant: successful > 0 ? "default" : "destructive"
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }

    } catch (error: any) {
      console.error('Bulk onboarding error:', error);
      toast({
        title: "Onboarding Failed",
        description: error.message,
        variant: "destructive"
      });
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Processing</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Add Spreadsheet Cleaners to Subcontractor Network</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cleaners List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cleaners to Add ({cleanersToAdd.length})
            </CardTitle>
            <CardDescription>
              These cleaners will be set up at Tier 2 (Professional) - $18/hr with $50/month fee and 70/30 split.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {cleanersToAdd.map((cleaner, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cleaner.full_name}</span>
                    <Badge variant="outline">Ready</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Email:</strong> {cleaner.email}</p>
                    <p><strong>Location:</strong> {cleaner.city}, {cleaner.state}</p>
                    <p><strong>Availability:</strong> {cleaner.availability}</p>
                  </div>
                </div>
              ))}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing cleaners...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button 
              onClick={handleBulkOnboard}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing...' : `Add ${cleanersToAdd.length} Cleaners to Network`}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <h4 className="font-medium text-blue-900 mb-1">What happens next:</h4>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Supabase Auth accounts created with temporary passwords</li>
                <li>Subcontractor roles assigned for portal access</li>
                <li>Welcome emails sent with login credentials</li>
                <li>Set up at Professional tier ($18/hr, $50/month)</li>
                <li>Ready to track jobs and tips through the portal</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Onboarding Results
            </CardTitle>
            <CardDescription>
              Results will appear here after processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results yet. Click the button to start onboarding cleaners.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.full_name}</span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Email:</strong> {result.email}</p>
                      {result.status === 'success' ? (
                        <div className="space-y-1">
                          {result.tier_info && (
                            <p><strong>Tier:</strong> Professional (${result.tier_info.hourly_rate}/hr)</p>
                          )}
                          <p><strong>Auth User:</strong> {result.auth_user_id}</p>
                          {result.temporary_password && (
                            <p><strong>Temp Password:</strong> <code className="bg-muted px-1 rounded">{result.temporary_password}</code></p>
                          )}
                          <p className="text-green-600"><strong>Status:</strong> Ready for portal access</p>
                        </div>
                      ) : (
                        result.error && (
                          <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">Successfully Added</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {results.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
            </div>
            
            {results.filter(r => r.status === 'success').length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>Next Steps:</strong> Successfully added cleaners can now log into the subcontractor portal 
                  using their email and temporary password. They should complete their profile setup and 
                  will be able to track jobs, earnings, and tips through the system.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddSpreadsheetCleaners;