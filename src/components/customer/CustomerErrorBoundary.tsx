import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, Phone, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isOnline: boolean;
  retryCount: number;
}

class CustomerErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isOnline: navigator.onLine,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Customer portal error boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error for monitoring
    try {
      fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleContactSupport = () => {
    window.location.href = 'tel:(281) 809-9901';
  };

  private getErrorType = (): string => {
    if (!this.state.isOnline) return 'connection';
    if (this.state.error?.message.includes('Supabase') || this.state.error?.message.includes('database')) return 'database';
    if (this.state.error?.message.includes('payment') || this.state.error?.message.includes('stripe')) return 'payment';
    if (this.state.error?.message.includes('auth')) return 'authentication';
    return 'general';
  };

  private getErrorMessage = (): { title: string; description: string; suggestions: string[] } => {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'connection':
        return {
          title: 'Connection Issue',
          description: 'It looks like you\'re offline or having connection problems.',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page when back online',
            'Contact support if the issue persists'
          ]
        };
      case 'database':
        return {
          title: 'Data Loading Error',
          description: 'We\'re having trouble loading your data right now.',
          suggestions: [
            'This is usually temporary',
            'Try refreshing the page',
            'Your data is safe and will be restored'
          ]
        };
      case 'payment':
        return {
          title: 'Payment System Error',
          description: 'There\'s an issue with the payment system.',
          suggestions: [
            'Your payment information is secure',
            'No charges were processed',
            'Contact support for immediate help'
          ]
        };
      case 'authentication':
        return {
          title: 'Authentication Error',
          description: 'There\'s an issue with your login session.',
          suggestions: [
            'Try logging out and back in',
            'Clear your browser cache',
            'Contact support if issues continue'
          ]
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred in the customer portal.',
          suggestions: [
            'Try refreshing the page',
            'This is usually a temporary issue',
            'Contact support if the problem continues'
          ]
        };
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorInfo = this.getErrorMessage();
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                {errorInfo.title}
              </CardTitle>
              <CardDescription>
                {errorInfo.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <Alert>
                <div className="flex items-center gap-2">
                  {this.state.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    Connection: {this.state.isOnline ? 'Online' : 'Offline'}
                  </AlertDescription>
                </div>
              </Alert>

              {/* Error Details (Development) */}
              {import.meta.env.DEV && this.state.error && (
                <Alert>
                  <AlertDescription className="font-mono text-xs">
                    {this.state.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggestions */}
              <div>
                <h4 className="font-semibold mb-2">What you can try:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry ? (
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                ) : (
                  <Button onClick={this.handleReload} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                
                <Button variant="outline" onClick={this.handleContactSupport} className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
              </div>

              {/* Support Info */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                <p>Need immediate help? Call us at <strong>(281) 809-9901</strong></p>
                <p className="mt-1">Our support team is available to assist you</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CustomerErrorBoundary;