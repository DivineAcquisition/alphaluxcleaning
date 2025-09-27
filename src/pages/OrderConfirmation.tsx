import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
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
  const { 
    trackPurchase, 
    trackCustomPurchase, 
    trackViewContent,
    trackLead 
  } = useFacebookPixel();

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
            service_type: 'deep_clean',
            frequency: 'one_time',
            sqft_or_bedrooms: '2000 sq ft',
            est_price: 29900,
            service_date: '2025-08-05',
            time_slot: '10:00 AM - 12:00 PM',
            customers: {
              name: 'Admin Preview User',
              email: 'admin@bayareacleaningpros.com',
              phone: '(555) 123-4567'
            },
            service_details: {
              serviceAddress: {
                street: '123 Admin Street',
                apartment: 'Unit 4B',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102'
              },
              instructions: {
                access: 'Key under doormat',
                parking: 'Street parking available',
                special: 'Extra attention to kitchen and bathrooms',
                pets: true
              }
            },
            addons: {
              inside_oven: true,
              inside_fridge: true
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
      
        // Track ViewContent event
        trackViewContent({
          content_name: `Order Confirmation - ${serviceType}`,
          content_type: 'order_confirmation',
          value: serviceValue,
          currency: 'USD'
        });

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

        // Track CompleteRegistration event (for customer account creation)
        if (window.fbq) {
          window.fbq('track', 'CompleteRegistration', {
            content_name: 'Customer Account Created',
            value: serviceValue,
            currency: 'USD',
            registration_method: 'post_purchase_auto'
          });
        }

        // Track High Value Purchase custom event (for orders > $200)
        if (serviceValue > 200) {
          if (window.fbq) {
            window.fbq('trackCustom', 'HighValuePurchase', {
              value: serviceValue,
              currency: 'USD',
              service_category: data.service_type,
              customer_segment: 'premium',
              geographic_market: data.customer?.state
            });
          }
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
    if (!orderDetails?.service_date && !orderDetails?.scheduled_date) return; // ensure scheduled
    
    const zapierKey = `zapier_booking_sent_${identifier}`;
    const webhookKey = `webhook_booking_sent_${identifier}`;
    const adminKey = `admin_notified_${identifier}`;
    const accountKey = `customer_account_created_${identifier}`;
    
    try {
      if (typeof window !== 'undefined') {
        // Create customer account automatically (new functionality)
        if (!localStorage.getItem(accountKey) && (orderDetails.customer_email || orderDetails.customers?.email)) {
          (async () => {
            try {
              const customerEmail = orderDetails.customer_email || orderDetails.customers?.email;
              const customerName = orderDetails.customer_name || orderDetails.customers?.name;
              const customerPhone = orderDetails.customer_phone || orderDetails.customers?.phone;
              
              const { data: accountResult } = await supabase.functions.invoke('create-customer-account', {
                body: { 
                  customerEmail,
                  customerName,
                  customerPhone,
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
    const serviceDate = orderDetails.service_date || orderDetails.scheduled_date;
    const timeSlot = orderDetails.time_slot || orderDetails.scheduled_time;
    
    const details = `
Cleaning Service - Booking Confirmed

📅 Service Date: ${new Date(serviceDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
⏰ Service Time: ${timeSlot}
📋 Order ID: ${orderDetails.id}
💰 Amount Paid: $${(orderDetails.est_price / 100).toFixed(2)}

Customer: ${orderDetails.customers?.name || orderDetails.name || 'N/A'}
Email: ${orderDetails.customers?.email || orderDetails.email || 'N/A'}
${(orderDetails.customers?.phone || orderDetails.phone) ? `Phone: ${orderDetails.customers?.phone || orderDetails.phone}` : ''}

Questions? Call (857) 754-4557
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
    const serviceDate = orderDetails.service_date || orderDetails.scheduled_date;
    const timeSlot = orderDetails.time_slot || orderDetails.scheduled_time;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bay Area Cleaning Pros - Booking Confirmed',
          text: `Service scheduled for ${new Date(serviceDate).toLocaleDateString()} at ${timeSlot}`,
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
    // Prefer session_id or payment_intent for reliable lookup
    const sessionIdFromUrl = searchParams.get('session_id');
    const sessionIdFromOrder = orderDetails?.stripe_checkout_session_id || orderDetails?.stripe_session_id;
    const paymentIntent = orderDetails?.stripe_payment_intent_id;
    const customerEmail = orderDetails?.customers?.email || orderDetails?.email;

    if (sessionIdFromUrl) {
      navigate(`/order-status?session_id=${sessionIdFromUrl}`);
    } else if (sessionIdFromOrder) {
      navigate(`/order-status?session_id=${sessionIdFromOrder}`);
    } else if (paymentIntent) {
      navigate(`/order-status?payment_intent=${paymentIntent}`);
    } else if (customerEmail) {
      navigate(`/order-status?email=${customerEmail}`);
    } else {
      navigate('/order-status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-xl border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-xl border p-8 text-center">
              <p className="text-muted-foreground">Order not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const serviceDate = orderDetails.service_date || orderDetails.scheduled_date;
  const timeSlot = orderDetails.time_slot || orderDetails.scheduled_time;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Booking Confirmed
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thank you for choosing Bay Area Cleaning Pros! Your cleaning service has been successfully booked.
          </p>
        </div>

        {/* Card Grid Layout */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-12">
          
          {/* What's Next Card */}
          <div className="lg:col-span-2 xl:col-span-3 bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">What's Next?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Service Confirmed</h3>
                  <p className="text-sm text-muted-foreground">
                    Your cleaning is scheduled for {new Date(serviceDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })} at {timeSlot}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Team Dispatch</h3>
                  <p className="text-sm text-muted-foreground">
                    Our professional team will arrive with all supplies and equipment
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Enjoy Clean Space</h3>
                  <p className="text-sm text-muted-foreground">
                    Relax while we transform your space with updates throughout
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              <h2 className="text-lg font-semibold text-foreground">Payment Confirmed</h2>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-bold text-foreground">
                ${(orderDetails.est_price / 100).toFixed(2)}
              </p>
              <p className="text-sm text-green-600 font-medium">
                Payment successfully processed
              </p>
              <p className="text-xs text-muted-foreground">
                Receipt sent to {orderDetails.customers?.email || orderDetails.email || 'your email'}
              </p>
            </div>
          </div>

          {/* Scheduled Service Card */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Service Scheduled</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date(serviceDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Time Window</p>
                <p className="text-lg font-semibold text-foreground">
                  {timeSlot}
                </p>
              </div>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <Home className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Service Details</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Type</span>
                <span className="font-medium text-foreground capitalize">
                  {orderDetails.service_type?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground capitalize">
                  {orderDetails.frequency?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium text-foreground">
                  {orderDetails.sqft_or_bedrooms || 'N/A'}
                </span>
              </div>
              {orderDetails.addons && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground text-sm mb-2">Add-ons</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(orderDetails.addons)
                      .filter(([_, selected]) => selected)
                      .map(([addon, _]) => (
                        <span key={addon} className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md capitalize">
                          {addon.replace(/_/g, ' ')}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Customer Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">
                  {orderDetails.customers?.name || orderDetails.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground text-sm">
                  {orderDetails.customers?.email || orderDetails.email || 'N/A'}
                </span>
              </div>
              {(orderDetails.customers?.phone || orderDetails.phone) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">
                    {orderDetails.customers?.phone || orderDetails.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Service Address Card */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Service Address</h2>
            </div>
            <div>
              {orderDetails.service_details?.serviceAddress ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {orderDetails.service_details.serviceAddress.street}
                    {orderDetails.service_details.serviceAddress.apartment && 
                      `, ${orderDetails.service_details.serviceAddress.apartment}`
                    }
                  </p>
                  <p className="text-muted-foreground">
                    {orderDetails.service_details.serviceAddress.city}, {orderDetails.service_details.serviceAddress.state} {orderDetails.service_details.serviceAddress.zipCode}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Address not available</p>
              )}
            </div>
          </div>

          {/* Special Instructions Card */}
          {orderDetails.service_details?.instructions && (
            <div className="lg:col-span-2 xl:col-span-3 bg-card rounded-xl border p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Special Instructions</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orderDetails.service_details.instructions.access && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Access Instructions</p>
                    <p className="text-foreground">{orderDetails.service_details.instructions.access}</p>
                  </div>
                )}
                {orderDetails.service_details.instructions.parking && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Parking</p>
                    <p className="text-foreground">{orderDetails.service_details.instructions.parking}</p>
                  </div>
                )}
                {orderDetails.service_details.instructions.special && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Special Notes</p>
                    <p className="text-foreground">{orderDetails.service_details.instructions.special}</p>
                  </div>
                )}
                {orderDetails.service_details.instructions.pets && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Pets</p>
                    <p className="text-foreground">Pets present in the home</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-card rounded-xl border p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Need Help or Want to Share?
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl mx-auto mb-8">
            <Button 
              onClick={handleCopyDetails}
              variant="outline" 
              className="w-full"
            >
              {isCopied ? <CheckCheck className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {isCopied ? 'Copied!' : 'Copy Details'}
            </Button>
            
            <Button 
              onClick={handleShare}
              variant="outline" 
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Booking
            </Button>
            
            <Button 
              onClick={handleViewOrderStatus}
              variant="outline" 
              className="w-full sm:col-span-2 lg:col-span-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Status
            </Button>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-muted-foreground mb-4">
              Questions? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button 
                asChild
                variant="outline" 
                size="sm"
              >
                <a href="mailto:support@bayareacleaningpros.com">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </a>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="sm"
              >
                <a href="tel:8577544557">
                  <Phone className="h-4 w-4 mr-2" />
                  Call (857) 754-4557
                </a>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="sm"
              >
                <a href="sms:2818099901?body=Hi, I need live support for my cleaning service booking.">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text Support
                </a>
              </Button>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Book Again
            </Button>
          </div>
        </div>

        {/* Referral Section */}
        <div className="mt-8">
          <PostPaymentReferralSection 
            customerEmail={orderDetails?.customers?.email || orderDetails?.customer_email}
            customerName={orderDetails?.customers?.name || orderDetails?.customer_name}
            onReferralGenerated={(code: string) => {
              trackLead('Referral Code Generated', orderDetails?.est_price ? orderDetails.est_price / 100 : 0);
            }}
          />
        </div>
      </div>
    </div>
  );
}