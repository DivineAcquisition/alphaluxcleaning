import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PricingView = 'clean' | 'hour' | 'day';

interface PricingViewToggleProps {
  selectedView: PricingView;
  onViewChange: (view: PricingView) => void;
  frequency: string;
}

export function PricingViewToggle({ selectedView, onViewChange, frequency }: PricingViewToggleProps) {
  // Don't show toggle for one-time (only per-clean makes sense)
  if (frequency === 'one_time') {
    return null;
  }
  
  const views: { value: PricingView; label: string }[] = [
    { value: 'clean', label: 'Per Clean' },
    { value: 'hour', label: 'Per Hour' },
    { value: 'day', label: 'Per Day' },
  ];
  
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {views.map((view) => (
        <Button
          key={view.value}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(view.value)}
          className={cn(
            'flex-1 h-8 text-xs font-medium transition-all',
            selectedView === view.value
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          )}
        >
          {view.label}
        </Button>
      ))}
    </div>
  );
}
