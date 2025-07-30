import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, Home } from "lucide-react";
import ModernScheduler from "@/components/ModernScheduler";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (sessionId && orderId) {
      fetchOrderDetails();
    }
  }, [sessionId, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderDetails(data);
      setIsScheduled(!!data.scheduled_date);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleSchedulingComplete = (schedulingData: any) => {
    setIsScheduled(true);
    setIsScheduling(false);
    toast.success('Your service has been scheduled successfully!');
    
    // Update order details with scheduling info
    setOrderDetails(prev => ({
      ...prev,
      scheduled_date: schedulingData.scheduledDate,
      scheduled_time: schedulingData.scheduledTime
    }));
  };

  if (!sessionId || !orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <h2 className="text-xl font-bold mb-4">Invalid Payment Session</h2>
              <p className="text-muted-foreground mb-6">This payment confirmation link is invalid or has expired.</p>
              <Button onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Return Home
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
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Payment Success */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-green-800">Payment Successful!</h1>
                <p className="text-green-600 text-lg">
                  Your payment has been processed and your cleaning service is confirmed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {orderDetails && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Order Details
                </CardTitle>
                <CardDescription>Order ID: {orderDetails.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Service Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Type:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}</p>
                      <p><strong>Frequency:</strong> {orderDetails.frequency}</p>
                      <p><strong>Square Footage:</strong> {orderDetails.square_footage} sq ft</p>
                      <p><strong>Amount Paid:</strong> ${(orderDetails.amount / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {orderDetails.customer_name}</p>
                      <p><strong>Email:</strong> {orderDetails.customer_email}</p>
                      {orderDetails.customer_phone && (
                        <p><strong>Phone:</strong> {orderDetails.customer_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduling Section */}
          {!isScheduled && !isScheduling && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Your Service
                </CardTitle>
                <CardDescription>
                  Choose your preferred date and time for your cleaning service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Now that your payment is confirmed, let's schedule your cleaning service.
                  </p>
                  <Button 
                    onClick={() => setIsScheduling(true)}
                    size="lg"
                    className="px-8"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduler */}
          {isScheduling && orderDetails && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Choose Your Preferred Date & Time</CardTitle>
                <CardDescription>
                  Select a convenient time for your cleaning service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModernScheduler />
              </CardContent>
            </Card>
          )}

          {/* Scheduled Confirmation */}
          {isScheduled && orderDetails?.scheduled_date && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-800">Service Scheduled!</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">
                        {new Date(orderDetails.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">{orderDetails.scheduled_time}</span>
                    </div>
                  </div>
                  <p className="text-blue-600">
                    You'll receive a confirmation email with all the details.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-services')}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              View My Services
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;