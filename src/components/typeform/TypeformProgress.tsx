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
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 md:p-6 z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={!canGoBack || currentStep === 1}
          className={cn(
            "gap-2",
            currentStep === 1 && "invisible"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index < currentStep 
                  ? "w-8 bg-primary" 
                  : index === currentStep 
                    ? "w-12 bg-primary" 
                    : "w-2 bg-border"
              )}
            />
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          disabled={!canGoNext}
          data-next-button
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
