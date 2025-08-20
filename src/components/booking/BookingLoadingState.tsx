import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calendar, CreditCard, CheckCircle } from 'lucide-react';

interface BookingLoadingStateProps {
  step?: number;
  totalSteps?: number; 
  loadingText?: string;
  showProgress?: boolean;
}

export function BookingLoadingState({ 
  step = 1, 
  totalSteps = 4, 
  loadingText,
  showProgress = true 
}: BookingLoadingStateProps) {
  const progress = (step / totalSteps) * 100;
  
  const getStepIcon = (stepNum: number) => {
    if (stepNum < step) return CheckCircle;
    if (stepNum === step) return Loader2;
    switch (stepNum) {
      case 1: return Calendar;
      case 3: return CreditCard;
      default: return Calendar;
    }
  };

  const getLoadingMessage = () => {
    if (loadingText) return loadingText;
    
    switch (step) {
      case 1: return 'Loading service options...';
      case 2: return 'Checking availability...';
      case 3: return 'Processing payment...';
      case 4: return 'Confirming your booking...';
      default: return 'Loading...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header with Progress */}
      {showProgress && (
        <div className="bg-card border-b sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Step indicators - mobile optimized */}
              <div className="flex items-center justify-center gap-4 md:gap-8">
                {Array.from({ length: totalSteps }, (_, i) => {
                  const stepNum = i + 1;
                  const Icon = getStepIcon(stepNum);
                  const isActive = stepNum === step;
                  const isComplete = stepNum < step;
                  
                  return (
                    <div key={stepNum} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
                          ${isComplete 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : isActive
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-muted text-muted-foreground'
                          }
                        `}>
                          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${isActive ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="text-xs md:text-sm text-center mt-2 hidden md:block">
                          Step {stepNum}
                        </div>
                      </div>
                      
                      {i < totalSteps - 1 && (
                        <div className={`h-0.5 w-4 md:w-8 mx-2 transition-colors ${
                          stepNum < step ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Loading Message */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">{getLoadingMessage()}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your request...
            </p>
          </div>

          {/* Loading Cards */}
          <div className="grid gap-6">
            <Card className="shadow-clean">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-clean">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mobile-specific loading pattern */}
            <div className="md:hidden">
              <Card className="shadow-clean">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Loading Dots Animation */}
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}