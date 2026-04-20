import { Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Official AlphaLux Cleaning lockup pulled from alphaluxcleaning.com
const logo = '/brand/alphalux-logo.png';

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function BookingProgressBar({ currentStep, totalSteps }: BookingProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 bg-alx-black-ink text-alx-gold-pale border-b border-alx-gold/20 shadow-soft">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Logo and Call Button Header */}
        <div className="flex items-center justify-between mb-4">
          <a href="/" className="flex items-center">
            <img
              src={logo}
              alt="AlphaLux Cleaning"
              className="h-9 md:h-11 w-auto object-contain drop-shadow-[0_0_18px_rgba(161,121,56,0.35)]"
            />
          </a>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="btn-alx-outline-gold rounded-full border-alx-gold/60"
              asChild
            >
              <a
                href="https://alphaluxcleaning.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Visit Website</span>
              </a>
            </Button>
            <Button
              size="sm"
              className="btn-alx-gold rounded-full border-0"
              asChild
            >
              <a
                href="tel:+18577544557"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">(857) 754-4557</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-alx-gold-pale/80">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-semibold text-alx-gold-light">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-alx-black-elev rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-gold transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
