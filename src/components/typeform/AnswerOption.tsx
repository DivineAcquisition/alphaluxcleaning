import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnswerOptionProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  badge?: string;
  autoAdvance?: boolean;
  delay?: number;
}

export function AnswerOption({ 
  label, 
  description, 
  icon, 
  isSelected, 
  onClick,
  badge,
  autoAdvance = true,
  delay = 600
}: AnswerOptionProps) {
  const handleClick = () => {
    onClick();
    if (autoAdvance && !isSelected) {
      // Auto-advance to next question after selection
      setTimeout(() => {
        const nextButton = document.querySelector('[data-next-button]') as HTMLButtonElement;
        if (nextButton) {
          nextButton.click();
        }
      }, delay);
    }
  };

  return (
    <Card
      className={cn(
        "relative p-6 cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] hover:border-primary/50",
        "active:scale-[0.98]",
        isSelected 
          ? "border-2 border-primary bg-primary/5 shadow-lg" 
          : "border-2 border-border"
      )}
      onClick={handleClick}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
          {badge}
        </div>
      )}

      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
            isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-lg",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {label}
            </h3>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>

        {isSelected && (
          <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 animate-scale-in" />
        )}
      </div>
    </Card>
  );
}
