import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface VisualSchedulerProps {
  serviceType?: string;
  isNextDayBooking?: boolean;
  onSlotSelect?: (date: string, time: string) => void;
}

const VisualScheduler: React.FC<VisualSchedulerProps> = ({ 
  serviceType = 'general',
  isNextDayBooking = false,
  onSlotSelect 
}) => {
  
  useEffect(() => {
    // Load the GHL form embed script
    const script = document.createElement('script');
    script.src = 'https://app.bayareacleaningpros.com/js/form_embed.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      console.log('GHL embed script loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load GHL embed script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if it exists
      const existingScript = document.querySelector('script[src="https://app.bayareacleaningpros.com/js/form_embed.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const getServiceDuration = (type: string) => {
    const durations: { [key: string]: number } = {
      'general': 2,
      'deep': 3,
      'move-in': 4,
      'move-out': 4,
      'post-construction': 5,
      'office': 2,
      'apartment': 1.5
    };
    return durations[type] || 2;
  };

  return (
    <Card className="w-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Calendar className="h-6 w-6" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Select your preferred date and time slot. Business hours: 8 AM - 6 PM
        </CardDescription>
        <div className="text-xs text-primary-foreground/60 mt-1 flex items-center justify-center gap-3">
          <span>✓ Live calendar integration</span>
          <span>• Service duration: {getServiceDuration(serviceType)}h</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            GoHighLevel sync
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="bg-white rounded-lg p-4 shadow-inner">
          <iframe 
            src="https://app.bayareacleaningpros.com/widget/booking/39tuCeWMXzsnqMcYpkCD" 
            style={{
              width: '100%',
              border: 'none',
              overflow: 'hidden',
              minHeight: '600px'
            }}
            scrolling="no" 
            id="39tuCeWMXzsnqMcYpkCD_1753729484465"
            title="Bay Area Cleaning Pros Booking Calendar"
            allow="camera; microphone; geolocation"
            onLoad={() => console.log('Iframe loaded successfully')}
            onError={() => console.error('Iframe failed to load')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualScheduler;