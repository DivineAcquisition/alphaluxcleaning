import { Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Use the same square brand mark that the BrandedLoader full-page
// loader and the top navbar display, so the booking flow's
// progress-bar header keeps the same visual identity.
const logo = '/brand/alphalux-mark.png';

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function BookingProgressBar({ currentStep, totalSteps }: BookingProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 bg-muted text-foreground border-b border-border shadow-sm bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Logo and Call Button Header */}
        <div className="flex items-center justify-between mb-4">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="AlphaLux Cleaning"
              width="44"
              height="44"
              className="h-9 w-9 md:h-11 md:w-11 rounded-lg object-cover shadow-[0_4px_18px_rgba(0,0,0,0.25)] ring-1 ring-primary/15 transition group-hover:ring-primary/35"
            />
            <span className="font-serif text-base md:text-lg font-semibold tracking-wide text-foreground leading-none whitespace-nowrap hidden sm:inline-block">
              AlphaLux <span className="text-primary">Clean</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
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
              className="rounded-full"
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
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
