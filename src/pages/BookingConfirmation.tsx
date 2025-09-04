import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Calendar, Clock, MapPin, Home, User, FileText, Mail, Phone } from "lucide-react";
import { PostPaymentReferralSection } from "@/components/PostPaymentReferralSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        navigate('/guest-booking');
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
        
        if (userRole === 'admin') {
          // Set mock order data for admin preview
          setOrderDetails({
            id: 'admin-preview-order',
            cleaning_type: 'deep_clean',
            frequency: 'one_time',
            square_footage: 2000,
            amount: 9999,
            customer_name: 'Admin Preview User',
            customer_email: 'admin@bayareacleaningpros.com',
            customer_phone: '(555) 123-4567',
            scheduled_date: '2025-08-05',
            scheduled_time: '10:00 AM - 12:00 PM',
            service_details: {
              serviceAddress: {
                street: '123 Admin Street',
                apartment: 'Unit 4B',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102'
              },
              property: {
                dwellingType: 'house',
                flooringTypes: ['hardwood', 'carpet', 'tile'],
                primaryFlooringType: 'hardwood'
              },
              instructions: {
                access: 'Key under doormat',
                parking: 'Street parking available',
                special: 'Extra attention to kitchen and bathrooms',
                pets: true
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
          navigate('/guest-booking');
        }
        return;
      }

      // Check if scheduling is complete
      if (!data.scheduled_date) {
        toast.error("Please schedule your service first");
        if (sessionId) {
          navigate(`/schedule-service?session_id=${sessionId}`);
        } else {
          navigate(`/schedule-service?order_id=${orderId}`);
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
        navigate('/guest-booking');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send booking data and admin notifications exactly once after confirmation
  useEffect(() => {
    const identifier = sessionId || orderId;
    if (!identifier || !orderDetails) return;
    if (!orderDetails?.scheduled_date) return; // ensure scheduled
    
    const zapierKey = `zapier_booking_sent_${identifier}`;
    const webhookKey = `webhook_booking_sent_${identifier}`;
    const adminKey = `admin_notified_${identifier}`;
    const accountKey = `customer_account_created_${identifier}`;
    
    try {
      if (typeof window !== 'undefined') {
        // Create customer account automatically (new functionality)
        if (!localStorage.getItem(accountKey) && orderDetails.customer_email) {
          (async () => {
            try {
              const { data: accountResult } = await supabase.functions.invoke('create-customer-account', {
                body: { 
                  customerEmail: orderDetails.customer_email,
                  customerName: orderDetails.customer_name,
                  customerPhone: orderDetails.customer_phone,
                  orderId: orderDetails.id
                }
              });
              localStorage.setItem(accountKey, '1');
              console.log('Customer account creation processed:', accountResult);
              
              if (accountResult?.accountCreated) {
                toast.success('Welcome! Your customer account has been created. Check your email for login details.');
              }
            } catch (err) {
              console.error('Failed to create customer account', err);
            }
          })();
        }

        // Send to Zapier (existing functionality)
        if (!localStorage.getItem(zapierKey)) {
          (async () => {
            try {
              await supabase.functions.invoke('send-booking-transaction-to-zapier', {
                body: { session_id: sessionId, order_id: orderId, send_sample_data: false },
              });
              localStorage.setItem(zapierKey, '1');
              console.log('Booking data sent to Zapier');
            } catch (err) {
              console.error('Failed to send booking to Zapier', err);
            }
          })();
        }

        // Send enhanced webhook with exact format (streamlined)
        if (!localStorage.getItem(webhookKey)) {
          (async () => {
            try {
              await supabase.functions.invoke('enhanced-booking-webhook-v2', {
                body: { 
                  order_id: orderDetails.id,
                  booking_id: identifier,
                  session_id: sessionId,
                  trigger_event: 'booking_confirmation'
                }
              });
              localStorage.setItem(webhookKey, '1');
              console.log('Enhanced webhook v2 sent with exact data format');
            } catch (err) {
              console.error('Failed to send enhanced webhook v2', err);
            }
          })();
        }

        // Send admin notification (new functionality)
        if (!localStorage.getItem(adminKey)) {
          (async () => {
            try {
              await supabase.functions.invoke('send-admin-job-notification', {
                body: { 
                  booking_id: identifier, 
                  order_id: orderId 
                }
              });
              localStorage.setItem(adminKey, '1');
              console.log('Admin job notification sent');
            } catch (err) {
              console.error('Failed to send admin notification', err);
            }
          })();
        }
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [orderDetails, sessionId, orderId]);

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
              <p>• A customer account has been created for you (check your email for login details)</p>
              <p>• Our team will arrive at your scheduled time</p>
              <p>• You can manage your booking in the customer portal at <strong>portal.bayareacleaningpros.com</strong></p>
              <p>• We'll send you reminders before your appointment</p>
            </CardContent>
          </Card>

          {/* Referral Code Generation */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                🎉 Spread the Love & Earn Rewards!
              </h3>
              <p className="text-green-600">
                Generate your personal referral code and start earning when friends book with us
              </p>
            </div>
            <PostPaymentReferralSection />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => {
                const identifier = sessionId || orderId;
                const paramName = sessionId ? 'session_id' : 'order_id';
                navigate(`/order-status?${paramName}=${identifier}`);
              }}
              size="lg"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Track Your Order
            </Button>
            <Button 
              variant="outline"
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