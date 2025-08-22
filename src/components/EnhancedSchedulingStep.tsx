import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, MapPin, Phone, MessageSquare, ArrowLeft, ArrowRight, Star, Sparkles, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  // Step 1: Service Selection
  homeSize: string;
  frequency: string;
  addOns: string[];
  addMembership: boolean;
  
  // Step 2: Service Details & Scheduling
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  nextDayFee?: number;
  
  // Property Details
  squareFootage: number;
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  flooringType: string;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  
  // Pricing calculations
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  membershipDiscount: number;
  membershipFee: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
}

interface EnhancedSchedulingStepProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EnhancedSchedulingStep({ bookingData, updateBookingData, onNext, onBack }: EnhancedSchedulingStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    bookingData.serviceDate ? new Date(bookingData.serviceDate) : undefined
  );
  const [nextDayBooking, setNextDayBooking] = useState(false);

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

  const squareFootageOptions = [
    'Under 1,000 sq ft',
    '1,001 - 1,400 sq ft',
    '1,401 - 1,800 sq ft',
    '1,801 - 2,400 sq ft',
    '2,401 - 2,800 sq ft',
    '2,801 - 3,300 sq ft',
    '3,301 - 3,900 sq ft',
    '3,901 - 4,500 sq ft',
    '4,501+ sq ft'
  ];

  const bedroomOptions = ['1', '2', '3', '4', '5', '6', '7', '8+'];
  const bathroomOptions = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '6+'];
  const dwellingTypes = ['House', 'Apartment', 'Condo', 'Townhouse', 'Mobile Home', 'Other'];
  const flooringTypes = ['Hardwood', 'Carpet', 'Tile', 'Laminate', 'Mixed', 'Other'];

  // Generate available dates
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 5; i <= 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push(date);
      }
      
      if (dates.length >= 21) break;
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const nextDayFee = isNextDay(date) && nextDayBooking ? 50 : 0;
      updateBookingData({ 
        serviceDate: date.toISOString().split('T')[0],
        nextDayFee
      });
    }
  };

  const isNextDay = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const canProceed = () => {
    return bookingData.serviceDate && 
           bookingData.serviceTime && 
           bookingData.address.street && 
           bookingData.contactNumber &&
           bookingData.customerName &&
           bookingData.customerEmail &&
           bookingData.bedrooms &&
           bookingData.bathrooms &&
           bookingData.dwellingType;
  };

  return (
    <div className="space-y-8">
      {/* Customer Information */}
      <Card className="shadow-clean">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={bookingData.customerName}
                onChange={(e) => updateBookingData({ customerName: e.target.value })}
                className="border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="john@example.com"
                value={bookingData.customerEmail}
                onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
                className="border-border focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Phone Number *</Label>
            <Input
              id="contactNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={bookingData.contactNumber}
              onChange={(e) => updateBookingData({ contactNumber: e.target.value })}
              className="border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card className="shadow-clean">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Square Footage</Label>
              <Select value={bookingData.squareFootage.toString()} onValueChange={(value) => updateBookingData({ squareFootage: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {squareFootageOptions.map((option, index) => (
                    <SelectItem key={option} value={(1000 + index * 400).toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bedrooms *</Label>
              <Select value={bookingData.bedrooms} onValueChange={(value) => updateBookingData({ bedrooms: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {bedroomOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option} {option === '1' ? 'bedroom' : 'bedrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bathrooms *</Label>
              <Select value={bookingData.bathrooms} onValueChange={(value) => updateBookingData({ bathrooms: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {bathroomOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option} {option === '1' ? 'bathroom' : 'bathrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Dwelling Type *</Label>
              <Select value={bookingData.dwellingType} onValueChange={(value) => updateBookingData({ dwellingType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {dwellingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Primary Flooring Type</Label>
              <Select value={bookingData.flooringType} onValueChange={(value) => updateBookingData({ flooringType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flooring" />
                </SelectTrigger>
                <SelectContent>
                  {flooringTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Day Priority */}
      <Card className="shadow-clean border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Next Day Priority Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background">
            <div className="flex-1">
              <h4 className="font-semibold text-primary">Get Priority Booking Tomorrow</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Guaranteed service within 24 hours with premium scheduling
              </p>
              <Badge className="mt-2 bg-primary text-primary-foreground">
                +$50 Priority Fee
              </Badge>
            </div>
            <Switch
              checked={nextDayBooking}
              onCheckedChange={(checked) => {
                setNextDayBooking(checked);
                if (selectedDate) {
                  const nextDayFee = isNextDay(selectedDate) && checked ? 50 : 0;
                  updateBookingData({ nextDayFee });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Selection - Using VisualScheduler styling */}
      <Card className="shadow-clean bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Choose Your Appointment Time
          </CardTitle>
          <p className="text-primary-foreground/80">
            Select your preferred date and time for your cleaning service
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="bg-white rounded-lg p-6 shadow-inner">
            <div className="space-y-6">
              {/* Quick Date Selection */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Select Date</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableDates.slice(0, 6).map((date, index) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isTomorrow = index === 0;
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md",
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-clean"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-800">
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          {isTomorrow && nextDayBooking && (
                            <Badge variant="secondary" className="mt-1 text-xs">+$50</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="animate-fade-in">
                  <h4 className="font-semibold text-gray-800 mb-4">Select Time</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => updateBookingData({ serviceTime: slot.value })}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all duration-200",
                          bookingData.serviceTime === slot.value
                            ? "border-primary bg-primary/5 shadow-clean"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{slot.label}</div>
                            <div className="text-xs text-gray-600">{slot.range}</div>
                          </div>
                          {slot.popular && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Address */}
      {bookingData.serviceTime && (
        <Card className="shadow-clean animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street, Apt 4B"
                  value={bookingData.address.street}
                  onChange={(e) => updateBookingData({
                    address: { ...bookingData.address, street: e.target.value }
                  })}
                  className="border-border focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={bookingData.address.city}
                    onChange={(e) => updateBookingData({
                      address: { ...bookingData.address, city: e.target.value }
                    })}
                    className="border-border focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={bookingData.address.state}
                    onChange={(e) => updateBookingData({
                      address: { ...bookingData.address, state: e.target.value }
                    })}
                    className="border-border focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="94102"
                    value={bookingData.address.zipCode}
                    onChange={(e) => updateBookingData({
                      address: { ...bookingData.address, zipCode: e.target.value }
                    })}
                    className="border-border focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {bookingData.address.street && (
        <Card className="shadow-clean animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Special Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requests or areas that need extra attention..."
              value={bookingData.specialInstructions}
              onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
              className="border-border focus:border-primary min-h-[100px] resize-none"
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Service Selection
        </Button>
        
        <Button 
          onClick={onNext}
          disabled={!canProceed()}
          className="flex items-center gap-2"
          size="lg"
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}