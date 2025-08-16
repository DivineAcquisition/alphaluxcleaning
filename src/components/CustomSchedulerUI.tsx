import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, AlertCircle, Zap, Star, ArrowRight, Loader2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomSchedulerUIProps {
  orderId?: string;
  sessionId?: string;
  serviceType?: string;
  onComplete?: (data: { scheduled_date: string; scheduled_time: string }) => void;
}

const CustomSchedulerUI: React.FC<CustomSchedulerUIProps> = ({ 
  orderId,
  sessionId,
  serviceType = 'general',
  onComplete
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [nextDayUpsell, setNextDayUpsell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<{[key: string]: {[key: string]: boolean}}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        
        if (!isPollingUpdate) {
          toast.error('Failed to check calendar availability. Showing all slots as available.');
        }
      } else {
        const availableSlots = data?.available_slots || [];
        
        // Update connection status
        if (data?.status === 'google_calendar') {
          setConnectionStatus('connected');
        } else if (data?.status === 'mock_data') {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('error');
        }
        
        // Convert 24-hour API format to 12-hour display format
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
        
        setAvailabilityData(prev => ({ ...prev, [date]: availabilityMap }));
        setLastUpdated(new Date());
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
      
      if (!isPollingUpdate) {
        toast.error('Failed to connect to calendar. Showing all slots as available.');
      }
    } finally {
      if (!isPollingUpdate) setIsCheckingAvailability(false);
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
    
    if (!checkDate || !availabilityData[checkDate]) {
      return true; // Default to available
    }
    
    const isAvailable = availabilityData[checkDate][time] !== false;
    return isAvailable;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update order using the edge function
      const updateData = {
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

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
          body: { 
            orderId: orderId,
            sessionId: sessionId,
            isSchedulingConfirmation: true
          }
        });
        
        if (emailError) {
          console.error('Email sending error:', emailError);
          // Don't fail scheduling if email fails
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail scheduling if email fails
      }

      // Create GHL contact and sync to admin portal
      try {
        const { data: ghlResult, error: ghlError } = await supabase.functions.invoke('sync-ghl-contacts', {
          body: {
            action: 'create_booking_contact',
            customerName: data.customer_name || 'Customer',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            serviceType: data.service_details?.service_type || 'General Cleaning',
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            address: data.address,
            orderId: orderId,
            estimatedValue: (data.amount || 0) / 100
          }
        });

        if (ghlError) {
          console.error('GHL integration error:', ghlError);
          // Don't fail the booking if GHL fails
        } else if (ghlResult.success) {
          console.log('GHL contact created:', ghlResult.result);
        }
      } catch (ghlError) {
        console.error('GHL integration failed:', ghlError);
        // Continue with booking even if GHL fails
      }

      toast.success('Your scheduling request has been submitted!');
      
      // Navigate to order status page instead of calling onComplete
      const currentOrderId = orderId || localStorage.getItem('current_order_id');
      if (currentOrderId) {
        window.location.href = `/order-status?order_id=${currentOrderId}`;
      } else if (sessionId) {
        window.location.href = `/order-status?session_id=${sessionId}`;
      } else {
        // Fallback - call completion callback if available
        if (onComplete) {
          onComplete({
            scheduled_date: selectedDate,
            scheduled_time: selectedTime
          });
        }
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      toast.error('Failed to submit scheduling request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dates = generateDates();

  return (
    <div className="space-y-6">
      {/* Disclaimers */}
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Scheduling Request:</strong> The date and time you select is a scheduling request. A team member will contact you to confirm availability and finalize your appointment details.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>No Email Confirmation:</strong> Please note that no email confirmation is automatically sent upon payment submission. Our team will contact you directly to confirm your service details and scheduling.
          </AlertDescription>
        </Alert>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-muted/50">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-400' :
          connectionStatus === 'checking' || isCheckingAvailability ? 'bg-yellow-400 animate-pulse' :
          connectionStatus === 'disconnected' ? 'bg-orange-400' :
          'bg-red-400'
        }`} />
        <span className="text-sm font-medium">
          {connectionStatus === 'connected' ? 'Google Calendar Connected' :
           connectionStatus === 'checking' || isCheckingAvailability ? 'Checking availability...' :
           connectionStatus === 'disconnected' ? 'Using mock data' :
           'Calendar error - showing all available'}
        </span>
        {lastUpdated && connectionStatus === 'connected' && (
          <span className="text-xs text-muted-foreground">
            • Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Next Day Upsell */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Zap className="h-8 w-8 text-orange-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Need Service Tomorrow?
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                  +$50 Rush Fee
                </Badge>
              </h3>
              <p className="text-gray-600 mb-4">
                Priority scheduling available for tomorrow with an additional rush fee.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="nextDayUpsell"
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
                <label htmlFor="nextDayUpsell" className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Yes, I want next day service (+$50)
                </label>
              </div>
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
            <CardDescription>Choose your preferred service date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {dates.map((date) => (
                <Button
                  key={date.value}
                  variant={selectedDate === date.value ? "default" : "outline"}
                  onClick={() => setSelectedDate(date.value)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center gap-1",
                    selectedDate === date.value && "bg-primary text-primary-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{date.weekday}</span>
                  <span className="text-lg font-bold">{date.day}</span>
                  <span className="text-xs">{date.month}</span>
                  {date.isTomorrow && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Tomorrow
                    </Badge>
                  )}
                </Button>
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
              {nextDayUpsell && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Tomorrow
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose your preferred time slot (2-hour service window)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckingAvailability ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Checking availability...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const available = isTimeSlotAvailable(slot.value);
                  return (
                    <Button
                      key={slot.value}
                      variant={selectedTime === slot.value ? "default" : "outline"}
                      onClick={() => available && setSelectedTime(slot.value)}
                      disabled={!available}
                      className={cn(
                        "h-auto p-4 flex flex-col items-center gap-2",
                        selectedTime === slot.value && "bg-primary text-primary-foreground",
                        !available && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{slot.label}</span>
                        {slot.popular && available && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {slot.range}
                      </span>
                      {available ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="text-xs text-red-500 font-medium">
                          Unavailable
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {selectedDate && selectedTime && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Selected Schedule Request:</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Time:</strong> {selectedTime} (2-hour window)
                </p>
                {nextDayUpsell && (
                  <p className="text-sm text-orange-600 font-medium">
                    <strong>Rush Fee:</strong> +$50
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-lg font-semibold"
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
              
              <p className="text-xs text-muted-foreground">
                A team member will contact you to confirm this scheduling request
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomSchedulerUI;