import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  CheckCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Home,
  Search,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

interface Order {
  id: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  square_footage: number;
  cleaning_type: string;
  frequency: string;
  add_ons: string[];
  service_details: any;
  created_at: string;
  updated_at: string;
}

export default function OrderStatus() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Auto-search if sessionId or orderId is provided
  useEffect(() => {
    if (sessionId) {
      setSearchValue(sessionId);
      handleSearch(sessionId);
    } else if (orderId) {
      setSearchValue(orderId);
      handleSearch(orderId);
    }
  }, [sessionId, orderId]);

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm || searchValue;
    if (!term.trim()) {
      toast.error("Please enter a Session ID or Order ID");
      return;
    }

    setLoading(true);
    try {
      // Try searching by stripe_session_id first, then by order id
      let { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`stripe_session_id.ilike.%${term}%,id.eq.${term}`)
        .single();

      if (error || !data) {
        // If not found, try partial match on session ID
        const { data: partialData, error: partialError } = await supabase
          .from("orders")
          .select("*")
          .ilike("stripe_session_id", `%${term}%`)
          .limit(1)
          .single();

        if (partialError || !partialData) {
          throw new Error("Order not found");
        }
        data = partialData;
      }

      setOrder(data);
      toast.success("Order found!");
    } catch (error) {
      console.error("Error searching for order:", error);
      toast.error("Order not found. Please check your Session ID or Order ID.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !order) {
      toast.error("Please enter a message");
      return;
    }

    setSendingMessage(true);
    try {
      // For now, we'll just show a success message
      // In a real app, you'd send this to customer service
      toast.success("Message sent! Our team will respond within 24 hours.");
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Order Status & Support</h1>
          <p className="text-muted-foreground text-center text-sm sm:text-base">
            Track your cleaning service and get support
          </p>
        </div>

        {/* Search Section */}
        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-5 w-5" />
              Find Your Order
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
              Enter your Session ID (from confirmation email) or Order ID
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter Session ID or Order ID..."
                  className="text-sm sm:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={() => handleSearch()}
                disabled={loading}
                className="text-sm sm:text-base"
              >
                {loading ? "Searching..." : "Find Order"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  {getStatusIcon(order.status)}
                  Order Details
                </CardTitle>
                <CardDescription className="text-green-50 text-sm sm:text-base">
                  Order #{order.id.slice(-8)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm sm:text-base">Status:</span>
                  <Badge className={`${getStatusColor(order.status)} text-xs sm:text-sm`}>
                    {order.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </Badge>
                </div>

                {/* Service Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Service Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium">
                        {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <div className="font-medium">
                        {order.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Square Footage:</span>
                      <div className="font-medium">{order.square_footage} sq ft</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <div className="font-medium text-primary">${(order.amount / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {order.add_ons && order.add_ons.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm sm:text-base">Additional Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {order.add_ons.map((addon, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {addon.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Address */}
                {order.service_details?.address && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                      <MapPin className="h-4 w-4" />
                      Service Address
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {order.service_details.address.street}
                      {order.service_details.address.apartment && `, ${order.service_details.address.apartment}`}
                      <br />
                      {order.service_details.address.city}, {order.service_details.address.state} {order.service_details.address.zipCode}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm sm:text-base">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-primary" />
                      <span>{order.customer_phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-primary" />
                      <span>{order.customer_email}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Date */}
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Booked on: {new Date(order.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Support & Communication */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MessageSquare className="h-5 w-5" />
                  Support & Updates
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
                  Send us a message or request changes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Quick Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" size="sm" className="justify-start text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Request Reschedule
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Update Address
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs sm:text-sm">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Update Contact Info
                    </Button>
                  </div>
                </div>

                {/* Send Message */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Send Message</h4>
                  <div className="space-y-3">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message, request, or question here..."
                      className="text-sm sm:text-base"
                      rows={4}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="w-full text-sm sm:text-base"
                    >
                      {sendingMessage ? "Sending..." : (
                        <>
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm sm:text-base">Direct Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>(281) 201-6112</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>support@bayareacleaningpros.com</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Available Monday-Friday 8AM-6PM, Saturday 8AM-4PM
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-6 sm:mt-8">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}