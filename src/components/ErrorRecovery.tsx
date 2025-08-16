import { useState } from 'react';
import { AlertTriangle, RefreshCw, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  onSaveDraft?: () => void;
  lastSaved?: Date | null;
  isRetrying?: boolean;
}

export const ErrorRecovery = ({ 
  error, 
  onRetry, 
  onSaveDraft, 
  lastSaved, 
  isRetrying = false 
}: ErrorRecoveryProps) => {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  const getErrorSuggestion = (error: string): string => {
    if (error.includes('network') || error.includes('fetch')) {
      return 'Check your internet connection and try again.';
    }
    if (error.includes('required field')) {
      return 'Make sure all required fields are filled out completely.';
    }
    if (error.includes('pending application')) {
      return 'You already have an application under review. Please wait for our response.';
    }
    if (error.includes('approved application')) {
      return 'You already have an approved application. Check your email for next steps.';
    }
    if (error.includes('driver\'s license')) {
      return 'Please confirm you have a valid driver\'s license and try again.';
    }
    if (error.includes('vehicle')) {
      return 'Please confirm you have reliable transportation and try again.';
    }
    return 'Please review your information and try submitting again.';
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Application Submission Failed
        </CardTitle>
        <CardDescription>
          Don't worry - your information has been saved and you can try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Suggestion:</strong> {getErrorSuggestion(error)}
          </p>
          {lastSaved && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last auto-saved: {lastSaved.toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : `Try Again${retryCount > 0 ? ` (${retryCount + 1})` : ''}`}
          </Button>
          
          {onSaveDraft && (
            <Button 
              variant="outline" 
              onClick={onSaveDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          )}
        </div>

        {retryCount >= 2 && (
          <Alert>
            <AlertDescription>
              Having trouble? Try refreshing the page or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};