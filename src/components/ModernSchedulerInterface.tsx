import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  ArrowRight, 
  Loader2, 
  Phone,
  Sparkles,
  CalendarDays,
  Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ModernSchedulerProps {
  orderId?: string;
  sessionId?: string;
  serviceType?: string;
  onComplete?: (data: { scheduled_date: string; scheduled_time: string }) => void;
}

interface TimeSlot {
  value: string;
  label: string;
  range: string;
  popular: boolean;
  available: boolean;
}

interface DateOption {
  value: string;
  day: number;
  month: string;
  weekday: string;
  fullDate: string;
  isSelected: boolean;
}

const ModernSchedulerInterface: React.FC<ModernSchedulerProps> = ({ 
  orderId,
  sessionId,
  serviceType = 'general',
  onComplete
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'confirm'>('date');

  const timeSlots: TimeSlot[] = [
    { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM', popular: false, available: true },
    { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM', popular: true, available: true },
    { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM', popular: true, available: true },
    { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM', popular: false, available: true },
    { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM', popular: false, available: true },
    { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM', popular: true, available: true },
    { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM', popular: true, available: true },
    { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM', popular: false, available: true },
    { value: '4:00 PM', label: '4:00 PM', range: '4:00 - 6:00 PM', popular: false, available: true }
  ];

  const generateDates = (): DateOption[] => {
    const dates = [];
    const today = new Date();
    
    for (let i = 5; i <= 26; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push({
          value: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          isSelected: false
        });
      }
      
      if (dates.length >= 14) break;
    }
    
    return dates;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔄 Submitting scheduling request:', { 
        selectedDate, 
        selectedTime, 
        orderId, 
        sessionId 
      });

      const updateData = {
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        service_details: {
          scheduling: {
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            bookedAt: new Date().toISOString()
          }
        }
      };

      const { data, error } = await supabase.functions.invoke('update-order-details', {
        body: { 
          session_id: sessionId, 
          order_id: orderId,
          ...updateData
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to update order');
      }

      // Send confirmation and webhooks in parallel
      const promises = [
        supabase.functions.invoke('send-order-confirmation', {
          body: { 
            orderId: orderId,
            sessionId: sessionId,
            isSchedulingConfirmation: true
          }
        }),
        supabase.functions.invoke('sync-ghl-contacts', {
          body: {
            action: 'create_booking_contact',
            customerName: data?.customer_name || 'Customer',
            customerEmail: data?.customer_email || '',
            customerPhone: data?.customer_phone || '',
            serviceType: data?.service_details?.service_type || 'General Cleaning',
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            address: data?.address,
            orderId: orderId,
            estimatedValue: (data?.amount || 0) / 100
          }
        })
      ];

      // Don't wait for these - they can happen in background
      Promise.allSettled(promises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`Background operation ${index} failed:`, result.reason);
          }
        });
      });

      toast.success('Your scheduling request has been submitted successfully!');

      // Navigate to order status page
      const currentOrderId = orderId || localStorage.getItem('current_order_id');
      if (currentOrderId) {
        window.location.href = `/order-status?order_id=${currentOrderId}`;
      } else if (sessionId) {
        window.location.href = `/order-status?session_id=${sessionId}`;
      } else if (onComplete) {
        onComplete({
          scheduled_date: selectedDate,
          scheduled_time: selectedTime
        });
      }
    } catch (error) {
      console.error('❌ Scheduling error:', error);
      toast.error('Failed to submit scheduling request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dates = generateDates();
  const selectedDateObj = dates.find(d => d.value === selectedDate);
  const selectedTimeObj = timeSlots.find(t => t.value === selectedTime);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-full transition-all",
          currentStep === 'date' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}>
          <CalendarDays className="h-4 w-4" />
          <span className="font-medium">Date</span>
        </div>
        <div className="h-px bg-border flex-1 max-w-8" />
        <div className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-full transition-all",
          currentStep === 'time' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}>
          <Timer className="h-4 w-4" />
          <span className="font-medium">Time</span>
        </div>
        <div className="h-px bg-border flex-1 max-w-8" />
        <div className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-full transition-all",
          currentStep === 'confirm' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}>
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Confirm</span>
        </div>
      </div>

      {/* Important Notice */}
      <Alert className="border-amber-200 bg-amber-50 mb-6">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <span className="font-semibold">Scheduling Request:</span> Your selection is a request. 
          We'll contact you within 2 hours to confirm availability.
        </AlertDescription>
      </Alert>

      {/* Date Selection */}
      {(!selectedDate || currentStep === 'date') && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Choose Your Date
              </h2>
              <p className="text-muted-foreground">
                Select your preferred service date (5+ days in advance)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {dates.map((date) => (
                <Button
                  key={date.value}
                  variant={selectedDate === date.value ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDate(date.value);
                    setCurrentStep('time');
                  }}
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-1 text-center transition-all duration-200",
                    selectedDate === date.value 
                      ? "bg-primary text-white shadow-lg scale-105" 
                      : "hover:scale-105 hover:shadow-md"
                  )}
                >
                  <span className="text-xs font-medium opacity-75">{date.weekday}</span>
                  <span className="text-lg font-bold">{date.day}</span>
                  <span className="text-xs opacity-75">{date.month}</span>
                </Button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need same-day or next-day service? 
                <Button variant="link" className="p-0 ml-1 h-auto text-sm" asChild>
                  <a href="tel:+12818099901">Call (281) 809-9901</a>
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Selection */}
      {selectedDate && (!selectedTime || currentStep === 'time') && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Choose Your Time
              </h2>
              <p className="text-muted-foreground">
                Select your preferred 2-hour service window for <span className="font-medium">{selectedDateObj?.fullDate}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.value}
                  variant={selectedTime === slot.value ? "default" : "outline"}
                  onClick={() => {
                    setSelectedTime(slot.value);
                    setCurrentStep('confirm');
                  }}
                  disabled={!slot.available}
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200",
                    selectedTime === slot.value 
                      ? "bg-primary text-white shadow-lg scale-105" 
                      : "hover:scale-105 hover:shadow-md",
                    !slot.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{slot.label}</span>
                    {slot.popular && slot.available && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <span className="text-xs opacity-75">{slot.range}</span>
                  {slot.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-red-500 font-medium">Unavailable</span>
                  )}
                </Button>
              ))}
            </div>

            {selectedDate && (
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setCurrentStep('date');
                    setSelectedTime('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Change Date
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation */}
      {selectedDate && selectedTime && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Confirm Your Request
              </h2>
              <p className="text-muted-foreground">
                Review your selection before submitting
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm mb-8 space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Service Date:</span>
                <span className="font-semibold">{selectedDateObj?.fullDate}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Service Time:</span>
                <div className="text-right">
                  <span className="font-semibold">{selectedTime}</span>
                  <div className="text-sm text-muted-foreground">{selectedTimeObj?.range}</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">Service Window:</span>
                <span className="font-semibold">2 hours</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Scheduling Request
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('date');
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('time');
                    setSelectedTime('');
                  }}
                  className="flex-1"
                >
                  Change Time
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We'll contact you within 2 hours to confirm availability
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Questions? Call (281) 809-9901</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernSchedulerInterface;