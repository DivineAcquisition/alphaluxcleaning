import { Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function BookingProgressBar({ currentStep, totalSteps }: BookingProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Logo and Call Button Header */}
        <div className="flex items-center justify-between mb-4">
          <a href="/" className="flex items-center">
            <img src={logo} alt="AlphaLux Cleaning" className="h-8 md:h-10" />
          </a>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://alphaluxclean.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Visit Website</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="tel:+18577544557" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">(857) 754-4557</span>
              </a>
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
