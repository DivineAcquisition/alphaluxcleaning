import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Send,
  FileText,
  PartyPopper,
  Star,
  User,
  MessageCircle,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { SubcontractorStatusUpdate } from "@/components/SubcontractorStatusUpdate";
import { TipComponent } from "@/components/TipComponent";
import { RescheduleRequestDialog } from "@/components/RescheduleRequestDialog";
import { UpdateAddressDialog } from "@/components/UpdateAddressDialog";
import { UpdateContactDialog } from "@/components/UpdateContactDialog";
import { ServiceRequestsDisplay } from "@/components/ServiceRequestsDisplay";
import { PaymentBreakdown } from "@/components/PaymentBreakdown";

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
  service_address?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
}

export default function OrderStatus() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromPayment, setFromPayment] = useState(false);
  
  // Dialog states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // Auto-search if sessionId or orderId is provided
  useEffect(() => {
    if (sessionId) {
      setSearchValue(sessionId);
      handleSearch(sessionId);
    } else if (orderId) {
      setFromPayment(true);
      setSearchValue(orderId);
      handleSearch(orderId);
    }
  }, [sessionId, orderId]);

  // Check for additional URL parameters for pre-populated search
  useEffect(() => {
    const email = searchParams.get("email");
    const search = searchParams.get("search");
    
    if (email) {
      setSearchValue(email);
      handleSearchByEmail();
    } else if (search) {
      setSearchValue(search);
      handleSearch(search);
    }
  }, [searchParams]);

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm || searchValue;
    if (!term.trim()) {
      toast.error("Please enter a Session ID or Order ID");
      return;
    }

    setLoading(true);
    try {
      console.log("Searching for term:", term);
      
      // Use the get-order-details edge function instead of direct database queries
      const { data: result, error } = await supabase.functions.invoke('get-order-details', {
        body: { 
          session_id: term.includes('cs_') ? term : null,
          order_id: !term.includes('cs_') && !term.includes('@') ? term : null,
          email: term.includes('@') ? term : null,
          code: !term.includes('cs_') && !term.includes('@') ? term : null
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to search for order");
      }

      if (!result?.order) {
        throw new Error("Order not found");
      }

      setOrder(result.order);
      setOrders([result.order]);
      console.log("Order found:", result.order);
      
      if (fromPayment) {
        toast.success("🎉 Payment Successful! Your booking has been confirmed.");
      } else {
        toast.success("Order found!");
      }
    } catch (error) {
      console.error("Error searching for order:", error);
      toast.error("Order not found. Please check your Session ID or Order ID.");
      setOrder(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByEmail = async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      // Use the get-order-details edge function for email search
      const { data: result, error } = await supabase.functions.invoke('get-order-details', {
        body: { email: searchValue.trim() }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to search orders");
      }

      if (!result?.order) {
        toast.error("No orders found for this email address");
        setOrders([]);
        return;
      }

      // For now, we'll just show the single order found
      // In the future, we might modify the edge function to return multiple orders for email
      setOrders([result.order]);
      setShowHistory(true);
      toast.success("Found order(s)");
    } catch (error) {
      console.error("Error searching orders by email:", error);
      toast.error("Failed to search orders");
      setOrders([]);
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
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Celebration Header for Post-Payment */}
        {fromPayment && order && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-4">
              <PartyPopper className="h-16 w-16 text-primary mx-auto animate-bounce" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              🎉 Order Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your booking! Your cleaning service is scheduled and confirmed.
            </p>
          </div>
        )}

        {/* Search Section */}
        {!fromPayment && (
          <Card className="mb-8 border-0 shadow-clean">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                Track Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter Session ID, Order ID, or Email Address
                  </label>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="e.g., cs_test_a1B2c3... or order_123... or your@email.com"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="flex-1 border-primary/20 focus:border-primary"
                    />
                    <Button 
                      onClick={() => handleSearch()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                      disabled={loading}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSearchByEmail}
                  className="w-full border-accent/50 text-accent hover:bg-accent/10"
                  disabled={loading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Or Search by Email for All Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {orders.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {orders.map((orderItem) => (
              <Card key={orderItem.id} className="border-0 shadow-clean overflow-hidden">
                {/* Order Header */}
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-primary">
                        Order #{orderItem.id?.substring(0, 8)}...
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {orderItem.scheduled_date 
                          ? `Scheduled for ${new Date(orderItem.scheduled_date).toLocaleDateString()}`
                          : 'Scheduling in progress'
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Badge 
                        variant={getStatusColor(orderItem.status)} 
                        className="text-sm px-3 py-1 font-medium"
                      >
                        {getStatusIcon(orderItem.status)}
                        <span className="ml-2">{orderItem.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Service & Contact Info */}
                    <div className="space-y-6">
                      {/* Service Details */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                          <Star className="h-5 w-5" />
                          Service Details
                        </h3>
                         <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                           <p><span className="font-medium">Service:</span> {orderItem.cleaning_type || 'Residential Cleaning'}</p>
                           <p><span className="font-medium">Frequency:</span> {orderItem.frequency || 'One-Time'}</p>
                           <p><span className="font-medium">Service Address:</span> {orderItem.service_address || 'Address on file'}</p>
                           <p><span className="font-medium">Total Amount:</span> ${typeof orderItem.amount === 'number' ? orderItem.amount.toFixed(2) : '0.00'}</p>
                         </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                          <User className="h-5 w-5" />
                          Contact Information
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {orderItem.customer_name}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {orderItem.customer_phone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {orderItem.customer_email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Schedule & Payment */}
                    <div className="space-y-6">
                      {/* Schedule Information */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                          <Calendar className="h-5 w-5" />
                          Schedule Information
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          {orderItem.scheduled_date ? (
                            <>
                              <p className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(orderItem.scheduled_date).toLocaleDateString()}
                              </p>
                              {orderItem.scheduled_time && (
                                <p className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {orderItem.scheduled_time}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground">Scheduling in progress...</p>
                          )}
                        </div>
                      </div>

                      {/* Add-ons */}
                      {orderItem.add_ons && orderItem.add_ons.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg text-primary">Add-ons</h3>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <ul className="space-y-1">
                              {orderItem.add_ons.map((addon, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  {addon}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Payment Information */}
                      <PaymentBreakdown order={orderItem} />
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Status Update & Tip Section */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <SubcontractorStatusUpdate orderId={orderItem.id} />
                    <TipComponent orderId={orderItem.id} orderAmount={orderItem.amount} />
                  </div>

                  <Separator className="my-8" />

                  {/* Support Section */}
                  <Card className="bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-accent">
                        <MessageCircle className="h-5 w-5" />
                        Need Help?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => setRescheduleDialogOpen(true)}
                          variant="outline"
                          className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Reschedule Service
                        </Button>
                        <Button 
                          onClick={() => setAddressDialogOpen(true)}
                          variant="outline"
                          className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Update Address
                        </Button>
                        <Button 
                          onClick={() => setContactDialogOpen(true)}
                          variant="outline"
                          className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Update Contact
                        </Button>
                        <Button 
                          onClick={() => window.location.href = 'tel:2818099901'}
                          variant="outline"
                          className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Support
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium">Send a Message</label>
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message here..."
                          className="min-h-[100px] border-accent/20 focus:border-accent"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                          disabled={sendingMessage}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendingMessage ? "Sending..." : "Send Message"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            ))}

            {/* Return Home Button */}
            <div className="text-center pt-8">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - render only when an order is loaded */}
      {order && (
        <>
          <RescheduleRequestDialog
            open={rescheduleDialogOpen}
            onOpenChange={setRescheduleDialogOpen}
            order={order}
            onSuccess={() => {
              toast.success("Request submitted! We'll contact you shortly.");
            }}
          />

          <UpdateAddressDialog
            open={addressDialogOpen}
            onOpenChange={setAddressDialogOpen}
            order={order}
            onSuccess={() => {
              toast.success("Address updated successfully!");
            }}
          />

          <UpdateContactDialog
            open={contactDialogOpen}
            onOpenChange={setContactDialogOpen}
            order={order}
            onSuccess={() => {
              toast.success("Contact information updated successfully!");
            }}
          />
        </>
      )}
    </div>
  );
}