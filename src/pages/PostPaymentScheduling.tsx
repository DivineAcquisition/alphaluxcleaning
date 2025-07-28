import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import VisualScheduler from "@/components/VisualScheduler";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function PostPaymentScheduling() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Allow admin/manager access without session_id for testing
      if (!sessionId && (userRole === 'admin' || userRole === 'employee')) {
        setIsAdminView(true);
        setOrderDetails({
          cleaning_type: 'general',
          frequency: 'weekly',
          amount: 15000 // $150.00 example
        });
        setLoading(false);
        return;
      }

      if (!sessionId) {
        toast.error("No session ID found");
        navigate("/");
        return;
      }

      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .limit(1);

        if (error) throw error;

        if (orders && orders.length > 0) {
          setOrderDetails(orders[0]);
        } else {
          toast.error("Order not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, navigate, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Card */}
          <Card className="shadow-xl mb-8">
            <CardHeader className="text-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16" />
              </div>
              <CardTitle className="text-3xl mb-2">
                {isAdminView ? "Admin Preview" : "Payment Complete!"}
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg">
                {isAdminView 
                  ? "Preview of the post-payment scheduling flow" 
                  : `Now let's schedule your ${orderDetails?.cleaning_type} cleaning service`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Next Step: Choose Your Preferred Date & Time
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Select from our available time slots below. Our live calendar shows real-time availability 
                  to ensure your preferred time is confirmed instantly.
                </p>
                
                {orderDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-primary">Service Type</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {orderDetails.cleaning_type}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-primary">Frequency</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {orderDetails.frequency || 'One-time'}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-primary">Amount Paid</p>
                      <p className="text-sm text-muted-foreground">
                        ${(orderDetails.amount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Section */}
          <div className="grid gap-6">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Schedule Your Service
                </CardTitle>
                <CardDescription>
                  Select your preferred date and time slot from our live calendar
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <VisualScheduler 
                  serviceType={orderDetails?.cleaning_type} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/payment-success")} 
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payment Confirmation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}