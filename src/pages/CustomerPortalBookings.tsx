import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  Download,
  Plus,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerPortalBookings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const portalToken = localStorage.getItem('customer_portal_token');
      if (!portalToken) {
        navigate('/portal/login');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      // Mock booking data
      setTimeout(() => {
        setBooking({
          id: id || 'booking-123',
          service_type: 'Deep Cleaning',
          scheduled_date: '2023-12-30',
          scheduled_time: '10:00 AM',
          address: '123 Main St, San Francisco, CA 94102',
          status: 'scheduled',
          total_amount: 180,
          payment_status: 'paid',
          cleaner_name: 'Maria Rodriguez',
          cleaner_phone: '(555) 123-4567',
          special_instructions: 'Please focus on the kitchen and bathrooms',
          receipts: [
            {
              id: 'receipt-1',
              date: '2023-12-28',
              amount: 180,
              type: 'Service Payment',
              download_url: '#'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    }
  }, [id, navigate]);

  const handleAddToCalendar = () => {
    // Generate ICS file
    const event = {
      title: `${booking.service_type} - AlphaLux Clean`,
      start: new Date(`${booking.scheduled_date}T${booking.scheduled_time}`),
      description: `Cleaning service at ${booking.address}`,
      location: booking.address
    };
    
    toast({
      title: "Calendar Event Added",
      description: "The booking has been added to your calendar",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      scheduled: 'default',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/portal')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">#{booking?.id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Service Details
                  {getStatusBadge(booking?.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{booking?.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{booking?.scheduled_time}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{booking?.address}</span>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Service Type</h4>
                  <p className="text-sm text-muted-foreground">{booking?.service_type}</p>
                </div>

                {booking?.special_instructions && (
                  <div>
                    <h4 className="font-medium mb-2">Special Instructions</h4>
                    <p className="text-sm text-muted-foreground">{booking?.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cleaner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Cleaner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {booking?.cleaner_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{booking?.cleaner_name}</p>
                    <p className="text-sm text-muted-foreground">{booking?.cleaner_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Amount:</span>
                    <span className="font-medium">${booking?.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Status:</span>
                    <Badge className="bg-green-500 text-white">
                      {booking?.payment_status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleAddToCalendar}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/portal/billing')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Billing
                </Button>
              </CardContent>
            </Card>

            {/* Receipts */}
            <Card>
              <CardHeader>
                <CardTitle>Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking?.receipts?.map((receipt: any) => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{receipt.type}</p>
                        <p className="text-xs text-muted-foreground">{receipt.date}</p>
                        <p className="text-xs">${receipt.amount}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}