import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Phone, 
  Clock, 
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  Gift,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BookingData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  totalPrice: number;
  stripeSessionId?: string;
}

interface Props {
  bookingData: BookingData;
}

export function BookingConfirmationPage({ bookingData }: Props) {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const bookingId = bookingData.stripeSessionId || `BK${Date.now()}`;

  // Generate referral code on page load
  useEffect(() => {
    generateReferralCode();
  }, []);

  const generateReferralCode = async () => {
    setIsGeneratingCode(true);
    try {
      const { data, error } = await supabase.rpc('create_referral_code', {
        p_owner_email: 'customer@example.com', // Will be updated with real email
        p_owner_name: 'Valued Customer'
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setReferralCode(result.code);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      // Fallback to a simple generated code
      setReferralCode(`REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(`${bookingData.serviceDate}T${convertTo24Hour(bookingData.serviceTime)}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('House Cleaning Service')}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(`Cleaning service at ${bookingData.address.street}, ${bookingData.address.city}`)}&location=${encodeURIComponent(`${bookingData.address.street}, ${bookingData.address.city}, ${bookingData.address.state} ${bookingData.address.zipCode}`)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const addToAppleCalendar = () => {
    const startDate = new Date(`${bookingData.serviceDate}T${convertTo24Hour(bookingData.serviceTime)}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bay Area Cleaning Pros//EN
BEGIN:VEVENT
UID:${bookingId}@bayareacleaningpros.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:House Cleaning Service
DESCRIPTION:Cleaning service scheduled with Bay Area Cleaning Pros
LOCATION:${bookingData.address.street}, ${bookingData.address.city}, ${bookingData.address.state} ${bookingData.address.zipCode}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaning-appointment.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Success Header */}
      <Card className="shadow-clean border-success/20 bg-gradient-to-r from-success/5 to-success/10">
        <CardContent className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-success mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Your cleaning service has been successfully scheduled
          </p>
          <Badge variant="outline" className="text-sm font-mono bg-success/10 border-success/20">
            Booking ID: {bookingId}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Booking Details */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Service Type</p>
                  <p className="text-muted-foreground capitalize">
                    {bookingData.serviceType.replace('_', ' ')} - {bookingData.homeSize}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Date & Time</p>
                  <p className="text-muted-foreground">
                    {new Date(bookingData.serviceDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-muted-foreground">{bookingData.serviceTime}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Service Address</p>
                  <p className="text-muted-foreground">
                    {bookingData.address.street}<br />
                    {bookingData.address.city}, {bookingData.address.state} {bookingData.address.zipCode}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Contact Number</p>
                  <p className="text-muted-foreground">{bookingData.contactNumber}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Payment</p>
                  <p className="text-muted-foreground">
                    {bookingData.paymentType === '25_percent_with_discount' ? '25% Paid (5% Discount Applied)' : 'Card Authorized - Pay After Service'} - ${bookingData.totalPrice}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Add to Calendar */}
            <div className="space-y-2">
              <h4 className="font-semibold">Add to Calendar</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={addToGoogleCalendar}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Calendar
                </Button>
                <Button 
                  onClick={addToAppleCalendar}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apple Calendar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Referral Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Share & Save</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Refer friends and get 50% off your next deep cleaning!
              </p>
              
              {isGeneratingCode ? (
                <div className="flex items-center justify-center p-4 border rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2">Generating your code...</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    value={referralCode}
                    readOnly
                    className="font-mono bg-muted"
                  />
                  <Button
                    onClick={copyReferralCode}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Book Another Service
              </Button>
              
              <Button 
                onClick={() => navigate('/customer-dashboard')}
                className="w-full"
              >
                Go to Customer Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Card className="shadow-clean bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold mb-2">Before Your Service</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Clear clutter from surfaces</li>
                <li>• Secure valuables and fragile items</li>
                <li>• Ensure easy access to your home</li>
                <li>• Put away personal items</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">On Service Day</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Our team will arrive within the scheduled window</li>
                <li>• All cleaning supplies are provided</li>
                <li>• Service typically takes 2-3 hours</li>
                <li>• Payment remaining due upon completion</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-muted-foreground">
              Questions? Contact us at (555) 123-4567 or support@bayareacleaningpros.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}