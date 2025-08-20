import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, AlertCircle, Zap, Star, ArrowRight, Loader2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ComprehensiveBookingData {
  bookingStep: string;
  serviceDate: string;
  serviceTime: string;
  timestamp: string;
  source: string;
  orderId: string;
  nextDayUpsell?: boolean;
  nextDayFee?: number;
  homeSize?: string;
  frequency?: string;
  serviceType?: string;
  totalPrice?: number;
  basePrice?: number;
  addOns?: string[];
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  serviceAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  propertyDetails?: {
    dwellingType?: string;
    flooringTypes?: string[];
    primaryFlooringType?: string;
  };
  instructions?: any;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

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

  // Generate next 14 days starting 5 days out (excluding Sundays)
  const generateDates = () => {
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
          isToday: false,
          isTomorrow: false
        });
      }
      
      if (dates.length >= 14) break; // Limit to 14 selectable days
    }
    
    return dates;
  };

  // Temporarily disabled Google Calendar integration for faster loading
  const checkDateAvailability = async (date: string, isPollingUpdate = false) => {
    if (!date) return;
    
    // Set all time slots as available by default
    const timeSlotValues = timeSlots.map(slot => slot.value);
    const defaultAvailability = timeSlotValues.reduce((acc, timeValue) => {
      acc[timeValue] = true;
      return acc;
    }, {} as {[key: string]: boolean});
    
    setAvailabilityData(prev => ({ ...prev, [date]: defaultAvailability }));
    setConnectionStatus('disconnected');
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (selectedDate && !nextDayUpsell) {
      checkDateAvailability(selectedDate);
    }
  }, [selectedDate, nextDayUpsell]);

  // Disable next day upsell since we start 5 days out
  useEffect(() => {
    if (nextDayUpsell) {
      setNextDayUpsell(false);
      toast.info('Priority booking is available within 5 days from your selected date');
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

      // Send order entry webhook
      try {
        const webhookKey = `order-entry-sent-${orderId || sessionId}`;
        const alreadySent = localStorage.getItem(webhookKey);
        
        if (!alreadySent && (orderId || sessionId)) {
          console.log('Sending order entry webhook...');
          
          await supabase.functions.invoke('send-order-entry-webhook', {
            body: { 
              order_id: orderId,
              booking_id: sessionId
            }
          });
          
          localStorage.setItem(webhookKey, 'sent');
          console.log('Order entry webhook sent successfully');
        }
        
        toast.success('Booking completed and notifications sent!');
      } catch (webhookError) {
        console.error('Order entry webhook failed:', webhookError);
        toast.success('Your scheduling request has been submitted!');
      }

      // Navigate to order status page
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
    <div className="space-y-4">
      {/* Compact Disclaimers */}
      <Alert className="border-amber-200 bg-amber-50 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Scheduling Request:</strong> Date/time selection is a request - we'll contact you to confirm availability.
        </AlertDescription>
      </Alert>

      {/* Compact Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 mb-1">
              5+ Days Advance Booking Required
            </p>
            <p className="text-sm text-blue-700">
              For urgent needs, call <strong>(281) 809-9901</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Date Selection - Compact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {dates.map((date) => (
              <Button
                key={date.value}
                variant={selectedDate === date.value ? "default" : "outline"}
                onClick={() => setSelectedDate(date.value)}
                className={cn(
                  "h-auto p-2 flex flex-col items-center gap-0.5 text-xs",
                  selectedDate === date.value && "bg-primary text-primary-foreground"
                )}
              >
                <span className="font-medium">{date.weekday}</span>
                <span className="text-sm font-bold">{date.day}</span>
                <span className="text-xs opacity-75">{date.month}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Selection - Compact */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
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