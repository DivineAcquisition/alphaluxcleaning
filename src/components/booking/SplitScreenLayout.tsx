import React from 'react';
import { cn } from '@/lib/utils';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
  className?: string;
  reverse?: boolean;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftPanelClassName,
  rightPanelClassName,
  className,
  reverse = false
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[600px]",
      className
    )}>
      <div className={cn(
        "space-y-6",
        reverse && "lg:order-2",
        leftPanelClassName
      )}>
        {leftPanel}
      </div>
      <div className={cn(
        "space-y-6",
        reverse && "lg:order-1",
        rightPanelClassName
      )}>
        {rightPanel}
      </div>
    </div>
  );
};
