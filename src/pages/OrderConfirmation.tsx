import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, MapPin, User, Calendar, Clock, Package, ArrowLeft, ExternalLink } from "lucide-react";
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
  scheduled_date: string;
  scheduled_time: string;
  created_at: string;
  service_details: any;
  service_address?: any;
  payment_type?: string;
  final_total?: number;
  frequency?: string;
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId || sessionId) {
      fetchOrderDetails();
    } else {
      toast.error("No order information found");
      setLoading(false);
    }
  }, [orderId, sessionId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-order-details', {
        body: { 
          order_id: orderId,
          session_id: sessionId
        }
      });

      if (error || !data?.order) {
        toast.error("Order not found");
        setLoading(false);
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'confirmed':
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCheckStatus = () => {
    navigate(`/order-status?order_id=${order?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your order details...</p>
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
                We couldn't find your order. Please check your order ID or try again.
              </p>
              <Button onClick={handleBackToHome}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Success Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription className="text-green-100">
                Your cleaning service has been booked. Order ID: {order.id}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Order Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                </Badge>
              </div>

              {/* Service Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <User className="h-5 w-5 text-primary" />
                    Customer Information
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {order.customer_name}</p>
                    <p><strong>Email:</strong> {order.customer_email}</p>
                    {order.customer_phone && (
                      <p><strong>Phone:</strong> {order.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Package className="h-5 w-5 text-primary" />
                    Service Details
                  </div>
                   <div className="space-y-2 text-sm">
                     <p><strong>Service Type:</strong> {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                     <p><strong>Frequency:</strong> {order.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'One-time'}</p>
                     <p><strong>Scheduled Date:</strong> {formatDate(order.scheduled_date)}</p>
                     {order.scheduled_time && (
                       <p><strong>Scheduled Time:</strong> {order.scheduled_time}</p>
                     )}
                     <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                       <p className="text-amber-800 dark:text-amber-200 font-semibold">
                         <strong>Payment:</strong> {order.payment_type === 'pay_after_service' ? 'Pay After Service' : '25% Now + 75% After Service'}
                       </p>
                       <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                         Total Amount: ${((order.final_total || order.amount) / 100).toFixed(2)}
                       </p>
                     </div>
                   </div>
                </div>
              </div>

              {/* Service Address */}
              {(order.service_address || order.service_details?.serviceAddress) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="h-5 w-5 text-primary" />
                    Service Address
                  </div>
                  <div className="text-sm bg-muted/30 p-4 rounded-lg">
                    <p>
                      {(order.service_address?.street || order.service_details?.serviceAddress?.street)}
                      {(order.service_address?.apartment || order.service_details?.serviceAddress?.apartment) && 
                        `, ${order.service_address?.apartment || order.service_details?.serviceAddress?.apartment}`
                      }
                    </p>
                    <p>
                      {(order.service_address?.city || order.service_details?.serviceAddress?.city)}, {' '}
                      {(order.service_address?.state || order.service_details?.serviceAddress?.state)} {' '}
                      {(order.service_address?.zipCode || order.service_details?.serviceAddress?.zipCode)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Order Confirmation Email
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  You'll receive a confirmation email shortly with all the details of your booking.
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Service Scheduling
                </h4>
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Our team will contact you within 24 hours to confirm your service details and finalize the schedule.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Track Your Order
                </h4>
                <p className="text-purple-800 dark:text-purple-200 text-sm">
                  You can check your order status anytime using your order ID or email address.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleBackToHome} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={handleCheckStatus} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Track Order Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}