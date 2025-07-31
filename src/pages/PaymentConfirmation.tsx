import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, Home, FileText, ArrowRight } from "lucide-react";
import ModernScheduler from "@/components/ModernScheduler";
import { PostPaymentForm } from "@/components/PostPaymentForm";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsCompleted, setDetailsCompleted] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails();
    }
  }, [sessionId]);

  const fetchOrderDetails = async () => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        setError('Order not found');
        return;
      }

      setOrderDetails(data);
      
      // Check if service details are complete
      const serviceDetails = data.service_details as any;
      const hasAddress = serviceDetails?.serviceAddress?.street || serviceDetails?.address?.street;
      setDetailsCompleted(!!hasAddress);
      setIsScheduled(!!data.scheduled_date);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsComplete = () => {
    setDetailsCompleted(true);
    setShowDetailsForm(false);
    fetchOrderDetails(); // Refresh order details
    toast.success('Service details completed successfully!');
  };

  const handleSchedulingComplete = (data: { scheduled_date: string; scheduled_time: string }) => {
    setIsScheduled(true);
    setIsScheduling(false);
    toast.success('Your service has been scheduled successfully!');
    
    // Update order details with scheduling info
    setOrderDetails(prev => ({
      ...prev,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time
    }));
    
    // Refresh order details to get updated data
    fetchOrderDetails();
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

  if (error || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <h2 className="text-xl font-bold mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">{error || 'No session ID provided. Please return to the homepage and try again.'}</p>
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

          {/* Progress Indicator */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Payment</span>
                  </div>
                  <div className="h-px w-8 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    {detailsCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-primary bg-white text-xs flex items-center justify-center">2</div>
                    )}
                    <span className={`text-sm font-medium ${detailsCompleted ? 'text-green-600' : 'text-primary'}`}>
                      Details
                    </span>
                  </div>
                  <div className="h-px w-8 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    {isScheduled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white text-xs flex items-center justify-center text-gray-400">3</div>
                    )}
                    <span className={`text-sm font-medium ${isScheduled ? 'text-green-600' : 'text-gray-400'}`}>
                      Schedule
                    </span>
                  </div>
                </div>
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

          {/* Service Details Form */}
          {!detailsCompleted && !showDetailsForm && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complete Service Details
                </CardTitle>
                <CardDescription>
                  We need a few more details to prepare for your cleaning service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Please provide your service address and any special instructions for our team.
                  </p>
                  <Button 
                    onClick={() => setShowDetailsForm(true)}
                    size="lg"
                    className="px-8"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Form */}
          {showDetailsForm && (
            <PostPaymentForm 
              sessionId={sessionId}
              onComplete={handleDetailsComplete}
            />
          )}

          {/* Scheduling Section */}
          {detailsCompleted && !isScheduled && !isScheduling && (
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
                    Now that your payment is confirmed and details are complete, let's schedule your cleaning service.
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
                <ModernScheduler 
                  serviceType={orderDetails?.service_details?.cleaning_type || "Deep Clean"}
                  sessionId={sessionId}
                  onComplete={handleSchedulingComplete}
                />
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    onClick={() => setIsScheduling(false)}
                    className="w-full sm:w-auto"
                  >
                    Back to Details
                  </Button>
                </div>
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