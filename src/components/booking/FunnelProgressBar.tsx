import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  savingsAmount?: number;
}

export function FunnelProgressBar({ currentStep, totalSteps, stepLabels, savingsAmount }: FunnelProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-primary/50 animate-pulse" />
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between relative">
          {stepLabels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 mb-2",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground animate-pulse-glow",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-xs text-center transition-colors hidden sm:block",
                  (isCompleted || isCurrent) ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Savings Indicator */}
        {savingsAmount && savingsAmount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-funnel-success animate-slide-in-up">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">
              You're saving ${savingsAmount.toFixed(2)} with this booking!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
