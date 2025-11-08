import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingCountdownProps {
  expiresAt: number; // timestamp in milliseconds
  onExpire?: () => void;
}

export function BookingCountdown({ expiresAt, onExpire }: BookingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = expiresAt - now;
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        onExpire?.();
        return;
      }
      
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  // Determine urgency level
  const isUrgent = minutes < 3;
  const isWarning = minutes < 5;

  if (isExpired) {
    return (
      <Alert variant="destructive" className="animate-scale-in">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Time slot expired. Please select a new time to continue.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`
      flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all duration-300
      ${isUrgent 
        ? 'bg-destructive/10 border-destructive animate-pulse' 
        : isWarning 
        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500' 
        : 'bg-primary/5 border-primary/20'
      }
    `}>
      <Clock className={`
        h-5 w-5 transition-colors
        ${isUrgent ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-primary'}
      `} />
      
      <div className="flex-1">
        <div className={`
          text-sm font-medium transition-colors
          ${isUrgent ? 'text-destructive' : isWarning ? 'text-yellow-700 dark:text-yellow-400' : 'text-foreground'}
        `}>
          {isUrgent ? '⚠️ Hurry! Time slot expires soon' : 'Complete booking within:'}
        </div>
        <div className={`
          text-2xl font-bold tabular-nums transition-colors
          ${isUrgent ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-primary'}
        `}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {isUrgent && (
        <div className="text-xs text-destructive font-medium animate-fade-in">
          Complete now!
        </div>
      )}
    </div>
  );
}
