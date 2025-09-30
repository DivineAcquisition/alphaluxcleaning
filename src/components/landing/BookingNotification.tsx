import React, { useState, useEffect } from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingNotification {
  name: string;
  location: string;
  timeAgo: string;
}

const notifications: BookingNotification[] = [
  { name: 'Sarah M.', location: 'Dallas, TX', timeAgo: '2 minutes ago' },
  { name: 'Michael C.', location: 'Plano, TX', timeAgo: '5 minutes ago' },
  { name: 'Jennifer R.', location: 'Irving, TX', timeAgo: '8 minutes ago' },
  { name: 'David L.', location: 'Frisco, TX', timeAgo: '12 minutes ago' },
  { name: 'Amanda K.', location: 'McKinney, TX', timeAgo: '15 minutes ago' }
];

export function BookingNotification() {
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(notifications[0]);

  useEffect(() => {
    // Show notification after initial delay
    const initialDelay = setTimeout(() => {
      setVisible(true);
    }, 3000);

    // Cycle through notifications
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentNotification(prev => {
          const currentIndex = notifications.indexOf(prev);
          return notifications[(currentIndex + 1) % notifications.length];
        });
        setVisible(true);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 z-50 transition-all duration-500 transform',
        visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      )}
    >
      <div className="bg-card border border-border rounded-lg shadow-premium p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">
              {currentNotification.name} just booked!
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>{currentNotification.location}</span>
              <span className="mx-1">•</span>
              <span>{currentNotification.timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
