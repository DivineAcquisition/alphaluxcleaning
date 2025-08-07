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

    if (!sessionId) {
      toast.error("No session ID found. Redirecting to home.");
      navigate('/');
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
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (error) {
        toast.error("Order not found");
        navigate('/');
        return;
      }

      // Check if service details are complete
      const serviceDetails = data.service_details as any;
      const hasAddress = serviceDetails?.serviceAddress?.street || serviceDetails?.address?.street;
      
      if (!hasAddress) {
        toast.error("Please complete service details first");
        navigate(`/service-details?session_id=${sessionId}`);
        return;
      }

      setOrderDetails(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      navigate('/');
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
    } else {
      navigate(`/booking-confirmation?session_id=${sessionId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="px-2 sm:px-4 lg:px-6 py-4 space-y-4">
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Schedule Your Service
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm">
                Choose your preferred date and time for your cleaning service
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Order Status Display - Compact */}
          {orderDetails && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-semibold text-sm">Order #{orderDetails.id?.slice(-8) || 'Preview'}</span>
                  </div>
                  <Badge className={getStatusColor(orderDetails.status || 'pending')}>
                    {getStatusIcon(orderDetails.status || 'pending')}
                    <span className="ml-1 capitalize text-xs">{(orderDetails.status || 'pending').replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="font-medium">{orderDetails.cleaning_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{orderDetails.frequency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{orderDetails.square_footage} sq ft</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{orderDetails.customer_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Booking Options - Compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NextDayBookingDialog>
              <Button 
                size="sm"
                className="h-auto p-3 flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-semibold">Next Day (+$50)</span>
              </Button>
            </NextDayBookingDialog>

            <Button 
              variant="outline"
              size="sm"
              onClick={handleTextSupport}
              className="h-auto p-3 flex items-center gap-2 border-2 hover:bg-accent/10 w-full"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-semibold">Text Support</span>
            </Button>
          </div>
        </div>

        {/* Full Screen Calendar Scheduler */}
        <div className="flex-1 overflow-hidden">
          <iframe 
            src="https://app.bayareacleaningpros.com/widget/booking/39tuCeWMXzsnqMcYpkCD" 
            style={{ 
              width: '100%', 
              height: '100%',
              border: 'none'
            }}
            className="w-full h-full"
            id="39tuCeWMXzsnqMcYpkCD_1754330109315"
            title="Bay Area Cleaning Pros Booking Calendar"
          />
          <script 
            src="https://app.bayareacleaningpros.com/js/form_embed.js" 
            type="text/javascript"
          />
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="px-2 sm:px-4 lg:px-6 py-4 bg-background border-t">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const isAdminPreview = searchParams.get('admin_preview');
                if (isAdminPreview) {
                  navigate('/service-details?admin_preview=true');
                } else {
                  navigate(`/service-details?session_id=${sessionId}`);
                }
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Details
            </Button>
            
            <div className="text-center">
              <OrderStatusLookup triggerClassName="text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleService;