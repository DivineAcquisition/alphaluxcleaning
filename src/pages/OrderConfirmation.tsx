import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Calendar, Clock, MapPin, Home, User, FileText, Mail, Phone, MessageSquare, Copy, Share2, CheckCheck, ExternalLink } from "lucide-react";
import { PostPaymentReferralSection } from "@/components/PostPaymentReferralSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  
  // Support both URL patterns: /order-confirmation/:bookingId and /order-confirmation?order_id=xxx&session_id=xxx
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id') || bookingId;

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { trackPurchase, trackCustomPurchase } = useFacebookPixel();

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
  }, [sessionId, orderId, navigate, searchParams]);

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
          .from("bookings")
          .select(`
            *,
            customers(*)
          `)
          .eq("stripe_checkout_session_id", sessionId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      // If no data found and we have orderId, try fetching by order ID (new flow)
      if ((!data || error) && orderId) {
        const result = await supabase
          .from("bookings")
          .select(`
            *,
            customers(*)
          `)
          .eq("id", orderId)
          .maybeSingle();
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
      if (!data.service_date) {
        toast.error("Please schedule your service first");
        if (sessionId) {
          navigate(`/schedule-service?session_id=${sessionId}`);
        } else {
          navigate(`/schedule-service?order_id=${orderId}`);
        }
        return;
      }

      setOrderDetails(data);
      
        // Track Facebook Pixel Purchase event
        if (data) {
          const serviceValue = data.est_price / 100; // Convert cents to dollars
          const serviceType = data.service_type?.replace(/_/g, ' ') || 'Cleaning Service';
        
        // Standard Purchase event
        trackPurchase({
          value: serviceValue,
          currency: 'USD',
          content_type: 'service',
          content_name: serviceType,
          event_id: data.id
        });
        
        // Custom Purchase event with MRR/ARR for recurring services
        if (data.frequency && data.frequency !== 'one_time') {
          // Calculate estimated MRR/ARR based on frequency
          let mrrEstimate = 0;
          let arrEstimate = 0;
          
          if (data.frequency === 'weekly') {
            mrrEstimate = serviceValue * 4.3; // ~4.3 weeks per month
            arrEstimate = mrrEstimate * 12;
          } else if (data.frequency === 'biweekly' || data.frequency === 'bi_weekly') {
            mrrEstimate = serviceValue * 2.15; // ~2.15 bi-weekly per month
            arrEstimate = mrrEstimate * 12;
          } else if (data.frequency === 'monthly') {
            mrrEstimate = serviceValue;
            arrEstimate = serviceValue * 12;
          }
          
          trackCustomPurchase({
            value: serviceValue,
            currency: 'USD',
            mrr_est: mrrEstimate,
            arr_est: arrEstimate,
            booking_id: data.id
          });
        }
      }
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

  const handleCopyDetails = async () => {
    const details = `
Bay Area Cleaning Pros - Booking Confirmed

📅 Service Date: ${new Date(orderDetails.service_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
⏰ Service Time: ${orderDetails.time_slot}
📋 Order ID: ${orderDetails.id}
💰 Amount Paid: $${(orderDetails.est_price / 100).toFixed(2)}

Customer: ${orderDetails.customers?.name || 'N/A'}
Email: ${orderDetails.customers?.email || 'N/A'}
${orderDetails.customers?.phone ? `Phone: ${orderDetails.customers.phone}` : ''}

Questions? Call (281) 809-9901
    `.trim();

    try {
      await navigator.clipboard.writeText(details);
      setIsCopied(true);
      toast.success('Booking details copied to clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy details');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bay Area Cleaning Pros - Booking Confirmed',
          text: `Service scheduled for ${new Date(orderDetails.service_date).toLocaleDateString()} at ${orderDetails.time_slot}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyDetails();
    }
  };

  const handleViewOrderStatus = () => {
    const identifier = sessionId || orderId;
    if (identifier) {
      navigate(`/order-status?${sessionId ? 'session_id' : 'order_id'}=${identifier}`);
    } else {
      navigate('/order-status');
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
                  Your cleaning service has been successfully scheduled and payment has been received.
                </p>
                
                {/* Team Contact Notice */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">What's Next?</span>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p className="font-medium">🤝 One of our team members will reach out for confirmation</p>
                    <p>📧 Check your email for booking confirmation details</p>
                    <p>📱 Check your text messages for updates</p>
                  </div>
                </div>
                
                {/* Payment Status */}
                {orderDetails && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">
                        {orderDetails.balance_due > 0 ? 'Deposit Paid' : 'Payment Complete'}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Total Service Cost:</strong> ${(orderDetails.est_price / 100).toFixed(2)}</p>
                      {orderDetails.deposit_amount && (
                        <p><strong>Amount Paid:</strong> ${(orderDetails.deposit_amount / 100).toFixed(2)}</p>
                      )}
                      {orderDetails.balance_due && orderDetails.balance_due > 0 && (
                        <>
                          <p><strong>Remaining Balance:</strong> ${(orderDetails.balance_due / 100).toFixed(2)}</p>
                          <p className="text-xs italic mt-2">Remaining balance will be collected after service completion.</p>
                        </>
                      )}
                      {(!orderDetails.balance_due || orderDetails.balance_due === 0) && (
                        <p className="text-xs italic mt-2 font-medium text-green-700">✓ Service is fully paid for!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Date & Time */}
          {orderDetails && (
            <>
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
                        {new Date(orderDetails.service_date).toLocaleDateString('en-US', {
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wide">Service Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Type:</span>
                            <span className="font-medium capitalize">{orderDetails.cleaning_type?.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frequency:</span>
                            <span className="font-medium capitalize">{orderDetails.frequency?.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Square Footage:</span>
                            <span className="font-medium">{orderDetails.square_footage} sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono text-sm">{orderDetails.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wide">Customer Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{orderDetails.customer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{orderDetails.customer_email}</span>
                          </div>
                          {orderDetails.customer_phone && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="font-medium">{orderDetails.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Address */}
                  {address && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wide flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Service Address
                      </h4>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="font-medium">{address.street}</p>
                        {address.apartment && <p className="text-muted-foreground">{address.apartment}</p>}
                        <p className="text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {instructions && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wide">Special Instructions</h4>
                      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        {instructions.access && (
                          <div>
                            <span className="font-medium">Access: </span>
                            <span className="text-muted-foreground">{instructions.access}</span>
                          </div>
                        )}
                        {instructions.parking && (
                          <div>
                            <span className="font-medium">Parking: </span>
                            <span className="text-muted-foreground">{instructions.parking}</span>
                          </div>
                        )}
                        {instructions.special && (
                          <div>
                            <span className="font-medium">Special Notes: </span>
                            <span className="text-muted-foreground">{instructions.special}</span>
                          </div>
                        )}
                        {instructions.pets && (
                          <div>
                            <span className="font-medium text-orange-600">🐾 Pets Present</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleCopyDetails} variant="outline" className="flex items-center gap-2">
                        {isCopied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {isCopied ? 'Copied!' : 'Copy Details'}
                      </Button>
                      
                      <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Booking
                      </Button>
                      
                      <Button onClick={handleViewOrderStatus} variant="outline" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        View Status
                      </Button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={() => navigate('/')} variant="outline" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Book Again
                      </Button>
                      
                      <Button onClick={() => navigate('/customer-dashboard')} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Portal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Section */}
              <PostPaymentReferralSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}