import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, AlertCircle, Zap, Star, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SlotTakenDialog from './SlotTakenDialog';

interface ModernSchedulerProps {
  serviceType?: string;
  sessionId?: string;
  onComplete?: (data: { scheduled_date: string; scheduled_time: string }) => void;
}

const ModernScheduler: React.FC<ModernSchedulerProps> = ({ 
  serviceType = 'general',
  sessionId,
  onComplete
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [nextDayUpsell, setNextDayUpsell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<{[key: string]: {[key: string]: boolean}}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [calendarSource, setCalendarSource] = useState<string>('unknown');
  const [showSlotTakenDialog, setShowSlotTakenDialog] = useState(false);
  const [attemptedSlot, setAttemptedSlot] = useState({ date: '', time: '' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');

  const timeSlots = [
    { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM', popular: false },
    { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM', popular: true },
    { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM', popular: true },
    { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM', popular: false },
    { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM', popular: false },
    { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM', popular: true },
    { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM', popular: true },
    { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM', popular: false },
    { value: '4:00 PM', label: '4:00 PM', range: '4:00 - 6:00 PM', popular: false }
  ];

  // Generate next 14 days (excluding Sundays)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push({
          value: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: false,
          isTomorrow: i === 1
        });
      }
      
      if (dates.length >= 14) break; // Limit to 14 selectable days
    }
    
    return dates;
  };

  const checkDateAvailability = async (date: string, isPollingUpdate = false) => {
    if (!date || (availabilityData[date] && !isPollingUpdate)) return;
    
    console.log('Checking availability for date:', date, 'polling:', isPollingUpdate);
    if (!isPollingUpdate) setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-live-availability', {
        body: { 
          date,
          slot_duration: 120, // 2 hours
          working_hours: {
            start: '08:00',
            end: '18:00'
          }
        }
      });
      
      console.log('Live availability response:', { data, error });
      
      if (error) {
        console.error('Error checking availability:', error);
        setConnectionStatus('error');
        // Default to all available on error
        const timeSlotValues = timeSlots.map(slot => slot.value);
        const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
          acc[timeValue] = true;
          return acc;
        }, {} as {[key: string]: boolean});
        
        setAvailabilityData(prev => ({ ...prev, [date]: defaultAvailability }));
        setCalendarSource('error');
        
        if (!isPollingUpdate) {
          toast.error('Failed to check calendar availability. Showing all slots as available.');
        }
      } else {
        const availableSlots = data?.available_slots || [];
        console.log('Available slots from API:', availableSlots);
        
        // Update connection status
        if (data?.status === 'google_calendar') {
          setConnectionStatus('connected');
          setCalendarSource('google');
        } else if (data?.status === 'mock_data') {
          setConnectionStatus('disconnected');
          setCalendarSource('mock');
        } else {
          setConnectionStatus('error');
          setCalendarSource(data?.status || 'unknown');
        }
        
        // Convert 24-hour API format to 12-hour display format
        const convertTo12Hour = (time24: string) => {
          const [hours, minutes] = time24.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${hour12}:${minutes} ${ampm}`;
        };
        
        // Create availability map based on our time slots
        const availabilityMap = timeSlots.reduce((acc: {[key: string]: boolean}, slot) => {
          // Extract hour from display format (e.g., "9:00 AM" -> "09:00")
          const displayTime = slot.value;
          const [time, period] = displayTime.split(' ');
          const [hour, minute] = time.split(':');
          let hour24 = parseInt(hour);
          if (period === 'PM' && hour24 !== 12) hour24 += 12;
          if (period === 'AM' && hour24 === 12) hour24 = 0;
          const time24 = `${hour24.toString().padStart(2, '0')}:${minute}`;
          
          // Check if this time slot is available
          const isAvailable = availableSlots.some((apiSlot: any) => {
            return apiSlot.start === time24 && apiSlot.available;
          });
          
          acc[slot.value] = isAvailable;
          return acc;
        }, {});
        
        console.log('Availability map:', availabilityMap);
        setAvailabilityData(prev => ({ ...prev, [date]: availabilityMap }));
        setLastUpdated(new Date());
        
        if (isPollingUpdate) {
          console.log('Availability updated via polling');
        }
      }
    } catch (error) {
      console.error('Error checking date availability:', error);
      setConnectionStatus('error');
      // Default to all available on error
      const timeSlotValues = timeSlots.map(slot => slot.value);
      const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
        acc[timeValue] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setAvailabilityData(prev => ({ ...prev, [date]: defaultAvailability }));
      setCalendarSource('error');
      
      if (!isPollingUpdate) {
        toast.error('Failed to connect to calendar. Showing all slots as available.');
      }
    } finally {
      if (!isPollingUpdate) setIsCheckingAvailability(false);
    }
  };

  // Polling mechanism for live updates
  useEffect(() => {
    if (!selectedDate || nextDayUpsell) return;
    
    const interval = setInterval(() => {
      checkDateAvailability(selectedDate, true);
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedDate, nextDayUpsell]);

  useEffect(() => {
    if (selectedDate && !nextDayUpsell) {
      checkDateAvailability(selectedDate);
    }
  }, [selectedDate, nextDayUpsell]);

  useEffect(() => {
    if (nextDayUpsell) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];
      setSelectedDate(tomorrowISO);
      checkDateAvailability(tomorrowISO);
    }
  }, [nextDayUpsell]);

  const isTimeSlotAvailable = (time: string) => {
    const checkDate = nextDayUpsell ? 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
      selectedDate;
    
    if (!checkDate || !availabilityData[checkDate]) {
      console.log('No availability data for:', checkDate);
      return true; // Default to available
    }
    
    const isAvailable = availabilityData[checkDate][time] !== false;
    console.log(`Time ${time} on ${checkDate} is available:`, isAvailable);
    return isAvailable;
  };

  const createGoogleCalendarEvent = async (date: string, time: string) => {
    try {
      console.log('Creating Google Calendar event for:', { date, time });
      
      const { data, error } = await supabase.functions.invoke('create-google-calendar-event', {
        body: {
          date,
          time,
          serviceType,
          sessionId,
          duration: 2 // 2 hours default
        }
      });

      if (error) {
        console.error('Error creating calendar event:', error);
        // Don't block the booking if calendar creation fails
        toast.error('Booking saved but calendar event creation failed');
      } else {
        console.log('Calendar event created successfully:', data);
        toast.success('Appointment scheduled and added to calendar!');
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      // Don't block the booking if calendar creation fails
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update order in database
      if (sessionId) {
        await supabase
          .from("orders")
          .update({
            scheduled_date: selectedDate,
            scheduled_time: selectedTime,
            service_details: {
              scheduling: {
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
                nextDayUpsell: nextDayUpsell,
                nextDayFee: nextDayUpsell ? 50 : 0,
                bookedAt: new Date().toISOString()
              }
            }
          })
          .eq("stripe_session_id", sessionId);

        if (nextDayUpsell) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("amount")
            .eq("stripe_session_id", sessionId)
            .single();

          if (orderData) {
            await supabase
              .from("orders")
              .update({ amount: orderData.amount + 5000 })
              .eq("stripe_session_id", sessionId);
          }
        }
      }

      // Create Google Calendar event
      await createGoogleCalendarEvent(selectedDate, selectedTime);
      
      // Call completion callback instead of navigating
      if (onComplete) {
        onComplete({
          scheduled_date: selectedDate,
          scheduled_time: selectedTime
        });
      } else if (sessionId) {
        navigate(`/service-details?session_id=${sessionId}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      toast.error('Failed to schedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dates = generateDates();

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Schedule Your Service</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Choose your preferred date and time for your {serviceType} cleaning</p>
        
        {/* Enhanced Connection Status */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 p-2 rounded-lg border">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'checking' || isCheckingAvailability ? 'bg-yellow-400 animate-pulse' :
              connectionStatus === 'disconnected' ? 'bg-orange-400' :
              'bg-red-400'
            }`} />
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Google Calendar Connected' :
               connectionStatus === 'checking' || isCheckingAvailability ? 'Checking availability...' :
               connectionStatus === 'disconnected' ? 'Using mock data' :
               'Calendar error - showing all available'}
            </span>
          </div>
          
          {lastUpdated && connectionStatus === 'connected' && (
            <div className="text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {connectionStatus === 'disconnected' && (
          <p className="text-xs text-orange-600">
            Connect your Google Calendar above for live availability
          </p>
        )}
      </div>

      {/* Next Day Upsell */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mt-1" />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-semibold">Need it tomorrow?</h3>
                <Badge variant="destructive" className="text-xs sm:text-sm w-fit">+$50</Badge>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                Get priority scheduling for tomorrow with our expedited service
              </p>
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nextDayUpsell}
                  onChange={(e) => {
                    setNextDayUpsell(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedTime('');
                      setSelectedDate('');
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm sm:text-base font-medium">Yes, schedule for tomorrow (+$50)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      {!nextDayUpsell && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {dates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={cn(
                    "p-2 sm:p-3 rounded-lg border text-center transition-all text-xs sm:text-sm",
                    "hover:border-primary hover:bg-primary/5",
                    selectedDate === date.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{date.weekday}</div>
                  <div className="text-xs sm:text-sm font-medium">{date.month}</div>
                  <div className="text-sm sm:text-lg font-bold">{date.day}</div>
                  {date.isTomorrow && (
                    <div className="text-xs text-orange-500 font-medium">Tomorrow</div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Selection */}
      {(selectedDate || nextDayUpsell) && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Select Time
              </div>
              {nextDayUpsell && <Badge variant="secondary" className="w-fit">Tomorrow</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {timeSlots.map((slot) => {
                const available = isTimeSlotAvailable(slot.value);
                return (
                  <button
                    key={slot.value}
                    onClick={() => {
                      if (available) {
                        setSelectedTime(slot.value);
                      } else {
                        // Show popup for unavailable slot
                        setAttemptedSlot({ 
                          date: nextDayUpsell ? 
                            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                            selectedDate, 
                          time: slot.value 
                        });
                        setShowSlotTakenDialog(true);
                      }
                    }}
                    disabled={!available}
                    className={cn(
                      "p-3 sm:p-4 rounded-lg border text-left transition-all",
                      !available && "opacity-50 cursor-not-allowed bg-gray-100",
                      available && "hover:border-primary hover:bg-primary/5",
                      selectedTime === slot.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm sm:text-base">{slot.label}</span>
                      <div className="flex items-center gap-1">
                        {slot.popular && available && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                        {available ? (
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{slot.range}</div>
                    {slot.popular && available && (
                      <Badge variant="secondary" className="text-xs mt-1">Popular</Badge>
                    )}
                    {!available && (
                      <Badge variant="destructive" className="text-xs mt-1">Unavailable</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {selectedDate && selectedTime && (
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted rounded-lg mb-4 gap-2 sm:gap-0">
              <div>
                <div className="font-semibold text-sm sm:text-base">Selected Appointment</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </div>
                {nextDayUpsell && (
                  <div className="text-xs sm:text-sm text-orange-600 font-medium">
                    Includes $50 next-day service fee
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Appointment'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Slot Taken Dialog */}
      <SlotTakenDialog
        open={showSlotTakenDialog}
        onOpenChange={setShowSlotTakenDialog}
        selectedTime={attemptedSlot.time}
        selectedDate={attemptedSlot.date}
      />
    </div>
  );
};

export default ModernScheduler;