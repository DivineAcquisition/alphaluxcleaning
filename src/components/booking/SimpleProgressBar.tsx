import { Check } from 'lucide-react';

interface SimpleProgressBarProps {
  currentStep: number;
}

const STEPS = [
  { number: 1, label: 'Home Details' },
  { number: 2, label: 'Choose Plan' },
  { number: 3, label: 'Confirm & Book' },
];

export function SimpleProgressBar({ currentStep }: SimpleProgressBarProps) {
  return (
    <div className="w-full bg-card border-b border-border py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300
                      ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                      ${isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                      ${isUpcoming ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mt-[-24px]">
                    <div
                      className={`
                        h-full transition-all duration-300
                        ${isCompleted ? 'bg-primary' : 'bg-muted'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
