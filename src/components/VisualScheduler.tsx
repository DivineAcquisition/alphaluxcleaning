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
    console.log('VisualScheduler component mounted');
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
        <div className="bg-white rounded-lg p-8 shadow-inner text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold">Booking System Temporarily Unavailable</p>
            <p className="text-sm text-gray-600 mt-2">
              The GoHighLevel booking widget is currently returning a 404 error.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Alternative Booking Options:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>📞 Call: (555) 123-4567</p>
              <p>✉️ Email: booking@bayareacleaningpros.com</p>
              <p>🕐 Business Hours: 8 AM - 6 PM</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            URL tested: https://app.bayareacleaningpros.com/widget/booking/39tuCeWMXzsnqMcYpkCD
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualScheduler;