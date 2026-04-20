import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home
} from "lucide-react";

interface TokenValidation {
  valid: boolean;
  assignment?: any;
  booking?: any;
  subcontractor?: any;
  error?: string;
}

export default function SubcontractorJobAcceptance() {
  const [searchParams] = useSearchParams();
  const [tokenData, setTokenData] = useState<TokenValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState({
    declineReason: '',
    estimatedTime: '',
    notes: ''
  });

  const token = searchParams.get('token');
  const action = searchParams.get('action');

  useEffect(() => {
    if (token && action) {
      validateToken();
    } else {
      setLoading(false);
      setTokenData({ valid: false, error: 'Invalid or missing parameters' });
    }
  }, [token, action]);

  const validateToken = async () => {
    try {
      console.log('Validating token:', { token, action });

      // Call the subcontractor-response function to validate and handle
      const response = await fetch(`https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/subcontractor-response?token=${token}&action=${action}`);
      
      if (!response.ok) {
        // If it's an HTML response, it means the token was processed
        if (response.headers.get('content-type')?.includes('text/html')) {
          const html = await response.text();
          document.body.innerHTML = html;
          return;
        }
        throw new Error('Token validation failed');
      }

      // If we get here, show the response form
      setTokenData({ valid: true });
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenData({ valid: false, error: 'Failed to validate token' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!token || !action) return;

    setResponding(true);
    try {
      const requestBody = {
        token,
        action,
        declineReason: action === 'decline' ? response.declineReason : undefined,
        estimatedArrivalMinutes: response.estimatedTime ? parseInt(response.estimatedTime) : undefined,
        notes: response.notes || undefined
      };

      const res = await fetch('https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/subcontractor-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        throw new Error('Failed to submit response');
      }

      // Show the response page
      const html = await res.text();
      document.body.innerHTML = html;

    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Validating your request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Request</h2>
            <p className="text-muted-foreground text-center">
              {tokenData?.error || 'This link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">AlphaLux Cleaning</h1>
          </div>
          <p className="text-muted-foreground">Job Response Portal</p>
        </div>

        {/* Mock Job Details Card (since we don't have the actual data) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Job Assignment Response
              <Badge variant={action === 'accept' ? 'default' : 'destructive'}>
                {action?.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Response Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Complete Your Response</h3>
              
              {action === 'accept' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Accepting this job</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Great! You're accepting this cleaning assignment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Estimated arrival time
                    </label>
                    <Select value={response.estimatedTime} onValueChange={(value) => 
                      setResponse(prev => ({ ...prev, estimatedTime: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="When can you arrive?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes early</SelectItem>
                        <SelectItem value="0">Right on time</SelectItem>
                        <SelectItem value="-15">15 minutes late</SelectItem>
                        <SelectItem value="-30">30 minutes late</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional notes (optional)
                    </label>
                    <Textarea
                      value={response.notes}
                      onChange={(e) => setResponse(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any questions or comments about this job..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {action === 'decline' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Declining this job</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Please let us know why you can't take this assignment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for declining <span className="text-destructive">*</span>
                    </label>
                    <Select 
                      value={response.declineReason} 
                      onValueChange={(value) => setResponse(prev => ({ ...prev, declineReason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Please select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule_conflict">Schedule conflict</SelectItem>
                        <SelectItem value="too_far">Too far from my location</SelectItem>
                        <SelectItem value="not_available">Not available that day</SelectItem>
                        <SelectItem value="personal_reasons">Personal reasons</SelectItem>
                        <SelectItem value="other">Other (will explain separately)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional details (optional)
                    </label>
                    <Textarea
                      value={response.notes}
                      onChange={(e) => setResponse(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Please provide any additional details..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmitResponse}
                  disabled={responding || (action === 'decline' && !response.declineReason)}
                  className={`w-full ${action === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  size="lg"
                >
                  {responding ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      {action === 'accept' ? (
                        <><CheckCircle className="h-5 w-5 mr-2" /> Accept Job</>
                      ) : (
                        <><XCircle className="h-5 w-5 mr-2" /> Decline Job</>
                      )}
                    </>
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                Having trouble? Contact us at{' '}
                <a href="mailto:support@alphaluxcleaning.com" className="text-primary hover:underline">
                  support@alphaluxcleaning.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; 2024 AlphaLux Cleaning</p>
        </div>
      </div>
    </div>
  );
}