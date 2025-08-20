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
  Send,
  FileText
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
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
      console.log("Order found:", result.order);
      toast.success("Order found!");
    } catch (error) {
      console.error("Error searching for order:", error);
      toast.error("Order not found. Please check your Session ID or Order ID.");
      setOrder(null);
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Enter Session ID, Order ID, or Email..."
                    className="text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="text-sm sm:text-base"
                  >
                    {loading ? "Searching..." : "Find Order"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSearchByEmail}
                    disabled={loading}
                    className="text-sm sm:text-base"
                  >
                    View History
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use "Find Order" for specific orders or "View History" to see all orders for an email address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {showHistory && orders.length > 0 && (
          <Card className="shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-blue-50 text-sm sm:text-base">
                All orders for {searchValue}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {orders.map((orderItem, index) => (
                  <div 
                    key={orderItem.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setOrder(orderItem);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Order #{orderItem.id.slice(-8)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(orderItem.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          ${(orderItem.amount / 100).toFixed(2)}
                        </div>
                        <Badge className={`${getStatusColor(orderItem.status)} text-xs`}>
                          {orderItem.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {orderItem.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                      {orderItem.square_footage && ` • ${orderItem.square_footage} sq ft`}
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(false)}
                className="w-full mt-4"
              >
                Close History
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && !showHistory && (
          <>
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

                  {/* Service Details - Enhanced Display */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm sm:text-base">Service Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-muted-foreground text-xs">Service Type</span>
                        <div className="font-medium">
                          {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-muted-foreground text-xs">Frequency</span>
                        <div className="font-medium">
                          {order.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                      {order.square_footage && (
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <span className="text-muted-foreground text-xs">Property Size</span>
                          <div className="font-medium">{order.square_footage} sq ft</div>
                        </div>
                      )}
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-muted-foreground text-xs">Total Amount</span>
                        <div className="font-medium text-primary text-lg">${(order.amount / 100).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Additional service details if available */}
                    {(order.service_details?.homeSize || order.service_details?.dwellingType || order.service_details?.primaryFlooringType) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3">
                        {order.service_details?.homeSize && (
                          <div className="bg-blue-50 p-2 rounded">
                            <span className="text-muted-foreground text-xs">Home Size</span>
                            <div className="font-medium text-xs">{order.service_details.homeSize}</div>
                          </div>
                        )}
                        {order.service_details?.dwellingType && (
                          <div className="bg-blue-50 p-2 rounded">
                            <span className="text-muted-foreground text-xs">Dwelling Type</span>
                            <div className="font-medium text-xs">{order.service_details.dwellingType}</div>
                          </div>
                        )}
                        {order.service_details?.primaryFlooringType && (
                          <div className="bg-blue-50 p-2 rounded">
                            <span className="text-muted-foreground text-xs">Primary Flooring</span>
                            <div className="font-medium text-xs">{order.service_details.primaryFlooringType}</div>
                          </div>
                        )}
                      </div>
                    )}
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

                   {/* Member Discounts */}
                   {(order.service_details?.addon_member_discount > 0 || order.service_details?.membership_status) && (
                     <div className="space-y-2">
                       <h4 className="font-semibold text-sm sm:text-base text-green-600">Member Benefits Applied</h4>
                       <div className="flex flex-wrap gap-1">
                         {order.service_details?.membership_status && (
                           <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                             BACP Club™ Member
                           </Badge>
                         )}
                         {order.service_details?.addon_member_discount > 0 && (
                           <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                             10% Add-on Discount: ${order.service_details.addon_member_discount}
                           </Badge>
                         )}
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
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="justify-start text-xs sm:text-sm"
                         onClick={() => setRescheduleDialogOpen(true)}
                       >
                         <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                         Request Reschedule
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="justify-start text-xs sm:text-sm"
                         onClick={() => setAddressDialogOpen(true)}
                       >
                         <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                         Update Address
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="justify-start text-xs sm:text-sm"
                         onClick={() => setContactDialogOpen(true)}
                       >
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

            {/* Service Requests Display */}
            <div className="mt-6">
              <ServiceRequestsDisplay orderId={order.id} />
            </div>

            {/* Additional Features Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
              {/* Subcontractor Status Update */}
              <SubcontractorStatusUpdate orderId={order.id} />
              
              {/* Tip Component */}
              <TipComponent orderId={order.id} orderAmount={order.amount} />
            </div>

            {/* Dialogs */}
            <RescheduleRequestDialog
              open={rescheduleDialogOpen}
              onOpenChange={setRescheduleDialogOpen}
              order={order}
              onSuccess={() => {
                // Refresh service requests when a new one is created
                window.location.reload();
              }}
            />
            
            <UpdateAddressDialog
              open={addressDialogOpen}
              onOpenChange={setAddressDialogOpen}
              order={order}
              onSuccess={() => {
                window.location.reload();
              }}
            />
            
            <UpdateContactDialog
              open={contactDialogOpen}
              onOpenChange={setContactDialogOpen}
              order={order}
              onSuccess={() => {
                window.location.reload();
              }}
            />
          </>
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