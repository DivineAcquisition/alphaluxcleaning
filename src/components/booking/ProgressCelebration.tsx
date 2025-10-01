import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Gift, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProgressCelebrationProps {
  currentStep: number;
  totalSteps: number;
  savings?: number;
}

export function ProgressCelebration({ currentStep, totalSteps, savings = 0 }: ProgressCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    setShowCelebration(true);
    const timer = setTimeout(() => setShowCelebration(false), 2000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const getCelebrationMessage = () => {
    switch (currentStep) {
      case 2:
        return {
          icon: CheckCircle,
          text: 'Great choice!',
          subtext: 'Service area confirmed',
          color: 'text-success'
        };
      case 3:
        return {
          icon: Sparkles,
          text: `You're saving $${savings.toFixed(0)}!`,
          subtext: 'Excellent selections',
          color: 'text-primary'
        };
      case 4:
        return {
          icon: TrendingUp,
          text: 'Almost there!',
          subtext: 'One more step to book',
          color: 'text-warning'
        };
      default:
        return {
          icon: Gift,
          text: 'Looking good!',
          subtext: 'Keep going',
          color: 'text-accent'
        };
    }
  };

  const celebration = getCelebrationMessage();
  const Icon = celebration.icon;

  return (
    <div className="relative mb-6">
      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full gradient-premium transition-all duration-700 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center gap-2 transition-all duration-300',
                isCurrent && 'scale-110'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300',
                  isCompleted && 'bg-success text-white shadow-lg animate-scale-in',
                  isCurrent && 'gradient-premium text-white shadow-premium animate-pulse-glow',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={cn(
                'text-xs font-medium transition-colors',
                (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Step {stepNumber}
              </span>
            </div>
          );
        })}
      </div>

      {/* Celebration Message */}
      {showCelebration && currentStep > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-16 animate-bounce-subtle">
          <Badge className="gradient-premium text-white px-6 py-3 text-base shadow-premium">
            <Icon className={cn("w-5 h-5 mr-2", celebration.color)} />
            <div className="flex flex-col items-start">
              <span className="font-bold">{celebration.text}</span>
              <span className="text-xs text-white/80">{celebration.subtext}</span>
            </div>
          </Badge>
        </div>
      )}
    </div>
  );
}
