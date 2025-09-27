import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Calendar, Clock, MapPin, Home, User, FileText, Mail, Phone, MessageSquare, Copy, Share2, CheckCheck, ExternalLink } from "lucide-react";
import { PostPaymentReferralSection } from "@/components/PostPaymentReferralSection";
import { FacebookPixelDebugPanel } from "@/components/FacebookPixelDebugPanel";
import { FacebookPixelEventIndicator } from "@/components/FacebookPixelEventIndicator";
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
  const [pixelEvents, setPixelEvents] = useState<any[]>([]);
  const [trackedEvents, setTrackedEvents] = useState({
    viewContent: 'pending' as 'success' | 'pending' | 'error',
    purchase: 'pending' as 'success' | 'pending' | 'error',
    customPurchase: 'pending' as 'success' | 'pending' | 'error',
    completeRegistration: 'pending' as 'success' | 'pending' | 'error',
    highValuePurchase: 'pending' as 'success' | 'pending' | 'error'
  });
  const { 
    trackPurchase, 
    trackCustomPurchase, 
    trackViewContent,
    trackLead 
  } = useFacebookPixel();

  const addPixelEvent = (eventName: string, parameters: any, value?: number) => {
    const event = {
      eventName,
      parameters,
      timestamp: new Date(),
      status: 'success' as const,
      value
    };
    setPixelEvents(prev => [...prev, event]);
    return event;
  };

  const updateEventStatus = (eventType: keyof typeof trackedEvents, status: 'success' | 'pending' | 'error') => {
    setTrackedEvents(prev => ({ ...prev, [eventType]: status }));
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
        
          // Track ViewContent event
          updateEventStatus('viewContent', 'pending');
          trackViewContent({
            content_name: `Order Confirmation - ${serviceType}`,
            content_type: 'order_confirmation',
            value: serviceValue,
            currency: 'USD'
          });
          addPixelEvent('ViewContent', {
            content_name: `Order Confirmation - ${serviceType}`,
            content_type: 'order_confirmation',
            customer_location: `${data.customer?.city}, ${data.customer?.state}`,
            service_frequency: data.frequency
          }, serviceValue);
          updateEventStatus('viewContent', 'success');

          // Standard Purchase event
          updateEventStatus('purchase', 'pending');
          trackPurchase({
            value: serviceValue,
            currency: 'USD',
            content_type: 'service',
            content_name: serviceType,
            event_id: data.id
          });
          addPixelEvent('Purchase', {
            content_name: serviceType,
            content_type: 'cleaning_service',
            customer_location: `${data.customer?.city}, ${data.customer?.state}`,
            service_frequency: data.frequency,
            recurring_revenue: data.frequency !== 'one_time'
          }, serviceValue);
          updateEventStatus('purchase', 'success');
          
          // Custom Purchase event with MRR/ARR for recurring services
          updateEventStatus('customPurchase', 'pending');
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
            addPixelEvent('PurchaseWithRecurring', {
              mrr_estimate: mrrEstimate,
              arr_estimate: arrEstimate,
              customer_ltv_tier: mrrEstimate > 200 ? 'high' : mrrEstimate > 100 ? 'medium' : 'standard',
              booking_id: data.id
            }, serviceValue);
          }
          updateEventStatus('customPurchase', 'success');

          // Track CompleteRegistration event (for customer account creation)
          updateEventStatus('completeRegistration', 'pending');
          if (window.fbq) {
            window.fbq('track', 'CompleteRegistration', {
              content_name: 'Customer Account Created',
              value: serviceValue,
              currency: 'USD',
              registration_method: 'post_purchase_auto'
            });
            addPixelEvent('CompleteRegistration', {
              registration_method: 'post_purchase_auto',
              customer_segment: 'paying_customer'
            });
            updateEventStatus('completeRegistration', 'success');
          }

          // Track High Value Purchase custom event (for orders > $200)
          if (serviceValue > 200) {
            updateEventStatus('highValuePurchase', 'pending');
            if (window.fbq) {
              window.fbq('trackCustom', 'HighValuePurchase', {
                value: serviceValue,
                currency: 'USD',
                service_category: data.service_type,
                customer_segment: 'premium',
                geographic_market: data.customer?.state
              });
              addPixelEvent('HighValuePurchase', {
                service_category: data.service_type,
                customer_segment: 'premium',
                geographic_market: data.customer?.state
              }, serviceValue);
              updateEventStatus('highValuePurchase', 'success');
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
Cleaning Service - Booking Confirmed

📅 Service Date: ${new Date(orderDetails.service_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
⏰ Service Time: ${orderDetails.time_slot}
📋 Order ID: ${orderDetails.id}
💰 Amount Paid: $${(orderDetails.est_price / 100).toFixed(2)}

Customer: ${orderDetails.customers?.name || orderDetails.name || 'N/A'}
Email: ${orderDetails.customers?.email || orderDetails.email || 'N/A'}
${(orderDetails.customers?.phone || orderDetails.phone) ? `Phone: ${orderDetails.customers?.phone || orderDetails.phone}` : ''}

Questions? Call 8577544557
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
  const address = orderDetails?.property_details?.address || serviceDetails?.serviceAddress || serviceDetails?.address;
  const property = serviceDetails?.property;
  const instructions = serviceDetails?.instructions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      <Navigation />
      
      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        
        {/* Hero Success Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 p-8 text-center shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-500/20 to-blue-500/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm animate-scale-in">
              <CheckCircle className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 drop-shadow-lg">
              ✨ Booking Confirmed! 🎉
            </h1>
            <p className="text-white/90 font-medium drop-shadow-sm">
              Your cleaning is booked! 🧽✨
            </p>
            
            {/* Facebook Pixel Event Indicators - Compact Mobile View */}
            <div className="flex flex-wrap justify-center gap-1 mt-4">
              <FacebookPixelEventIndicator 
                eventName="ViewContent" 
                status={trackedEvents.viewContent}
                value={orderDetails?.est_price ? orderDetails.est_price / 100 : 0}
              />
              <FacebookPixelEventIndicator 
                eventName="Purchase" 
                status={trackedEvents.purchase}
                value={orderDetails?.est_price ? orderDetails.est_price / 100 : 0}
              />
              <FacebookPixelEventIndicator 
                eventName="CustomPurchase" 
                status={trackedEvents.customPurchase}
              />
              <FacebookPixelEventIndicator 
                eventName="CompleteRegistration" 
                status={trackedEvents.completeRegistration}
              />
              {orderDetails?.est_price > 20000 && (
                <FacebookPixelEventIndicator 
                  eventName="HighValuePurchase" 
                  status={trackedEvents.highValuePurchase}
                  value={orderDetails?.est_price ? orderDetails.est_price / 100 : 0}
                />
              )}
            </div>
          </div>
        </div>

        {/* What's Next Card */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-400 to-pink-400 p-6 shadow-xl">
          <div className="text-center text-white">
            <div className="text-2xl mb-2">📞</div>
            <h3 className="font-bold text-lg mb-2">What's Next?</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">🤝 We'll call you for confirmation</p>
              <p>📧 Check your email for details</p>
              <p>📱 Watch for text updates</p>
            </div>
          </div>
        </div>

        {/* Payment Status Card */}
        {orderDetails && (
          <div className="rounded-3xl bg-gradient-to-r from-green-400 to-blue-500 p-6 shadow-xl">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">💳</div>
              <h3 className="font-bold text-lg mb-2">
                {orderDetails.balance_due > 0 ? '💰 Deposit Paid' : '✅ Payment Complete'}
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Total:</strong> ${(orderDetails.est_price / 100).toFixed(2)}</p>
                {orderDetails.deposit_amount && (
                  <p><strong>Paid:</strong> ${(orderDetails.deposit_amount / 100).toFixed(2)}</p>
                )}
                {orderDetails.balance_due && orderDetails.balance_due > 0 && (
                  <p><strong>Balance:</strong> ${(orderDetails.balance_due / 100).toFixed(2)}</p>
                )}
                {(!orderDetails.balance_due || orderDetails.balance_due === 0) && (
                  <p className="font-bold">🎊 Fully Paid!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Date & Time Card */}
        {orderDetails && (
          <div className="rounded-3xl bg-gradient-to-r from-purple-400 to-indigo-500 p-6 shadow-xl">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-bold text-lg mb-3">Scheduled Service</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">
                    {new Date(orderDetails.service_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{orderDetails.time_slot}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Details Card */}
        {orderDetails && (
          <div className="rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-500 p-6 shadow-xl">
            <div className="text-white">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🏠</div>
                <h3 className="font-bold text-lg">Service Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Service:</span>
                  <span className="font-bold">
                    {orderDetails.service_type === 'regular' ? 'Regular Cleaning' : orderDetails.service_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Frequency:</span>
                  <span className="font-bold">
                    {orderDetails.frequency === 'oneTime' ? 'One Time' : orderDetails.frequency?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Size:</span>
                  <span className="font-bold">{orderDetails.sqft_or_bedrooms} sq ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Order ID:</span>
                  <span className="font-mono text-xs bg-white/20 px-2 py-1 rounded">{orderDetails.id.slice(-8)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info Card */}
        {orderDetails && (
          <div className="rounded-3xl bg-gradient-to-r from-pink-400 to-rose-500 p-6 shadow-xl">
            <div className="text-white">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">👤</div>
                <h3 className="font-bold text-lg">Your Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Name:</span>
                  <span className="font-bold">{orderDetails.customers?.name || orderDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email:</span>
                  <span className="font-bold text-xs">{orderDetails.customers?.email || orderDetails.email}</span>
                </div>
                {(orderDetails.customers?.phone || orderDetails.phone) && (
                  <div className="flex justify-between items-center">
                    <span>Phone:</span>
                    <span className="font-bold">{orderDetails.customers?.phone || orderDetails.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Address Card */}
        {address && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 p-6 shadow-xl">
            <div className="text-white">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="font-bold text-lg">Service Address</h3>
              </div>
              <div className="text-center space-y-1 text-sm">
                <p className="font-bold">{address.street}</p>
                {address.apartment && <p>{address.apartment}</p>}
                <p>{address.city}, {address.state} {address.zipCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Special Instructions Card */}
        {instructions && (
          <div className="rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-500 p-6 shadow-xl">
            <div className="text-white">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-bold text-lg">Special Notes</h3>
              </div>
              <div className="space-y-2 text-sm">
                {instructions.access && (
                  <div>
                    <span className="font-bold">Access: </span>
                    <span>{instructions.access}</span>
                  </div>
                )}
                {instructions.parking && (
                  <div>
                    <span className="font-bold">Parking: </span>
                    <span>{instructions.parking}</span>
                  </div>
                )}
                {instructions.special && (
                  <div>
                    <span className="font-bold">Notes: </span>
                    <span>{instructions.special}</span>
                  </div>
                )}
                {instructions.pets && (
                  <div className="text-center">
                    <span className="font-bold">🐾 Pets Present</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Card */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-600 to-slate-700 p-6 shadow-xl">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleCopyDetails} 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white font-bold hover:bg-white/30 rounded-2xl"
              >
                {isCopied ? <CheckCheck className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
              
              <Button 
                onClick={handleViewOrderStatus} 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white font-bold hover:bg-white/30 rounded-2xl"
              >
                <FileText className="h-4 w-4 mr-1" />
                Status
              </Button>
            </div>
            
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full bg-white/20 border-white/30 text-white font-bold hover:bg-white/30 rounded-2xl"
            >
              <Home className="h-4 w-4 mr-2" />
              Book Again 🎉
            </Button>
          </div>
        </div>

        {/* Referral Section */}
        <PostPaymentReferralSection 
          customerEmail={orderDetails?.customer_email}
          customerName={orderDetails?.customer_name}
          onReferralGenerated={(code: string) => {
            trackLead('Referral Code Generated', orderDetails?.est_price ? orderDetails.est_price / 100 : 0);
            addPixelEvent('Lead', {
              content_name: 'Referral Code Generated',
              referral_code: code,
              lead_source: 'post_purchase'
            });
          }}
        />
      </div>

      {/* Facebook Pixel Debug Panel - Fixed position for mobile */}
      <div className="fixed bottom-4 right-4 z-50">
        <FacebookPixelDebugPanel 
          events={pixelEvents}
          onClear={() => setPixelEvents([])}
        />
      </div>
    </div>
  );
}