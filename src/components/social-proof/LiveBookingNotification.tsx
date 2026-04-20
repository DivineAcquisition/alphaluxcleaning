import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin } from 'lucide-react';

interface BookingNotification {
  name: string;
  location: string;
  service: string;
  timeAgo: string;
}

const mockBookings: BookingNotification[] = [
  { name: 'Sarah M.', location: 'Manhattan, NY', service: 'Deep Clean', timeAgo: '2 hours ago' },
  { name: 'Michael R.', location: 'Brooklyn, NY', service: 'Standard Clean', timeAgo: '3 hours ago' },
  { name: 'Jennifer L.', location: 'Queens, NY', service: 'Move-In Clean', timeAgo: '4 hours ago' },
  { name: 'David K.', location: 'Long Island, NY', service: 'Standard Clean', timeAgo: '5 hours ago' },
  { name: 'Emily T.', location: 'Staten Island, NY', service: 'Deep Clean', timeAgo: '6 hours ago' },
  { name: 'Robert P.', location: 'Bronx, NY', service: 'Standard Clean', timeAgo: '7 hours ago' },
];

export function LiveBookingNotification() {
  const [currentBooking, setCurrentBooking] = useState<BookingNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show first notification after 5 seconds
    const initialTimeout = setTimeout(() => {
      showRandomBooking();
    }, 5000);

    // Show new notification every 20 seconds
    const interval = setInterval(() => {
      showRandomBooking();
    }, 20000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const showRandomBooking = () => {
    // Hide current notification
    setIsVisible(false);
    
    // After fade out, show new random booking
    setTimeout(() => {
      const randomBooking = mockBookings[Math.floor(Math.random() * mockBookings.length)];
      setCurrentBooking(randomBooking);
      setIsVisible(true);
      
      // Hide after 8 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 8000);
    }, 300);
  };

  if (!currentBooking) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-500 transform ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm max-w-xs">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle2 className="w-5 h-5 text-success animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm text-foreground">{currentBooking.name}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Booked
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {currentBooking.service}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{currentBooking.location}</span>
                <span>•</span>
                <span>{currentBooking.timeAgo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
