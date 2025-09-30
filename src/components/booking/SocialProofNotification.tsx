import React, { useState, useEffect } from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const notifications = [
  { name: "Sarah M.", city: "Austin", service: "Deep Cleaning", time: "5 minutes ago" },
  { name: "James T.", city: "Dallas", service: "Regular Cleaning", time: "12 minutes ago" },
  { name: "Maria G.", city: "Houston", service: "Move-Out Cleaning", time: "18 minutes ago" },
  { name: "David L.", city: "San Antonio", service: "Deep Cleaning", time: "25 minutes ago" },
  { name: "Jennifer K.", city: "Austin", service: "Regular Cleaning", time: "32 minutes ago" },
];

export function SocialProofNotification() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % notifications.length);
        }, 500);
      }, 4000);
    };

    const timer = setInterval(showNotification, 8000);
    showNotification();

    return () => clearInterval(timer);
  }, []);

  const notification = notifications[currentIndex];

  return (
    <div className={cn(
      "fixed bottom-6 left-6 z-50 transition-all duration-500 transform",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
    )}>
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm funnel-card">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {notification.name} just booked
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {notification.service}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{notification.city}</span>
              <span className="mx-1">•</span>
              <span>{notification.time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
