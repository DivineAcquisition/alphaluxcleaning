import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CreditCard, 
  MapPin, 
  Clock, 
  DollarSign,
  Download,
  Settings,
  LogOut,
  CalendarPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  service_date: string;
  service_time: string;
  status: string;
  service_address: string;
  payment_status: string;
  price_calc_meta: any;
}

export default function CustomerPortalHome() {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const portalToken = localStorage.getItem('customer_portal_token');
      if (!portalToken) {
        navigate('/portal/login');
        return false;
      }
      return true;
    };

    const fetchCustomerData = async () => {
      if (!checkAuth()) return;

      try {
        // This would typically fetch customer-specific data
        // For now, we'll use mock data
        setNextBooking({
          id: 'booking-123',
          service_date: '2024-01-15',
          service_time: '10:00 AM',
          status: 'confirmed',
          service_address: '123 Main St, San Francisco, CA',
          payment_status: 'deposit_paid',
          price_calc_meta: { total: 120, deposit: 60 }
        });
        
        setBalance(60); // Remaining balance
        setLoading(false);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        toast({
          title: "Error",
          description: "Failed to load your booking information",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [navigate, toast]);

  const handleSignOut = () => {
    localStorage.removeItem('customer_portal_token');
    navigate('/portal/login');
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'deposit_paid': return 'bg-yellow-500';
      case 'unpaid': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">Loading your information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
            <p className="text-muted-foreground">AlphaLux Cleaning</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/portal/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Pay Balance</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Current balance: <span className="font-medium">${balance}</span>
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/portal/billing')}
                disabled={balance === 0}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">View Bookings</h3>
              <p className="text-sm text-muted-foreground mb-3">
                See all your service appointments
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/portal/bookings')}
              >
                View All
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <CalendarPlus className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Book Service</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Schedule a new cleaning
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://app.alphaluxclean.com/booking', '_blank')}
              >
                Book Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Next Booking */}
        {nextBooking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Service Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {new Date(nextBooking.service_date).toLocaleDateString()} at {nextBooking.service_time}
                    </span>
                    <Badge className={`${getStatusColor(nextBooking.status)} text-white`}>
                      {nextBooking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{nextBooking.service_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>Total: ${nextBooking.price_calc_meta?.total}</span>
                    <Badge className={`${getPaymentStatusColor(nextBooking.payment_status)} text-white`}>
                      {nextBooking.payment_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/portal/bookings/${nextBooking.id}`)}
                  >
                    View Details
                  </Button>
                  {balance > 0 && (
                    <Button onClick={() => navigate('/portal/billing')}>
                      Pay Balance
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest service history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Deep cleaning service completed</p>
                  <p className="text-sm text-muted-foreground">December 28, 2023</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">Completed</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Payment received</p>
                  <p className="text-sm text-muted-foreground">December 28, 2023 - $120.00</p>
                </div>
                <Badge className="bg-green-500 text-white">Paid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}