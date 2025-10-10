import { cn } from '@/lib/utils';

interface ChatProgressBarProps {
  current: number;
  total: number;
}

export function ChatProgressBar({ current, total }: ChatProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2 animate-fade-in mb-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {current} of {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full bg-primary rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
