import React from 'react';
import { cn } from '@/lib/utils';

interface FloatingPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sticky' | 'elevated';
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  className,
  variant = 'default',
  title,
  subtitle,
  icon
}) => {
  return (
    <div className={cn(
      "bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg transition-all duration-300",
      variant === 'sticky' && "lg:sticky lg:top-6",
      variant === 'elevated' && "shadow-xl hover:shadow-2xl hover:-translate-y-1",
      className
    )}>
      {(title || icon) && (
        <div className="flex items-start gap-4 mb-6 pb-4 border-b border-border/50">
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-xl font-bold text-foreground mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
