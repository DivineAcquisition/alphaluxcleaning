import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
interface Step {
  id: number;
  title: string;
  description: string;
}
interface ProgressIndicatorProps {
  currentStep: number;
  steps: Step[];
}
export function ProgressIndicator({
  currentStep,
  steps
}: ProgressIndicatorProps) {
  const progress = currentStep / steps.length * 100;
  
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center space-x-3 ${
              index < steps.length - 1 ? 'pr-4 md:pr-8' : ''
            }`}>
              <div className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${step.id <= currentStep 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                  }
                `}>
                  {step.id <= currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </div>
                
                <div className="text-center">
                  <div className={`text-sm font-medium transition-colors ${
                    step.id <= currentStep 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground max-w-[100px] hidden md:block">
                    {step.description}
                  </div>
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={`h-px w-8 transition-colors ${
                step.id < currentStep ? 'bg-primary' : 'bg-muted-foreground'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}