import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Calendar, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ModernScheduler from "@/components/ModernScheduler";

const ScheduleService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      toast.error("No session ID found. Redirecting to home.");
      navigate('/');
      return;
    }
    fetchOrderDetails();
  }, [sessionId, navigate]);

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
    // Navigate to confirmation page
    navigate(`/booking-confirmation?session_id=${sessionId}`);
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
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Service Type:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Frequency:</strong> {orderDetails.frequency}</p>
                    <p><strong>Square Footage:</strong> {orderDetails.square_footage} sq ft</p>
                  </div>
                  <div>
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

          {/* Scheduler */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Choose Your Preferred Date & Time
              </CardTitle>
              <CardDescription>
                Select a convenient time for your cleaning service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderDetails && (
                <ModernScheduler 
                  serviceType={orderDetails.cleaning_type || "Deep Clean"}
                  sessionId={sessionId}
                  onComplete={handleSchedulingComplete}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              variant="outline"
              onClick={() => navigate(`/service-details?session_id=${sessionId}`)}
              className="flex items-center gap-2"
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