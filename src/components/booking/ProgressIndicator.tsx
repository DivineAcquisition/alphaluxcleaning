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
  return <div className="mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{
          width: `${progress}%`
        }} />
        </div>
      </div>
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-[240px]">
        {steps.map((step, index) => <div key={step.id} className="flex items-center">
            <div className={`flex items-center space-x-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${step.id <= currentStep ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background text-muted-foreground'}
                `}>
                  {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id === currentStep ? step.id : <Circle className="h-4 w-4" />}
                </div>
                <div className="text-center mt-2 hidden sm:block">
                  <div className={`text-sm font-medium ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                  
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${step.id < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
          </div>)}
      </div>
    </div>;
}