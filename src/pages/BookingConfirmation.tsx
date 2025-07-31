import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Calendar, Clock, MapPin, Home, User, FileText, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BookingConfirmation = () => {
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

      // Check if scheduling is complete
      if (!data.scheduled_date) {
        toast.error("Please schedule your service first");
        navigate(`/schedule-service?session_id=${sessionId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading confirmation details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const serviceDetails = orderDetails?.service_details as any;
  const address = serviceDetails?.serviceAddress || serviceDetails?.address;
  const property = serviceDetails?.property;
  const instructions = serviceDetails?.instructions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Success Header */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-green-800">Booking Confirmed!</h1>
                <p className="text-green-600 text-lg">
                  Your cleaning service has been successfully scheduled and confirmed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Date & Time */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6 text-primary" />
                Scheduled Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    {new Date(orderDetails.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    {orderDetails.scheduled_time}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
              <CardDescription>Order ID: {orderDetails.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Service Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Service Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Service Type:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}</p>
                  <p><strong>Frequency:</strong> {orderDetails.frequency}</p>
                  <p><strong>Square Footage:</strong> {orderDetails.square_footage} sq ft</p>
                  <p><strong>Amount Paid:</strong> ${(orderDetails.amount / 100).toFixed(2)}</p>
                  {orderDetails.add_ons && orderDetails.add_ons.length > 0 && (
                    <p><strong>Add-ons:</strong> {orderDetails.add_ons.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <strong>Name:</strong> {orderDetails.customer_name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <strong>Email:</strong> {orderDetails.customer_email}
                  </p>
                  {orderDetails.customer_phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <strong>Phone:</strong> {orderDetails.customer_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Service Address */}
              {address && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Address
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p>{address.street}</p>
                    {address.apartment && <p>{address.apartment}</p>}
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                  </div>
                </div>
              )}

              {/* Property Details */}
              {property && (
                <div>
                  <h4 className="font-semibold mb-3">Property Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {property.dwellingType && (
                      <p><strong>Dwelling Type:</strong> {property.dwellingType}</p>
                    )}
                    {property.primaryFlooringType && (
                      <p><strong>Primary Flooring:</strong> {property.primaryFlooringType}</p>
                    )}
                    {property.flooringTypes && property.flooringTypes.length > 0 && (
                      <p><strong>All Flooring Types:</strong> {property.flooringTypes.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {instructions && (
                <div>
                  <h4 className="font-semibold mb-3">Special Instructions</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {instructions.access && (
                      <p><strong>Access Instructions:</strong> {instructions.access}</p>
                    )}
                    {instructions.parking && (
                      <p><strong>Parking Instructions:</strong> {instructions.parking}</p>
                    )}
                    {instructions.special && (
                      <p><strong>Special Requests:</strong> {instructions.special}</p>
                    )}
                    {instructions.pets && (
                      <p><strong>Pets:</strong> Pets will be present during cleaning</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-blue-700">
              <p>• You'll receive a confirmation email with all the details</p>
              <p>• Our team will arrive at your scheduled time</p>
              <p>• You can manage your booking in the customer portal</p>
              <p>• We'll send you reminders before your appointment</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/my-services')}
              size="lg"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              View My Services
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              size="lg"
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

export default BookingConfirmation;