import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  LogOut, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Star,
  Pause,
  Play,
  UserX,
  UserPlus,
  Calendar,
  Settings
} from "lucide-react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Subcontractor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  split_tier: string;
  subscription_status: string;
  jobs_completed_this_month: number;
  total_earnings: number;
  rating: number;
  is_available: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  service_address: string;
  service_date: string;
  service_time: string;
  status: string;
}

const SubcontractorManagement = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/admin-auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
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
      fetchSubcontractors();
      fetchAvailableBookings();
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

  const fetchSubcontractors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error) {
      toast.error('Failed to fetch subcontractors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .is('assigned_employee_id', null)
        .eq('status', 'scheduled')
        .order('service_date', { ascending: true });

      if (error) throw error;
      setAvailableBookings(data || []);
    } catch (error) {
      toast.error('Failed to fetch available bookings');
    }
  };

  const handlePauseAccount = async (subcontractorId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: false })
        .eq('id', subcontractorId);

      if (error) throw error;
      
      toast.success('Account paused successfully');
      fetchSubcontractors();
    } catch (error) {
      toast.error('Failed to pause account');
    }
  };

  const handleReactivateAccount = async (subcontractorId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: true })
        .eq('id', subcontractorId);

      if (error) throw error;
      
      toast.success('Account reactivated successfully');
      fetchSubcontractors();
    } catch (error) {
      toast.error('Failed to reactivate account');
    }
  };

  const handleRemoveFromNetwork = async (subcontractorId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ subscription_status: 'cancelled', is_available: false })
        .eq('id', subcontractorId);

      if (error) throw error;
      
      toast.success('Subcontractor removed from network');
      fetchSubcontractors();
    } catch (error) {
      toast.error('Failed to remove from network');
    }
  };

  const handleAssignJob = async (bookingId: string, subcontractorId: string) => {
    if (!subcontractorId) {
      toast.error('Please select a subcontractor');
      return;
    }

    try {
      // Update booking assignment
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ assigned_employee_id: subcontractorId })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Create job assignment record
      const { error: assignmentError } = await supabase
        .from('subcontractor_job_assignments')
        .insert({
          subcontractor_id: subcontractorId,
          booking_id: bookingId,
          status: 'assigned'
        });

      if (assignmentError) throw assignmentError;
      
      toast.success('Job assigned successfully');
      fetchAvailableBookings();
    } catch (error) {
      toast.error('Failed to assign job');
    }
  };

  const handleRemoveAssignedJob = async (subcontractorId: string) => {
    try {
      // Get current assignments
      const { data: assignments, error: fetchError } = await supabase
        .from('subcontractor_job_assignments')
        .select('id, booking_id, status')
        .eq('subcontractor_id', subcontractorId)
        .in('status', ['assigned', 'accepted']);

      if (fetchError) throw fetchError;

      if (assignments && assignments.length > 0) {
        // Remove assignments
        const { error: deleteError } = await supabase
          .from('subcontractor_job_assignments')
          .delete()
          .eq('subcontractor_id', subcontractorId)
          .in('status', ['assigned', 'accepted']);

        if (deleteError) throw deleteError;

        // Clear booking assignments
        const bookingIds = assignments.map(a => a.booking_id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ assigned_employee_id: null })
          .in('id', bookingIds);

        if (updateError) throw updateError;

        toast.success(`Removed ${assignments.length} job assignment(s)`);
        fetchSubcontractors();
        fetchAvailableBookings();
      } else {
        toast.info('No active assignments found');
      }
    } catch (error) {
      toast.error('Failed to remove job assignments');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

  const getStatusColor = (status: string, isAvailable: boolean) => {
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    if (!isAvailable) return 'bg-yellow-100 text-yellow-800';
    if (status === 'active') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, isAvailable: boolean) => {
    if (status === 'cancelled') return 'Removed';
    if (!isAvailable) return 'Paused';
    if (status === 'active') return 'Active';
    return status;
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Subcontractor Management</h1>
            <p className="text-muted-foreground">Manage network subcontractors and job assignments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin-dashboard')} variant="outline" size="sm">
              Back to Dashboard
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Subcontractors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Network Subcontractors</CardTitle>
            <CardDescription>
              Manage subcontractor accounts, availability, and job assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading subcontractors...</div>
            ) : subcontractors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subcontractors found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subcontractor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcontractors.map((subcontractor) => (
                      <TableRow key={subcontractor.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{subcontractor.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {subcontractor.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {subcontractor.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3" />
                              {subcontractor.city}, {subcontractor.state}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subcontractor.zip_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-3 w-3" />
                              ${subcontractor.total_earnings.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {subcontractor.jobs_completed_this_month} jobs this month
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3" />
                              {subcontractor.rating.toFixed(1)} rating
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {subcontractor.split_tier === '50_50' ? '50/50 Split' : 
                               subcontractor.split_tier === '35_65' ? '35/65 Split' : 
                               subcontractor.split_tier}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(subcontractor.subscription_status, subcontractor.is_available)}>
                            {getStatusText(subcontractor.subscription_status, subcontractor.is_available)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subcontractor.subscription_status === 'active' && (
                              <>
                                {subcontractor.is_available ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePauseAccount(subcontractor.id)}
                                  >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReactivateAccount(subcontractor.id)}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Reactivate
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveFromNetwork(subcontractor.id)}
                                >
                                  <UserX className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignedJob(subcontractor.id)}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Remove Jobs
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Assignment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Jobs</CardTitle>
            <CardDescription>
              Assign unassigned bookings to available subcontractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unassigned bookings available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service Details</TableHead>
                      <TableHead>Assign To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{booking.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {booking.service_date} at {booking.service_time}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {booking.service_address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selectedSubcontractor}
                            onValueChange={setSelectedSubcontractor}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select subcontractor" />
                            </SelectTrigger>
                            <SelectContent>
                              {subcontractors
                                .filter(s => s.subscription_status === 'active' && s.is_available)
                                .map((subcontractor) => (
                                  <SelectItem key={subcontractor.id} value={subcontractor.id}>
                                    {subcontractor.full_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAssignJob(booking.id, selectedSubcontractor)}
                            disabled={!selectedSubcontractor}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
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
    </div>
  );
};

export default SubcontractorManagement;