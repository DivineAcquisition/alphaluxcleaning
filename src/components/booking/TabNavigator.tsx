import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabNavigatorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabNavigator: React.FC<TabNavigatorProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-wrap gap-2 p-1 bg-muted/30 rounded-xl",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
            "hover:bg-background/50",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {tab.icon && (
            <span className={cn(
              "transition-colors",
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            )}>
              {tab.icon}
            </span>
          )}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className={cn(
              "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
