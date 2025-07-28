import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Mail, Phone, MapPin, Star, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface VisualSchedulerProps {
  serviceType?: string;
  isNextDayBooking?: boolean;
  onSlotSelect?: (date: string, time: string) => void;
  sessionId?: string;
}

interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  serviceDate: string;
  timeSlot: string;
  specialInstructions: string;
  nextDayUpsell: boolean;
}

const VisualScheduler: React.FC<VisualSchedulerProps> = ({ 
  serviceType = 'general',
  isNextDayBooking = false,
  onSlotSelect,
  sessionId 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceDate: '',
    timeSlot: '',
    specialInstructions: '',
    nextDayUpsell: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextDayAvailable, setNextDayAvailable] = useState(true);

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

  // Load order data if sessionId is provided
  useEffect(() => {
    const fetchOrderData = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("customer_name, customer_email, customer_phone, service_details")
            .eq("stripe_session_id", sessionId)
            .single();

          if (data && !error) {
            const [firstName, ...lastNameParts] = (data.customer_name || '').split(' ');
            setFormData(prev => ({
              ...prev,
              firstName: firstName || '',
              lastName: lastNameParts.join(' ') || '',
              email: data.customer_email || '',
              phone: data.customer_phone || ''
            }));

            // Pre-fill address if available
            const serviceDetails = data.service_details as any;
            if (serviceDetails?.address) {
              setFormData(prev => ({
                ...prev,
                address: serviceDetails.address.street || '',
                city: serviceDetails.address.city || '',
                state: serviceDetails.address.state || '',
                zipCode: serviceDetails.address.zipCode || ''
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching order data:', error);
        }
      }
    };

    fetchOrderData();
  }, [sessionId]);

  // Check next day availability
  useEffect(() => {
    const checkNextDayAvailability = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toISOString().split('T')[0];
        
        const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
          body: { date: tomorrowISO, timeSlot: '9:00 AM' }
        });
        
        if (error) {
          console.error('Error checking availability:', error);
          setNextDayAvailable(false);
        } else {
          setNextDayAvailable(data?.available !== false);
        }
      } catch (error) {
        console.error('Error checking next day availability:', error);
        setNextDayAvailable(false);
      }
    };

    checkNextDayAvailability();
  }, []);

  const handleInputChange = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof BookingFormData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      if (!formData.serviceDate) {
        toast.error('Please select a service date');
        setIsSubmitting(false);
        return;
      }

      if (!formData.timeSlot) {
        toast.error('Please select a time slot');
        setIsSubmitting(false);
        return;
      }

      // Create booking data
      const bookingData = {
        customerData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        bookingData: {
          serviceType,
          serviceDate: formData.serviceDate,
          timeSlot: formData.timeSlot,
          specialInstructions: formData.specialInstructions,
          duration: getServiceDuration(serviceType),
          nextDayUpsell: formData.nextDayUpsell
        }
      };

      // Create booking in GoHighLevel
      const { data, error } = await supabase.functions.invoke('create-gohighlevel-booking', {
        body: bookingData
      });

      if (error) {
        throw error;
      }

      // Update order with scheduling data if sessionId exists
      if (sessionId) {
        await supabase
          .from("orders")
          .update({
            scheduled_date: formData.serviceDate,
            scheduled_time: formData.timeSlot,
            service_details: {
              scheduling: {
                scheduledDate: formData.serviceDate,
                scheduledTime: formData.timeSlot,
                nextDayUpsell: formData.nextDayUpsell,
                bookedAt: new Date().toISOString()
              },
              address: {
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode
              },
              instructions: {
                special: formData.specialInstructions
              }
            }
          })
          .eq("stripe_session_id", sessionId);
      }

      // Create booking record
      await supabase
        .from("bookings")
        .insert({
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          customer_phone: formData.phone,
          service_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
          service_date: formData.serviceDate,
          service_time: formData.timeSlot,
          special_instructions: formData.specialInstructions,
          estimated_duration: getServiceDuration(serviceType) * 60, // Convert to minutes
          order_id: sessionId ? null : undefined
        });

      toast.success('Booking scheduled successfully!');
      
      // Call the onSlotSelect callback if provided
      if (onSlotSelect) {
        onSlotSelect(formData.serviceDate, formData.timeSlot);
      }

      // Navigate to service details page
      if (sessionId) {
        navigate(`/service-details?session_id=${sessionId}`);
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to schedule booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate date options (next 30 days, excluding Sundays)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() !== 0) {
        const isNextDay = i === 1;
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }),
          isNextDay,
          dayOfWeek: date.getDay()
        });
      }
    }
    
    return dates;
  };

  const calculateTotal = () => {
    const basePrice = 150; // Base service price
    const nextDayFee = formData.nextDayUpsell ? 50 : 0;
    return basePrice + nextDayFee;
  };

  return (
    <Card className="w-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Calendar className="h-6 w-6" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Book your appointment and complete your service details
        </CardDescription>
        <div className="text-xs text-primary-foreground/60 mt-1 flex items-center justify-center gap-3">
          <span>✓ Instant confirmation</span>
          <span>• Service duration: {getServiceDuration(serviceType)}h</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Real-time availability
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="bg-white rounded-lg p-6 shadow-inner">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Service Address
              </h3>
              
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Next Day Upsell */}
            {nextDayAvailable && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      Next Day Service Available
                      <Badge variant="destructive" className="text-xs">
                        +$50
                      </Badge>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Need your cleaning done tomorrow? We can prioritize your service for an additional $50.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="nextDayUpsell"
                        checked={formData.nextDayUpsell}
                        onChange={(e) => handleInputChange('nextDayUpsell', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="nextDayUpsell" className="text-sm font-medium text-gray-700">
                        Yes, I want next day service (+$50)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduling Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceDate">Service Date *</Label>
                  <Select onValueChange={(value) => handleInputChange('serviceDate', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a date" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateDateOptions().map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{date.label}</span>
                            {date.isNextDay && formData.nextDayUpsell && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Next Day
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select onValueChange={(value) => handleInputChange('timeSlot', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{slot.label}</span>
                            {slot.popular && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Any special instructions, access codes, pet information, or specific areas to focus on..."
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Service</span>
                  <span>$150</span>
                </div>
                {formData.nextDayUpsell && (
                  <div className="flex justify-between text-orange-600">
                    <span>Next Day Service</span>
                    <span>+$50</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirm Booking & Continue
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualScheduler;