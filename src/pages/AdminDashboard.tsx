
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Phone, Mail, DollarSign, CheckCircle, X } from "lucide-react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_address: string;
  service_date: string;
  service_time: string;
  status: string;
  priority: string;
  special_instructions?: string;
  estimated_duration?: number;
  order_id?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/admin-auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/admin-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchBookings();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Booking status updated');
      fetchBookings();

      // If marked as completed, process auto-charge
      if (newStatus === 'completed') {
        await processAutoCharge(bookingId);
      }
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const processAutoCharge = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking || !booking.order_id) return;

      // Call edge function to process payment
      const { error } = await supabase.functions.invoke('process-auto-charge', {
        body: { orderId: booking.order_id }
      });

      if (error) throw error;
      
      toast.success('Auto-charge processed and confirmation email sent');
    } catch (error) {
      toast.error('Failed to process auto-charge');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AdminLayout 
      title="Booking Management"
      description={`Active bookings dashboard - Welcome, ${userRole}`}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/20 rounded-xl">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-xl">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Bookings Table */}
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Active Bookings
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage customer bookings and update their status
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-medium">
                {bookings.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading bookings...</span>
                </div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No bookings found</h3>
                <p className="text-sm text-muted-foreground">
                  New bookings will appear here when customers make reservations
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Service Details</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <TableRow 
                        key={booking.id}
                        className={`transition-colors hover:bg-muted/30 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-semibold">{booking.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {booking.customer_email}
                            </div>
                            {booking.customer_phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {booking.customer_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{booking.service_date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {booking.service_time}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {booking.service_address}
                            </div>
                            {booking.estimated_duration && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Duration: {booking.estimated_duration}h
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getPriorityColor(booking.priority)}>
                            {booking.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => updateBookingStatus(booking.id, value)}
                          >
                            <SelectTrigger className="w-44 bg-background border-border/50 hover:border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="scheduled">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Scheduled
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  Completed (Auto-charge)
                                </div>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <div className="flex items-center gap-2">
                                  <X className="h-3 w-3" />
                                  Cancelled
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
