import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Package, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { toast } from "sonner";

interface OrderStatusLookupProps {
  triggerClassName?: string;
}

interface Order {
  id: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  cleaning_type: string;
  scheduled_date: string;
  scheduled_time: string;
  created_at: string;
  service_details: any;
}

interface StatusUpdate {
  id: string;
  status_message: string;
  created_at: string;
  estimated_arrival_minutes: number | null;
}

export const OrderStatusLookup = ({ triggerClassName }: OrderStatusLookupProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'scheduled':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an email address or order ID");
      return;
    }

    setLoading(true);
    try {
      console.log("OrderStatusLookup searching for:", searchQuery);
      
      // Use the get-order-details edge function
      const { data: result, error } = await supabase.functions.invoke('get-order-details', {
        body: { 
          session_id: searchQuery.includes('cs_') ? searchQuery : null,
          order_id: !searchQuery.includes('cs_') && !searchQuery.includes('@') ? searchQuery : null,
          email: searchQuery.includes('@') ? searchQuery : null,
          code: !searchQuery.includes('cs_') && !searchQuery.includes('@') ? searchQuery : null
        }
      });

      if (error || !result?.order) {
        console.error("Edge function error:", error);
        toast.error("No order found with that information");
        setOrder(null);
        setStatusUpdates([]);
        return;
      }

      const foundOrder = result.order;
      setOrder(foundOrder);

      // Fetch status updates for this order
      const { data: updates, error: updatesError } = await sb
        .from('order_status_updates')
        .select('*')
        .eq('order_id', foundOrder.id)
        .order('created_at', { ascending: false });

      if (!updatesError && updates) {
        setStatusUpdates(updates as unknown as StatusUpdate[]);
      }

      toast.success("Order found!");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for order");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setOrder(null);
    setStatusUpdates([]);
  };

  const handleViewFullStatus = () => {
    if (order) {
      // Navigate to dedicated order status page with the order details
      navigate(`/order-status?order_id=${order.id}`);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <Search className="h-4 w-4 mr-2" />
          Check My Order Status
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Status Lookup</DialogTitle>
          <DialogDescription>
            Enter your email address or order ID to check your order status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Email Address or Order ID</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter your email or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {order && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p><strong>Customer:</strong> {order.customer_name}</p>
                      <p><strong>Email:</strong> {order.customer_email}</p>
                      <p><strong>Service Type:</strong> {order.cleaning_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <p><strong>Amount:</strong> ${(order.amount / 100).toFixed(2)}</p>
                      <p><strong>Scheduled Date:</strong> {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString() : 'Not scheduled'}</p>
                      <p><strong>Scheduled Time:</strong> {order.scheduled_time || 'Not scheduled'}</p>
                    </div>
                  </div>

                  {order.service_details?.serviceAddress && (
                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <strong>Service Address:</strong> {order.service_details.serviceAddress.street}, {order.service_details.serviceAddress.city}, {order.service_details.serviceAddress.state} {order.service_details.serviceAddress.zipCode}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {statusUpdates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Status Updates
                    </CardTitle>
                    <CardDescription>
                      Latest updates on your order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statusUpdates.map((update) => (
                        <div key={update.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{update.status_message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(update.created_at)}
                            </p>
                            {update.estimated_arrival_minutes && (
                              <p className="text-xs text-primary">
                                Estimated arrival: {update.estimated_arrival_minutes} minutes
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetSearch} className="flex-1">
                  Search Another Order
                </Button>
                <Button onClick={handleViewFullStatus} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};