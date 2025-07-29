import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Star, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface VisualSchedulerProps {
  serviceType?: string;
  sessionId?: string;
}

const VisualScheduler: React.FC<VisualSchedulerProps> = ({ 
  serviceType = 'general',
  sessionId 
}) => {
  const navigate = useNavigate();
  const [serviceDate, setServiceDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [nextDayUpsell, setNextDayUpsell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextDayAvailable, setNextDayAvailable] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<{[key: string]: {[key: string]: boolean}}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [calendarSource, setCalendarSource] = useState<string>('unknown');

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

  const timeSlots = [
    { value: '8:00 AM', label: '8:00 AM - 10:00 AM', popular: false },
    { value: '9:00 AM', label: '9:00 AM - 11:00 AM', popular: true },
    { value: '10:00 AM', label: '10:00 AM - 12:00 PM', popular: true },
    { value: '11:00 AM', label: '11:00 AM - 1:00 PM', popular: false },
    { value: '12:00 PM', label: '12:00 PM - 2:00 PM', popular: false },
    { value: '1:00 PM', label: '1:00 PM - 3:00 PM', popular: true },
    { value: '2:00 PM', label: '2:00 PM - 4:00 PM', popular: true },
    { value: '3:00 PM', label: '3:00 PM - 5:00 PM', popular: false },
    { value: '4:00 PM', label: '4:00 PM - 6:00 PM', popular: false }
  ];

  // Check availability for selected date
  const checkDateAvailability = async (date: string) => {
    if (!date || availabilityData[date]) return; // Don't check if already have data
    
    setIsCheckingAvailability(true);
    try {
      const timeSlotValues = timeSlots.map(slot => slot.value);
      const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
        body: { date, timeSlots: timeSlotValues }
      });
      
      if (error) {
        console.error('Error checking availability:', error);
        // Default all slots to available if check fails
        const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
          acc[timeValue] = true;
          return acc;
        }, {} as {[key: string]: boolean});
        
        setAvailabilityData(prev => ({
          ...prev,
          [date]: defaultAvailability
        }));
      } else {
        const availability = data?.availability || [];
        const availabilityMap = availability.reduce((acc: {[key: string]: boolean}, slot: any) => {
          acc[slot.time] = slot.available;
          return acc;
        }, {});
        
        setAvailabilityData(prev => ({
          ...prev,
          [date]: availabilityMap
        }));
        
        // Set calendar source
        setCalendarSource(data?.source || 'unknown');
      }
    } catch (error) {
      console.error('Error checking date availability:', error);
      // Default all slots to available if check fails
      const timeSlotValues = timeSlots.map(slot => slot.value);
      const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
        acc[timeValue] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setAvailabilityData(prev => ({
        ...prev,
        [date]: defaultAvailability
      }));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Check next day availability
  useEffect(() => {
    const checkNextDayAvailability = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toISOString().split('T')[0];
        
        const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
          body: { date: tomorrowISO, timeSlots: ['9:00 AM'] }
        });
        
        if (error) {
          console.error('Error checking availability:', error);
          setNextDayAvailable(true);
        } else {
          const availability = data?.availability || [];
          const morningSlot = availability.find((slot: any) => slot.time === '9:00 AM');
          setNextDayAvailable(morningSlot?.available !== false);
        }
      } catch (error) {
        console.error('Error checking next day availability:', error);
        setNextDayAvailable(true);
      }
    };

    checkNextDayAvailability();
  }, []);

  // Check availability when service date changes
  useEffect(() => {
    if (serviceDate && !nextDayUpsell) {
      checkDateAvailability(serviceDate);
    }
  }, [serviceDate, nextDayUpsell]);

  // Check tomorrow's availability when next day upsell is enabled
  useEffect(() => {
    if (nextDayUpsell) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];
      checkDateAvailability(tomorrowISO);
    }
  }, [nextDayUpsell]);

  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (time: string, date?: string) => {
    const checkDate = date || (nextDayUpsell ? 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
      serviceDate
    );
    
    if (!checkDate || !availabilityData[checkDate]) return true; // Default to available
    return availabilityData[checkDate][time] !== false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate scheduling selection
      if (nextDayUpsell) {
        if (!timeSlot) {
          toast.error('Please select a time slot for next day service');
          setIsSubmitting(false);
          return;
        }
        // Set service date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setServiceDate(tomorrow.toISOString().split('T')[0]);
      } else {
        if (!serviceDate) {
          toast.error('Please select a service date');
          setIsSubmitting(false);
          return;
        }
        if (!timeSlot) {
          toast.error('Please select a time slot');
          setIsSubmitting(false);
          return;
        }
      }

      // Update order with scheduling data
      if (sessionId) {
        const finalDate = nextDayUpsell ? 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          serviceDate;

        await supabase
          .from("orders")
          .update({
            scheduled_date: finalDate,
            scheduled_time: timeSlot,
            service_details: {
              scheduling: {
                scheduledDate: finalDate,
                scheduledTime: timeSlot,
                nextDayUpsell: nextDayUpsell,
                nextDayFee: nextDayUpsell ? 50 : 0,
                bookedAt: new Date().toISOString()
              }
            }
          })
          .eq("stripe_session_id", sessionId);

        // If next day upsell, update the order amount
        if (nextDayUpsell) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("amount")
            .eq("stripe_session_id", sessionId)
            .single();

          if (orderData) {
            await supabase
              .from("orders")
              .update({
                amount: orderData.amount + 5000 // Add $50 in cents
              })
              .eq("stripe_session_id", sessionId);
          }
        }
      }

      toast.success('Time slot selected successfully!');
      
      // Navigate to service details page
      if (sessionId) {
        navigate(`/service-details?session_id=${sessionId}`);
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Scheduling error:', error);
      toast.error('Failed to save scheduling. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate date options (next 30 days, excluding Sundays)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 2; i <= 30; i++) { // Start from day 2 since next day is handled separately
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }),
          dayOfWeek: date.getDay()
        });
      }
    }
    
    return dates;
  };

  const calculateTotal = () => {
    return nextDayUpsell ? 50 : 0;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="w-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Calendar className="h-6 w-6" />
          Choose Your Appointment Time
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Select your preferred date and time for your {serviceType} cleaning service
        </CardDescription>
        <div className="text-xs text-primary-foreground/60 mt-1 flex items-center justify-center gap-3">
          <span>✓ Instant confirmation</span>
          <span>• Service duration: {getServiceDuration(serviceType)}h</span>
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isCheckingAvailability ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            {isCheckingAvailability ? 'Checking calendar...' : 'Real-time availability'}
          </span>
          {calendarSource && calendarSource !== 'unknown' && (
            <span className="text-primary-foreground/40">
              • {calendarSource === 'google' ? 'Google Calendar' : calendarSource === 'gohighlevel' ? 'GoHighLevel' : 'Mock Data'}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="bg-white rounded-lg p-6 shadow-inner">
          <div className="space-y-6">
            
            {/* Next Day Upsell Option */}
            {nextDayAvailable && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                      Need it done tomorrow?
                      <Badge variant="destructive" className="text-sm font-bold">
                        +$50
                      </Badge>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We can prioritize your {serviceType} cleaning service for <strong>{getTomorrowDate()}</strong> 
                      for an additional $50 premium.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="nextDayUpsell"
                        checked={nextDayUpsell}
                        onChange={(e) => {
                          setNextDayUpsell(e.target.checked);
                          if (!e.target.checked) {
                            setTimeSlot(''); // Reset time slot when unchecking
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <label htmlFor="nextDayUpsell" className="text-lg font-semibold text-gray-800 cursor-pointer">
                        Yes, I want next day service (+$50)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduling Options */}
            <div className="space-y-6">
              {nextDayUpsell ? (
                // Next Day Time Selection Only
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-6 w-6" />
                    Select Time for {getTomorrowDate()}
                  </h3>
                  
                  <div>
                    <Select onValueChange={setTimeSlot} value={timeSlot}>
                      <SelectTrigger className="text-lg p-4 text-gray-900 placeholder:text-gray-500">
                        <SelectValue placeholder="Choose your preferred time slot" />
                      </SelectTrigger>
                       <SelectContent>
                         {isCheckingAvailability && (
                           <div className="p-3 text-center text-muted-foreground">
                             Checking availability...
                           </div>
                         )}
                         {timeSlots.map((slot) => {
                           const available = isTimeSlotAvailable(slot.value);
                           return (
                             <SelectItem 
                               key={slot.value} 
                               value={slot.value} 
                               className={`text-base p-3 ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                               disabled={!available}
                             >
                               <div className="flex items-center justify-between w-full">
                                 <span className={!available ? 'line-through' : ''}>{slot.label}</span>
                                 <div className="flex items-center gap-2">
                                   {slot.popular && available && (
                                     <Badge variant="secondary" className="text-xs">
                                       <Star className="h-3 w-3 mr-1" />
                                       Popular
                                     </Badge>
                                   )}
                                   {!available && (
                                     <Badge variant="destructive" className="text-xs">
                                       Unavailable
                                     </Badge>
                                   )}
                                   {available && (
                                     <div className="w-2 h-2 bg-green-500 rounded-full" />
                                   )}
                                 </div>
                               </div>
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                // Regular Date & Time Selection
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-6 w-6" />
                    Schedule Your Service
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-base font-medium text-gray-700">Service Date</label>
                      <Select onValueChange={setServiceDate} value={serviceDate}>
                        <SelectTrigger className="text-lg p-4 text-gray-900 placeholder:text-gray-500">
                          <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateDateOptions().map((date) => (
                            <SelectItem key={date.value} value={date.value} className="text-base p-3">
                              {date.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-base font-medium text-gray-700">Time Slot</label>
                      <Select onValueChange={setTimeSlot} value={timeSlot}>
                        <SelectTrigger className="text-lg p-4 text-gray-900 placeholder:text-gray-500">
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                         <SelectContent>
                           {isCheckingAvailability && (
                             <div className="p-3 text-center text-muted-foreground">
                               Checking availability...
                             </div>
                           )}
                           {timeSlots.map((slot) => {
                             const available = isTimeSlotAvailable(slot.value);
                             return (
                               <SelectItem 
                                 key={slot.value} 
                                 value={slot.value} 
                                 className={`text-base p-3 ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 disabled={!available}
                               >
                                 <div className="flex items-center justify-between w-full">
                                   <span className={!available ? 'line-through' : ''}>{slot.label}</span>
                                   <div className="flex items-center gap-2">
                                     {slot.popular && available && (
                                       <Badge variant="secondary" className="text-xs">
                                         <Star className="h-3 w-3 mr-1" />
                                         Popular
                                       </Badge>
                                     )}
                                     {!available && (
                                       <Badge variant="destructive" className="text-xs">
                                         Unavailable
                                       </Badge>
                                     )}
                                     {available && (
                                       <div className="w-2 h-2 bg-green-500 rounded-full" />
                                     )}
                                   </div>
                                 </div>
                               </SelectItem>
                             );
                           })}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Summary - Only show if next day upsell */}
            {nextDayUpsell && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Next Day Service Premium</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Next Day Service Fee</span>
                    <span>+$50</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    This premium fee ensures priority scheduling for tomorrow's service.
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSubmit}
              className="w-full" 
              disabled={isSubmitting || (!nextDayUpsell && (!serviceDate || !timeSlot)) || (nextDayUpsell && !timeSlot)}
              size="lg"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirm Time & Continue to Service Details
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualScheduler;