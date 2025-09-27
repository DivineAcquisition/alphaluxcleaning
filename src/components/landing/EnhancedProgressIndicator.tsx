import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface EnhancedProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
}

export function EnhancedProgressIndicator({ steps, currentStep, className }: EnhancedProgressIndicatorProps) {
  const completionPercentage = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Fast Booking Message */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2 text-sm">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-primary font-medium">Fast 2-minute booking process</span>
          <span className="text-muted-foreground">• {completionPercentage}% complete</span>
        </div>
      </div>

      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className={cn(
                  "flex flex-col items-center relative z-10",
                  index === 0 ? "items-start" : index === steps.length - 1 ? "items-end" : "items-center"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300",
                    isCompleted 
                      ? "bg-success border-success text-success-foreground" 
                      : isCurrent 
                        ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                        : "bg-background border-border text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Step Text */}
                  <div className={cn(
                    "text-center max-w-24",
                    index === 0 ? "text-left" : index === steps.length - 1 ? "text-right" : "text-center"
                  )}>
                    <p className={cn(
                      "text-xs font-medium leading-tight",
                      isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative">
                    <div className="absolute inset-0 bg-border" />
                    <div 
                      className={cn(
                        "absolute inset-0 bg-gradient-to-r transition-all duration-500",
                        isCompleted 
                          ? "from-success to-success w-full" 
                          : isCurrent 
                            ? "from-primary to-primary/30 w-1/2" 
                            : "w-0"
                      )} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Step {currentStep} of {steps.length}</span>
          <span className="text-sm text-muted-foreground">{completionPercentage}% complete</span>
        </div>
        
        {/* Progress Track */}
        <div className="w-full bg-border rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-primary to-success h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        {/* Current Step Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          {(() => {
            const currentStepInfo = steps.find(s => s.id === currentStep);
            if (!currentStepInfo) return null;
            const StepIcon = currentStepInfo.icon;
            return (
              <>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <StepIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{currentStepInfo.title}</p>
                  <p className="text-xs text-muted-foreground">{currentStepInfo.description}</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}