import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypeformStepProps {
  children: React.ReactNode;
  questionNumber: number;
  totalSteps: number;
  isActive: boolean;
  className?: string;
}

export function TypeformStep({ 
  children, 
  questionNumber, 
  totalSteps,
  isActive,
  className 
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
        "min-h-screen w-full flex items-center justify-center p-4 md:p-8",
        "transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <div className="w-full max-w-3xl space-y-8">
        {/* Question Number Badge */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">{questionNumber}</span>
          </div>
          <div className="h-0.5 flex-1 bg-border">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${(questionNumber / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{questionNumber} of {totalSteps}</span>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
