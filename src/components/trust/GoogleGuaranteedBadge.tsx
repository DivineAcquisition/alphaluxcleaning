import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleGuaranteedBadgeProps {
  variant?: 'compact' | 'standard' | 'large';
  showSubtitle?: boolean;
  className?: string;
}

export function GoogleGuaranteedBadge({ 
  variant = 'standard', 
  showSubtitle = true,
  className 
}: GoogleGuaranteedBadgeProps) {
  
  if (variant === 'compact') {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg",
        className
      )}>
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span className="text-xs font-semibold text-green-700 dark:text-green-300">
          Google Guaranteed
        </span>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className={cn(
        "bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-6",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full flex-shrink-0">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">
              Google Guaranteed
            </h3>
            <p className="text-sm text-muted-foreground">
              Your service is backed by Google's guarantee for added peace of mind. 
              We meet Google's strict standards for quality and customer satisfaction.
            </p>
            {showSubtitle && (
              <p className="text-xs font-medium text-green-600">
                Coverage up to $2,000
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div className={cn(
      "inline-flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg",
      className
    )}>
      <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
      <div>
        <div className="text-sm font-bold text-green-700 dark:text-green-300">
          Google Guaranteed
        </div>
        {showSubtitle && (
          <div className="text-xs text-muted-foreground">
            Backed by Google's guarantee
          </div>
        )}
      </div>
    </div>
  );
}
