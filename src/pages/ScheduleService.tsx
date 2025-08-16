import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Calendar, ArrowLeft, ArrowRight, Clock, MessageSquare, CheckCircle, XCircle, AlertCircle, Package, Plus, DollarSign, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ModernScheduler from "@/components/ModernScheduler";
import { useAuth } from "@/contexts/AuthContext";
import { OrderStatusLookup } from "@/components/OrderStatusLookup";
import { useIsMobile } from "@/hooks/use-mobile";
import NextDayBookingDialog from "@/components/NextDayBookingDialog";

const ScheduleService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const { user, userRole } = useAuth();
  const isMobile = useIsMobile();

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'in_progress':
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
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'scheduled':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };


  const handleTextSupport = () => {
    const phoneNumber = "+12818099901";
    const message = "Hi! I need help scheduling a better time for my cleaning service. Order ID: " + (orderDetails?.id?.slice(-8) || "");
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    
    try {
      window.open(smsUrl, '_blank');
    } catch (error) {
      // Fallback for browsers that don't support SMS links
      toast.info(`Please text ${phoneNumber} for scheduling assistance`);
    }
  };
  

  useEffect(() => {
    // Check if admin preview mode
    const isAdminPreview = searchParams.get('admin_preview');
    if (isAdminPreview) {
      checkAdminAccess();
      return;
    }

    if (!sessionId && !orderId) {
      toast.error("No session or order ID found. Redirecting...");
      const hostname = window.location.hostname;
      if (hostname.startsWith('portal.')) {
        navigate('/customer-portal-dashboard');
      } else {
        navigate('/instant-quote');
      }
      return;
    }
    fetchOrderDetails();
  }, [sessionId, navigate, searchParams]);


  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });
        
        if (userRole === 'super_admin') {
          // Set mock order data for admin preview
          setOrderDetails({
            id: 'admin-preview-order',
            cleaning_type: 'deep_clean',
            frequency: 'one_time',
            square_footage: 2000,
            customer_name: 'Admin Preview User',
            customer_email: 'admin@bayareacleaningpros.com',
            service_details: {
              serviceAddress: {
                street: '123 Admin Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102'
              }
            }
          });
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log("Not admin");
    }
    
    // Fallback to regular flow
    navigate('/');
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      let data, error;
      
      // Try to fetch by session_id first (existing flow)
      if (sessionId) {
        const result = await supabase
          .from("orders")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();
        data = result.data;
        error = result.error;
      }
      
      // If no data found and we have orderId, try fetching by order ID (new flow)
      if ((!data || error) && orderId) {
        const result = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        toast.error("Order not found");
        const hostname = window.location.hostname;
        if (hostname.startsWith('portal.')) {
          navigate('/customer-portal-dashboard');
        } else {
          navigate('/instant-quote');
        }
        return;
      }

      // Check if service details are complete
      const serviceDetails = data.service_details as any;
      const hasAddress = serviceDetails?.serviceAddress?.street || serviceDetails?.address?.street;
      
      if (!hasAddress) {
        toast.error("Please complete service details first");
        if (sessionId) {
          navigate(`/service-details?session_id=${sessionId}`);
        } else {
          navigate(`/service-details?order_id=${orderId}`);
        }
        return;
      }

      setOrderDetails(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      const hostname = window.location.hostname;
      if (hostname.startsWith('portal.')) {
        navigate('/customer-portal-dashboard');
      } else {
        navigate('/instant-quote');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulingComplete = (data: { scheduled_date: string; scheduled_time: string }) => {
    toast.success('Your service has been scheduled successfully!');
    
    // Check if admin preview mode
    const isAdminPreview = searchParams.get('admin_preview');
    if (isAdminPreview) {
      navigate('/booking-confirmation?admin_preview=true');
    } else if (sessionId) {
      navigate(`/booking-confirmation?session_id=${sessionId}`);
    } else {
      navigate(`/booking-confirmation?order_id=${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading scheduling options...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="max-w-full mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Your Service
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Choose your preferred date and time for your cleaning service
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Order Status Display */}
          {orderDetails && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Current Order Status
                    </CardTitle>
                    <CardDescription>Order #{orderDetails.id?.slice(-8) || 'Preview'}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(orderDetails.status || 'pending')}>
                    {getStatusIcon(orderDetails.status || 'pending')}
                    <span className="ml-1 capitalize">{(orderDetails.status || 'pending').replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p><strong>Service Type:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Frequency:</strong> {orderDetails.frequency}</p>
                    <p><strong>Square Footage:</strong> {orderDetails.square_footage} sq ft</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Customer:</strong> {orderDetails.customer_name}</p>
                    <p><strong>Email:</strong> {orderDetails.customer_email}</p>
                    {orderDetails.service_details?.serviceAddress && (
                      <p><strong>Address:</strong> {orderDetails.service_details.serviceAddress.street}, {orderDetails.service_details.serviceAddress.city}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Booking Options */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Booking Options</CardTitle>
              <CardDescription>Need immediate service or different scheduling?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NextDayBookingDialog>
                  <Button 
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <span className="font-semibold">Book for Next Day</span>
                    </div>
                    <div className="text-sm opacity-90 text-center">
                      Priority scheduling available
                    </div>
                    <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                      <DollarSign className="h-3 w-3" />
                      <span>+$50 rush fee</span>
                    </div>
                  </Button>
                </NextDayBookingDialog>

                <Button 
                  variant="outline"
                  onClick={handleTextSupport}
                  className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:bg-accent/10"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-semibold">Text for Better Time</span>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Get personalized scheduling help
                  </div>
                  <div className="text-sm font-medium text-primary">
                    +1 (281) 809-9901
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Embedded Calendar Scheduler */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Your Service
              </CardTitle>
              <CardDescription>
                Select your preferred date and time using our booking calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full min-h-[500px] h-auto relative">
                <iframe 
                  src="https://app.bayareacleaningpros.com/widget/booking/39tuCeWMXzsnqMcYpkCD" 
                  style={{ 
                    width: '100%', 
                    minHeight: '500px',
                    height: isMobile ? '500px' : '800px',
                    border: 'none'
                  }}
                  className="w-full"
                  id="39tuCeWMXzsnqMcYpkCD_1754330109315"
                  title="Bay Area Cleaning Pros Booking Calendar"
                />
              </div>
              <script 
                src="https://app.bayareacleaningpros.com/js/form_embed.js" 
                type="text/javascript"
              />
            </CardContent>
          </Card>

          {/* Order Status Check */}
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Need to check on an existing order?
              </p>
              <OrderStatusLookup triggerClassName="mx-auto" />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between px-4 sm:px-0">
            <Button 
              variant="outline"
              onClick={() => {
                const isAdminPreview = searchParams.get('admin_preview');
                if (isAdminPreview) {
                  navigate('/service-details?admin_preview=true');
                } else if (sessionId) {
                  navigate(`/service-details?session_id=${sessionId}`);
                } else {
                  navigate(`/service-details?order_id=${orderId}`);
                }
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleService;