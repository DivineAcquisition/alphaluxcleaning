import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 Payment Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/20 shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Payment System Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Something went wrong with the payment system. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Network connectivity issues</li>
              <li>• Browser security settings blocking payment scripts</li>
              <li>• Temporary payment system maintenance</li>
              <li>• Ad blockers interfering with payment processing</li>
            </ul>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">Troubleshooting Steps:</p>
              <ol className="text-sm text-muted-foreground mt-1 space-y-1 ml-4">
                <li>1. Refresh the page and try again</li>
                <li>2. Disable browser extensions temporarily</li>
                <li>3. Try a different browser or incognito mode</li>
                <li>4. Check your internet connection</li>
              </ol>
            </div>

            {this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  Technical Details (for developers)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}