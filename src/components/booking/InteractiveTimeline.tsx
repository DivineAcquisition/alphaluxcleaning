import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  id: number;
  title: string;
  description: string;
}

interface InteractiveTimelineProps {
  steps: TimelineStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full hidden lg:block">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= currentStep && onStepClick;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "relative flex flex-col items-center text-center transition-all duration-300",
                isClickable && "cursor-pointer hover:scale-105"
              )}
            >
              {/* Step circle */}
              <div className={cn(
                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 border-2",
                isCompleted && "bg-primary border-primary text-primary-foreground",
                isCurrent && "bg-primary border-primary text-primary-foreground scale-110 shadow-lg",
                !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{step.id}</span>
                )}
              </div>

              {/* Step info */}
              <div className="space-y-1">
                <div className={cn(
                  "font-semibold text-sm transition-colors",
                  (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className={cn(
                  "text-xs transition-colors hidden sm:block",
                  (isCurrent || isCompleted) ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {step.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
