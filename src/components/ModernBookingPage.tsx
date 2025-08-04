import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  Clock, 
  MapPin, 
  Star, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Shield,
  Calendar as CalendarIcon,
  Timer,
  Users,
  Zap,
  Gift,
  Award,
  Phone,
  Mail,
  User,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ServiceTier {
  id: string;
  hours: number;
  price: number;
  memberPrice: number;
  title: string;
  description: string;
  popular?: boolean;
  features: string[];
  icon: React.ReactNode;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  category: 'essential' | 'premium' | 'specialty';
}

interface BookingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const serviceTiers: ServiceTier[] = [
  {
    id: 'quick',
    hours: 2,
    price: 200,
    memberPrice: 180,
    title: 'Quick Refresh',
    description: 'Perfect for maintenance cleaning',
    features: ['2 Professional Cleaners', 'Essential Areas', 'Basic Supplies', 'Quality Guarantee'],
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'standard',
    hours: 4,
    price: 400,
    memberPrice: 380,
    title: 'Deep Clean',
    description: 'Most popular choice',
    popular: true,
    features: ['2 Professional Cleaners', 'All Rooms & Bathrooms', 'Premium Supplies', 'Detailed Cleaning', 'Quality Guarantee'],
    icon: <Star className="h-6 w-6" />
  },
  {
    id: 'premium',
    hours: 6,
    price: 600,
    memberPrice: 580,
    title: 'Complete Care',
    description: 'Ultimate deep cleaning experience',
    features: ['3 Professional Cleaners', 'Every Room & Detail', 'Eco-Friendly Supplies', 'Move-Out Ready', 'Quality Guarantee', 'Follow-Up Call'],
    icon: <Award className="h-6 w-6" />
  }
];

const addOnServices: AddOnService[] = [
  {
    id: 'fridge',
    name: 'Inside Fridge',
    price: 25,
    description: 'Deep clean refrigerator interior',
    icon: <Home className="h-4 w-4" />,
    category: 'essential'
  },
  {
    id: 'oven',
    name: 'Inside Oven',
    price: 35,
    description: 'Complete oven deep clean',
    icon: <Timer className="h-4 w-4" />,
    category: 'essential'
  },
  {
    id: 'windows',
    name: 'Interior Windows',
    price: 40,
    description: 'All interior window cleaning',
    icon: <Sparkles className="h-4 w-4" />,
    category: 'premium'
  },
  {
    id: 'baseboards',
    name: 'Baseboard Detail',
    price: 30,
    description: 'Detailed baseboard cleaning',
    icon: <CheckCircle2 className="h-4 w-4" />,
    category: 'premium'
  }
];

const timeSlots = [
  { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM', available: true },
  { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM', available: true, popular: true },
  { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM', available: true, popular: true },
  { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM', available: false },
  { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM', available: true },
  { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM', available: true, popular: true },
  { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM', available: true },
  { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM', available: true }
];

export const ModernBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null);
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialInstructions: ''
  });
  const [progress, setProgress] = useState(0);

  const steps: BookingStep[] = [
    { id: 1, title: 'Choose Service', description: 'Select your cleaning package', completed: !!selectedTier },
    { id: 2, title: 'Add Extras', description: 'Customize with add-ons', completed: currentStep > 2 },
    { id: 3, title: 'Schedule', description: 'Pick date and time', completed: !!selectedDate && !!selectedTime },
    { id: 4, title: 'Details', description: 'Contact information', completed: !!customerInfo.name && !!customerInfo.email },
    { id: 5, title: 'Payment', description: 'Secure checkout', completed: false }
  ];

  // Calculate progress based on completed steps
  useEffect(() => {
    const completedSteps = steps.filter(step => step.completed).length;
    setProgress((completedSteps / steps.length) * 100);
  }, [steps]);

  const calculateTotal = () => {
    if (!selectedTier) return 0;
    const tierPrice = membershipEnabled ? selectedTier.memberPrice : selectedTier.price;
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    const membershipFee = membershipEnabled ? 30 : 0;
    return tierPrice + addOnsTotal + membershipFee;
  };

  const getSavings = () => {
    if (!selectedTier || !membershipEnabled) return 0;
    return selectedTier.price - selectedTier.memberPrice;
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTierSelect = (tier: ServiceTier) => {
    setSelectedTier(tier);
    setTimeout(() => handleNextStep(), 300);
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedTime) {
      setTimeout(() => handleNextStep(), 300);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && time) {
      setTimeout(() => handleNextStep(), 300);
    }
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push(date);
      }
    }
    return dates.slice(0, 10);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Choose Your Service</h2>
              <p className="text-muted-foreground text-lg">Professional cleaning tailored to your needs</p>
            </div>

            {/* Membership Toggle */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">BACP Club™ Membership</h3>
                      <Badge variant="secondary">$30/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Save $20 on every cleaning + exclusive perks</p>
                  </div>
                  <Switch
                    checked={membershipEnabled}
                    onCheckedChange={setMembershipEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Service Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceTiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={cn(
                    "booking-card cursor-pointer relative",
                    selectedTier?.id === tier.id ? "booking-selected" : "",
                    tier.popular ? "border-primary/50" : ""
                  )}
                  onClick={() => handleTierSelect(tier)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-float">
                      {tier.icon}
                    </div>
                    <CardTitle className="text-xl">{tier.title}</CardTitle>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">{tier.hours} Hours</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        ${membershipEnabled ? tier.memberPrice : tier.price}
                      </div>
                      {membershipEnabled && (
                        <div className="text-sm text-muted-foreground">
                          <span className="line-through">${tier.price}</span>
                          <span className="ml-2 text-success font-medium">Save ${tier.price - tier.memberPrice}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Add Extra Services</h2>
              <p className="text-muted-foreground text-lg">Enhance your cleaning with these premium add-ons</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addOnServices.map((addOn) => (
                <Card 
                  key={addOn.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    selectedAddOns.includes(addOn.id) ? "ring-2 ring-primary border-primary" : ""
                  )}
                  onClick={() => handleAddOnToggle(addOn.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => {}}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {addOn.icon}
                            <h3 className="font-semibold">{addOn.name}</h3>
                          </div>
                          <span className="font-bold text-primary">${addOn.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{addOn.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleNextStep} size="lg">
                Continue to Scheduling
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Schedule Your Service</h2>
              <p className="text-muted-foreground text-lg">Choose your preferred date and time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {generateDates().map((date) => (
                      <Button
                        key={date.toISOString()}
                        variant={selectedDate?.toDateString() === date.toDateString() ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col gap-1"
                        onClick={() => handleDateSelect(date)}
                      >
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="font-semibold">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Select Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.value}
                        variant={selectedTime === slot.value ? "default" : "outline"}
                        className={cn(
                          "h-auto p-3 flex flex-col gap-1",
                          !slot.available && "opacity-50 cursor-not-allowed",
                          slot.popular && "border-primary/50"
                        )}
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.value)}
                      >
                        <span className="font-semibold">{slot.label}</span>
                        <span className="text-xs text-muted-foreground">{slot.range}</span>
                        {slot.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedDate && selectedTime && (
              <div className="flex justify-center">
                <Button onClick={handleNextStep} size="lg">
                  Continue to Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Contact Information</h2>
              <p className="text-muted-foreground text-lg">Tell us about your service location</p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Service Address</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                  <Input
                    id="instructions"
                    value={customerInfo.specialInstructions}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special requests or instructions"
                  />
                </div>
              </CardContent>
            </Card>

            {customerInfo.name && customerInfo.email && customerInfo.address && (
              <div className="flex justify-center">
                <Button onClick={handleNextStep} size="lg">
                  Review & Pay
                  <CreditCard className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Review & Payment</h2>
              <p className="text-muted-foreground text-lg">Confirm your booking details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>{selectedTier?.title} ({selectedTier?.hours} hours)</span>
                      <span className="font-semibold">
                        ${membershipEnabled ? selectedTier?.memberPrice : selectedTier?.price}
                      </span>
                    </div>
                    
                    {selectedAddOns.length > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="font-medium">Add-ons:</h4>
                        {selectedAddOns.map(addOnId => {
                          const addOn = addOnServices.find(s => s.id === addOnId);
                          return addOn ? (
                            <div key={addOn.id} className="flex justify-between text-sm">
                              <span>{addOn.name}</span>
                              <span>${addOn.price}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {membershipEnabled && (
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                          <span>BACP Club™ Membership</span>
                          <span>$30</span>
                        </div>
                        <div className="flex justify-between text-success">
                          <span>Service Discount</span>
                          <span>-${getSavings()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Schedule & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedDate ? formatDate(selectedDate) : 'No date selected'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTime || 'No time selected'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{customerInfo.address}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    {membershipEnabled && getSavings() > 0 && (
                      <div className="flex justify-between text-success">
                        <span>You Save</span>
                        <span>-${getSavings()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${calculateTotal()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      toast.success('Booking confirmed! Redirecting to payment...');
                      // Add payment integration here
                    }}
                  >
                    Complete Booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="text-center text-xs text-muted-foreground">
                    🔒 Secure payment processed by Stripe
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Book Your Perfect Clean
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional cleaning services with transparent pricing and flexible scheduling
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-2",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step.completed 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep === step.id 
                        ? "bg-primary/20 text-primary border-2 border-primary" 
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.completed ? <Check className="h-5 w-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "flex-1 h-1 mx-4 rounded transition-all",
                      step.completed ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="booking-progress h-3">
            <div 
              className="booking-progress-bar h-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep > 1 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button variant="outline" onClick={handlePrevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {/* Floating Summary (shows after step 1) */}
        {selectedTier && currentStep > 1 && currentStep < 5 && (
          <Card className="fixed bottom-8 right-8 w-80 shadow-lg border-primary/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Your Selection</span>
                  <Badge variant="outline">{selectedTier.title}</Badge>
                </div>
                {selectedDate && selectedTime && (
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedDate)} at {selectedTime}
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${calculateTotal()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};