import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TypeformProgress } from './TypeformProgress';

interface TypeformStepProps {
  children: React.ReactNode;
  questionNumber: number;
  totalSteps: number;
  isActive: boolean;
  className?: string;
  onBack?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
}

export function TypeformStep({ 
  children, 
  questionNumber, 
  totalSteps,
  isActive,
  className,
  onBack,
  onNext,
  canGoBack = true,
  canGoNext = true,
  nextLabel = 'Continue'
}: TypeformStepProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(false);
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "min-h-screen w-full flex items-center justify-center p-4 md:p-8 pb-40 safe-area-pb",
        "transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <div className="w-full max-w-3xl space-y-8">
        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Navigation */}
        <TypeformProgress
          currentStep={questionNumber}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={onNext}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
