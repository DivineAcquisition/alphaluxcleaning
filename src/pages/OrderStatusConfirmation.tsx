import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/Navigation";
import { PaymentBreakdown } from "@/components/PaymentBreakdown";
import { TipComponent } from "@/components/TipComponent";
import { RescheduleRequestDialog } from "@/components/RescheduleRequestDialog";
import { UpdateAddressDialog } from "@/components/UpdateAddressDialog";
import { UpdateContactDialog } from "@/components/UpdateContactDialog";
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  Phone,
  Mail,
  MessageSquare,
  Star,
  Gift,
  CreditCard,
  Settings,
  Home
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  cleaning_type: string;
  frequency: string;
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
  service_details: any;
  service_address?: any;
  payment_type?: string;
  final_total?: number;
  add_ons?: string[];
  referral_code?: string;
}

export default function OrderStatusConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(20);
  
  // Dialog states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      toast.error("No order information found");
      navigate('/guest-booking');
    }
  }, [orderId]);

  useEffect(() => {
    // Simulate progress animation
    const timer = setTimeout(() => setProgress(100), 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-order-details', {
        body: { order_id: orderId }
      });

      if (error || !data?.order) {
        toast.error("Order not found");
        navigate('/guest-booking');
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      navigate('/guest-booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'confirmed':
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'To be scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your order confirmation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't find your order. Please try booking again.
              </p>
              <Button onClick={() => navigate('/guest-booking')}>
                <Home className="h-4 w-4 mr-2" />
                Book New Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Celebration Header */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <CheckCircle className="h-20 w-20 animate-pulse" />
                  <div className="absolute -top-2 -right-2">
                    <Star className="h-8 w-8 text-yellow-300 fill-current" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                🎉 Order Confirmed!
              </CardTitle>
              <CardDescription className="text-green-100 text-lg">
                Welcome to Bay Area Cleaning! Your cleaning service is booked.
              </CardDescription>
              <div className="mt-4 max-w-md mx-auto">
                <Progress value={progress} className="h-2 bg-green-400" />
                <p className="text-sm text-green-100 mt-2">Order #{order.id.slice(-8)}</p>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Order Timeline & Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Timeline */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Order Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle className="h-5 w-5 fill-current" />
                      <span className="font-medium">Order Confirmed</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-600">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Team Assignment</span>
                      <span className="text-sm text-muted-foreground ml-auto">Within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Service Date</span>
                      <span className="text-sm ml-auto">{formatDate(order.scheduled_date)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Booked {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Service Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <span className="text-muted-foreground text-sm">Service Type</span>
                      <div className="font-medium">
                        {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <span className="text-muted-foreground text-sm">Frequency</span>
                      <div className="font-medium">
                        {order.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'One-time'}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <span className="text-muted-foreground text-sm">Scheduled</span>
                      <div className="font-medium">
                        {formatDate(order.scheduled_date)}
                        {order.scheduled_time && <div className="text-sm text-muted-foreground">{order.scheduled_time}</div>}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <span className="text-muted-foreground text-sm">Total Amount</span>
                      <div className="font-bold text-primary text-lg">
                        ${((order.final_total || order.amount) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  {order.payment_type && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-200">Payment Details</span>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        {order.payment_type === 'pay_after_service' 
                          ? 'Payment due after service completion' 
                          : '25% paid now, 75% due after service'
                        }
                      </p>
                    </div>
                  )}

                  {/* Service Address */}
                  {(order.service_address || order.service_details?.serviceAddress) && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Service Address</span>
                      </div>
                      <div className="text-sm">
                        {(() => {
                          const address = order.service_address || order.service_details?.serviceAddress;
                          return (
                            <>
                              <p>{address?.street}{address?.apartment && `, ${address.apartment}`}</p>
                              <p>{address?.city}, {address?.state} {address?.zipCode}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* What's Next */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    What Happens Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        📧 Confirmation Email
                      </h4>
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        Check your inbox for booking details and receipt.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        👥 Team Assignment
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        We'll assign your cleaning team within 24 hours.
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        📞 Pre-Service Contact
                      </h4>
                      <p className="text-purple-800 dark:text-purple-200 text-sm">
                        Your team will call 30 minutes before arrival.
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        ⭐ Service Completion
                      </h4>
                      <p className="text-orange-800 dark:text-orange-200 text-sm">
                        Rate your service and leave feedback when done.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Customer Actions & Support */}
            <div className="space-y-6">
              
              {/* Customer Information */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer_email}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.customer_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule Service
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setAddressDialogOpen(true)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Update Address
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setContactDialogOpen(true)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Update Contact Info
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Breakdown */}
              {order && <PaymentBreakdown order={order} />}

              {/* Tip Your Team */}
              <TipComponent orderId={order.id} orderAmount={order.final_total || order.amount} />

              {/* Referral Code */}
              {order.referral_code && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      Share & Save
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Your referral code:</p>
                      <code className="font-mono font-bold text-lg">{order.referral_code}</code>
                      <p className="text-sm text-muted-foreground mt-2">
                        Share with friends to save on future bookings!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Support */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Call (555) 123-4567
                  </Button>
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    Available 7 days a week, 8am-8pm
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={() => navigate(`/order-status?order_id=${order.id}`)}>
              <Package className="h-4 w-4 mr-2" />
              View Full Order Status
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RescheduleRequestDialog 
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        order={order}
      />
      <UpdateAddressDialog 
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        order={order}
      />
      <UpdateContactDialog 
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        order={order}
      />
    </div>
  );
}