import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface CleanerData {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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

const BulkOnboardExistingCleaners = () => {
  const [cleanersData, setCleanersData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OnboardingResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Sample data format for reference
  const sampleData = `[
  {
    "full_name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "(555) 123-4567",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102"
  },
  {
    "full_name": "Maria Garcia",
    "email": "maria.garcia@example.com",
    "phone": "(555) 234-5678",
    "city": "Oakland",
    "state": "CA"
  }
]`;

  const handleBulkOnboard = async () => {
    if (!cleanersData.trim()) {
      toast({
        title: "Error",
        description: "Please enter cleaner data in JSON format",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setResults([]);

      // Parse the JSON data
      let cleaners: CleanerData[];
      try {
        cleaners = JSON.parse(cleanersData);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your data format.');
      }

      if (!Array.isArray(cleaners) || cleaners.length === 0) {
        throw new Error('Data must be an array of cleaner objects');
      }

      // Validate required fields
      for (const cleaner of cleaners) {
        if (!cleaner.full_name || !cleaner.email) {
          throw new Error(`Missing required fields (full_name, email) for cleaner: ${JSON.stringify(cleaner)}`);
        }
      }

      toast({
        title: "Processing Started",
        description: `Starting bulk onboarding for ${cleaners.length} cleaners...`
      });

      setProgress(25);

      // Call the bulk onboarding edge function
      const { data, error } = await supabase.functions.invoke('bulk-onboard-existing-cleaners', {
        body: {
          cleaners,
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
          description: `Successfully processed ${successful} cleaners. ${failed > 0 ? `${failed} failed.` : ''}`,
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
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Bulk Onboard Existing Cleaners</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Cleaner Data Input
            </CardTitle>
            <CardDescription>
              Enter cleaner data in JSON format. Each cleaner will be set up at Tier 2 (Professional) - $18/hr.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cleaners JSON Data:</label>
              <Textarea
                placeholder="Paste JSON data here..."
                value={cleanersData}
                onChange={(e) => setCleanersData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sample Format:</label>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {sampleData}
              </pre>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button 
              onClick={handleBulkOnboard}
              disabled={isProcessing || !cleanersData.trim()}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Start Bulk Onboarding'}
            </Button>
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
                <p>No results yet. Start the onboarding process to see results here.</p>
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
                <div className="text-sm text-muted-foreground">Successful</div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkOnboardExistingCleaners;