import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Calendar, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ModernScheduler from "@/components/ModernScheduler";
import { useAuth } from "@/contexts/AuthContext";

const ScheduleService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { user, userRole } = useAuth();

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
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

          {/* Service Summary */}
          {orderDetails && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Service Summary</CardTitle>
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
            <CardContent className="p-4 sm:p-6">
              <div className="w-full min-h-[600px] sm:min-h-[800px] relative rounded-lg overflow-hidden">
                <iframe 
                  src="https://app.bayareacleaningpros.com/widget/booking/39tuCeWMXzsnqMcYpkCD" 
                  style={{ 
                    width: '100%', 
                    height: '600px',
                    border: 'none', 
                    overflow: 'hidden' 
                  }}
                  className="sm:h-[800px] rounded-lg"
                  scrolling="no" 
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

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between px-4 sm:px-0">
            <Button 
              variant="outline"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleService;