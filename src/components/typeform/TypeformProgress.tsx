import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypeformProgressProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
}

export function TypeformProgress({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canGoBack = true,
  canGoNext = true,
  nextLabel = 'Continue'
}: TypeformProgressProps) {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Mobile & Desktop: Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={onBack}
            disabled={!canGoBack || currentStep === 1}
            className={cn(
              "gap-2 touch-manipulation sm:px-8 px-4 flex-1 sm:flex-initial",
              currentStep === 1 && "invisible"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Next Button */}
          <Button
            variant="default"
            size="lg"
            onClick={onNext}
            disabled={!canGoNext}
            data-next-button
            className="gap-2 touch-manipulation bg-primary hover:bg-primary/90 sm:px-8 px-4 flex-1 sm:flex-initial"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
