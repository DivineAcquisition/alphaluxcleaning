import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { CancellationDialog } from "@/components/CancellationDialog";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { TipComponent } from "@/components/TipComponent";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Star, 
  Phone, 
  Mail,
  Pause,
  Play,
  Edit,
  X,
  Gift
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_details: any;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  cleaning_type: string;
  frequency: string;
  amount: number;
  square_footage: number;
  add_ons: string[];
  created_at: string;
  service_status: string;
  next_service_date: string;
  paused_until: string;
  is_recurring: boolean;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your services');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePauseService = async (orderId: string) => {
    try {
      const pauseUntil = new Date();
      pauseUntil.setMonth(pauseUntil.getMonth() + 1); // Pause for 1 month
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          service_status: 'paused',
          paused_until: pauseUntil.toISOString().split('T')[0]
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Service paused successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to pause service');
    }
  };

  const handleResumeService = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          service_status: 'active',
          paused_until: null
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Service resumed successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to resume service');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">My Cleaning Services</h1>
            <p className="text-muted-foreground">
              Manage your bookings, view service history, and update preferences
            </p>
          </div>

          {/* Services Grid */}
          {orders.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">No Services Found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't booked any cleaning services yet.
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Book Your First Cleaning
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                        <CardDescription>
                          Order #{order.id.slice(0, 8)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        {order.is_recurring && (
                          <Badge className={getServiceStatusColor(order.service_status)}>
                            {order.service_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Service Details */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Schedule</h4>
                        <div className="space-y-1">
                          {order.scheduled_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.scheduled_date).toLocaleDateString()}
                            </div>
                          )}
                          {order.scheduled_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3" />
                              {order.scheduled_time}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Service Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{order.frequency}</p>
                          <p>{order.square_footage} sq ft</p>
                          {order.add_ons && order.add_ons.length > 0 && (
                            <p>+{order.add_ons.length} add-ons</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Amount</h4>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">${(order.amount / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Address</h4>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5" />
                          <span>
                            {order.service_details?.address?.street || 'Address on file'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Service (for recurring) */}
                    {order.is_recurring && order.next_service_date && order.service_status === 'active' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Next Service</h4>
                        <p className="text-blue-600">
                          {new Date(order.next_service_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Paused Service Notice */}
                    {order.service_status === 'paused' && order.paused_until && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Service Paused</h4>
                        <p className="text-yellow-600">
                          Service will resume on {new Date(order.paused_until).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowRescheduleDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Reschedule
                        </Button>
                      )}
                      
                      {order.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowTipDialog(true);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Add Tip
                        </Button>
                      )}
                      
                      {order.is_recurring && order.service_status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseService(order.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Service
                        </Button>
                      )}
                      
                      {order.is_recurring && order.service_status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResumeService(order.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Service
                        </Button>
                      )}
                      
                      {['scheduled', 'confirmed'].includes(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowCancelDialog(true);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs - Commented out until props are properly configured */}
      {/* 
      {selectedOrder && (
        <>
          <CancellationDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            service={selectedOrder}
            onSuccess={() => {
              fetchOrders();
              setShowCancelDialog(false);
            }}
          />
          
          <RescheduleDialog
            open={showRescheduleDialog}
            onOpenChange={setShowRescheduleDialog}
            service={selectedOrder}
            onSuccess={() => {
              fetchOrders();
              setShowRescheduleDialog(false);
            }}
          />
          
          <TipComponent 
            orderId={selectedOrder.id}
            orderAmount={selectedOrder.amount}
          />
        </>
      )}
      */}
    </div>
  );
};

export default CustomerDashboard;