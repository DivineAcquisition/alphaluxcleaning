import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, AlertCircle, Zap, Star, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModernSchedulerProps {
  serviceType?: string;
  sessionId?: string;
}

const ModernScheduler: React.FC<ModernSchedulerProps> = ({ 
  serviceType = 'general',
  sessionId 
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [nextDayUpsell, setNextDayUpsell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<{[key: string]: {[key: string]: boolean}}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [calendarSource, setCalendarSource] = useState<string>('unknown');

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

  const checkDateAvailability = async (date: string) => {
    if (!date || availabilityData[date]) return;
    
    setIsCheckingAvailability(true);
    try {
      const timeSlotValues = timeSlots.map(slot => slot.value);
      const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
        body: { date, timeSlots: timeSlotValues }
      });
      
      if (error) {
        console.error('Error checking availability:', error);
        const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
          acc[timeValue] = true;
          return acc;
        }, {} as {[key: string]: boolean});
        
        setAvailabilityData(prev => ({ ...prev, [date]: defaultAvailability }));
      } else {
        const availability = data?.availability || [];
        const availabilityMap = availability.reduce((acc: {[key: string]: boolean}, slot: any) => {
          acc[slot.time] = slot.available;
          return acc;
        }, {});
        
        setAvailabilityData(prev => ({ ...prev, [date]: availabilityMap }));
        setCalendarSource(data?.source || 'unknown');
      }
    } catch (error) {
      console.error('Error checking date availability:', error);
      const timeSlotValues = timeSlots.map(slot => slot.value);
      const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
        acc[timeValue] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setAvailabilityData(prev => ({ ...prev, [date]: defaultAvailability }));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

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
    
    if (!checkDate || !availabilityData[checkDate]) return true;
    return availabilityData[checkDate][time] !== false;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
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

      toast.success('Appointment scheduled successfully!');
      
      if (sessionId) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Schedule Your Service</h1>
        <p className="text-muted-foreground">Choose your preferred date and time for your {serviceType} cleaning</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isCheckingAvailability ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span>{isCheckingAvailability ? 'Checking...' : 'Live availability'}</span>
          </div>
          {calendarSource && calendarSource !== 'unknown' && (
            <span>• {calendarSource === 'google' ? 'Google Calendar' : 'Calendar'} connected</span>
          )}
        </div>
      </div>

      {/* Next Day Upsell */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-orange-500 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Need it tomorrow?</h3>
                <Badge variant="destructive">+$50</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Get priority scheduling for tomorrow with our expedited service
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
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
                <span className="font-medium">Yes, schedule for tomorrow (+$50)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      {!nextDayUpsell && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    selectedDate === date.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{date.weekday}</div>
                  <div className="text-sm font-medium">{date.month}</div>
                  <div className="text-lg font-bold">{date.day}</div>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
              {nextDayUpsell && <Badge variant="secondary">Tomorrow</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {timeSlots.map((slot) => {
                const available = isTimeSlotAvailable(slot.value);
                return (
                  <button
                    key={slot.value}
                    onClick={() => available && setSelectedTime(slot.value)}
                    disabled={!available}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      !available && "opacity-50 cursor-not-allowed",
                      selectedTime === slot.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{slot.label}</span>
                      <div className="flex items-center gap-1">
                        {slot.popular && available && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                        {available ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
              <div>
                <div className="font-semibold">Selected Appointment</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </div>
                {nextDayUpsell && (
                  <div className="text-sm text-orange-600 font-medium">
                    Includes $50 next-day service fee
                  </div>
                )}
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernScheduler;