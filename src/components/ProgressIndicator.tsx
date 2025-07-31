import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProgressStep {
  id: number;
  title: string;
  description: string;
  status: 'upcoming' | 'current' | 'completed';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
}

export default function ProgressIndicator({ steps, currentStep, className = "" }: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className={`flex items-center space-x-3 ${
              index < steps.length - 1 ? 'pr-4 md:pr-8' : ''
            }`}>
              <div className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${step.status === 'completed' 
                    ? 'border-success bg-success text-success-foreground animate-scale-in' 
                    : step.status === 'current' 
                      ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25' 
                      : 'border-muted-foreground text-muted-foreground'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="text-center">
                  <div className={`text-sm font-medium transition-colors ${
                    step.status === 'current' 
                      ? 'text-primary' 
                      : step.status === 'completed' 
                        ? 'text-success' 
                        : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground max-w-[100px] hidden md:block">
                    {step.description}
                  </div>
                </div>

                {/* Current Step Badge */}
                {step.status === 'current' && (
                  <Badge variant="outline" className="animate-fade-in bg-primary/10 border-primary/20 text-primary">
                    Active
                  </Badge>
                )}
              </div>
            </div>

            {/* Arrow Connector */}
            {index < steps.length - 1 && (
              <ArrowRight className={`h-4 w-4 transition-colors hidden md:block ${
                step.status === 'completed' ? 'text-success' : 'text-muted-foreground'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}