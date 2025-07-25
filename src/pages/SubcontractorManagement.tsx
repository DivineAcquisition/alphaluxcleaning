import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  Filter,
  Search,
  Download,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  BarChart3
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

interface SubcontractorRestriction {
  id: string;
  reason: string;
  restriction_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface SubcontractorPayment {
  id: string;
  total_amount: number;
  subcontractor_amount: number;
  payment_status: string;
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
  const [filteredSubcontractors, setFilteredSubcontractors] = useState<Subcontractor[]>([]);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [splitTierFilter, setSplitTierFilter] = useState('all');
  const [restrictionReason, setRestrictionReason] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
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
      setFilteredSubcontractors(data || []);
    } catch (error) {
      toast.error('Failed to fetch subcontractors');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter subcontractors based on search and filters
  useEffect(() => {
    let filtered = subcontractors;

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(sub => sub.subscription_status === 'active' && sub.is_available);
      } else if (statusFilter === 'paused') {
        filtered = filtered.filter(sub => sub.subscription_status === 'active' && !sub.is_available);
      } else if (statusFilter === 'removed') {
        filtered = filtered.filter(sub => sub.subscription_status === 'cancelled');
      }
    }

    if (splitTierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.split_tier === splitTierFilter);
    }

    setFilteredSubcontractors(filtered);
  }, [subcontractors, searchTerm, statusFilter, splitTierFilter]);

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

  const handleAddRestriction = async (subcontractorId: string) => {
    if (!restrictionReason.trim()) {
      toast.error('Please provide a reason for the restriction');
      return;
    }

    try {
      const { error } = await supabase
        .from('subcontractor_restrictions')
        .insert({
          subcontractor_id: subcontractorId,
          reason: restrictionReason,
          restriction_type: 'job_acceptance',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          created_by: user?.id
        });

      if (error) throw error;
      
      toast.success('Restriction added successfully');
      setRestrictionReason('');
    } catch (error) {
      toast.error('Failed to add restriction');
    }
  };

  const handleSendNotification = async (subcontractorId: string) => {
    if (!notificationMessage.trim()) {
      toast.error('Please provide a notification message');
      return;
    }

    try {
      const { error } = await supabase
        .from('subcontractor_notifications')
        .insert({
          subcontractor_id: subcontractorId,
          title: 'Message from Admin',
          message: notificationMessage,
          type: 'admin_message'
        });

      if (error) throw error;
      
      toast.success('Notification sent successfully');
      setNotificationMessage('');
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const handleUpdateSplitTier = async (subcontractorId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ split_tier: newTier })
        .eq('id', subcontractorId);

      if (error) throw error;
      
      toast.success('Split tier updated successfully');
      fetchSubcontractors();
    } catch (error) {
      toast.error('Failed to update split tier');
    }
  };

  const exportSubcontractorData = () => {
    const csvData = filteredSubcontractors.map(sub => ({
      Name: sub.full_name,
      Email: sub.email,
      Phone: sub.phone,
      City: sub.city,
      State: sub.state,
      'Split Tier': sub.split_tier,
      'Total Earnings': sub.total_earnings,
      'Jobs This Month': sub.jobs_completed_this_month,
      Rating: sub.rating,
      Status: getStatusText(sub.subscription_status, sub.is_available)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subcontractors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        <Tabs defaultValue="subcontractors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
            <TabsTrigger value="assignments">Job Assignments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="subcontractors" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Name, email, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="removed">Removed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="splitTier">Split Tier</Label>
                    <Select value={splitTierFilter} onValueChange={setSplitTierFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="50_50">50/50 Split</SelectItem>
                        <SelectItem value="35_65">35/65 Split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={exportSubcontractorData} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subcontractors Table */}
            <Card>
              <CardHeader>
                <CardTitle>Network Subcontractors ({filteredSubcontractors.length})</CardTitle>
                <CardDescription>
                  Manage subcontractor accounts, availability, and job assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading subcontractors...</div>
                ) : filteredSubcontractors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subcontractors found matching your criteria
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
                        {filteredSubcontractors.map((subcontractor) => (
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
                                <Select 
                                  value={subcontractor.split_tier} 
                                  onValueChange={(value) => handleUpdateSplitTier(subcontractor.id, value)}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="50_50">50/50 Split</SelectItem>
                                    <SelectItem value="35_65">35/65 Split</SelectItem>
                                  </SelectContent>
                                </Select>
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
                                    
                                    {/* Add Restriction Dialog */}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Restrict
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Add Restriction</DialogTitle>
                                          <DialogDescription>
                                            Add a temporary restriction for {subcontractor.full_name}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label htmlFor="restrictionReason">Restriction Reason</Label>
                                            <Textarea
                                              id="restrictionReason"
                                              placeholder="Enter reason for restriction..."
                                              value={restrictionReason}
                                              onChange={(e) => setRestrictionReason(e.target.value)}
                                            />
                                          </div>
                                          <Button 
                                            onClick={() => handleAddRestriction(subcontractor.id)}
                                            className="w-full"
                                          >
                                            Add 30-Day Restriction
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    {/* Send Notification Dialog */}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <MessageSquare className="h-3 w-3 mr-1" />
                                          Message
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Send Notification</DialogTitle>
                                          <DialogDescription>
                                            Send a message to {subcontractor.full_name}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label htmlFor="notificationMessage">Message</Label>
                                            <Textarea
                                              id="notificationMessage"
                                              placeholder="Enter your message..."
                                              value={notificationMessage}
                                              onChange={(e) => setNotificationMessage(e.target.value)}
                                            />
                                          </div>
                                          <Button 
                                            onClick={() => handleSendNotification(subcontractor.id)}
                                            className="w-full"
                                          >
                                            Send Message
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
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
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
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
                                    .filter(sub => sub.subscription_status === 'active' && sub.is_available)
                                    .map((subcontractor) => (
                                      <SelectItem key={subcontractor.id} value={subcontractor.id}>
                                        {subcontractor.full_name} - {subcontractor.city}
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
                                Assign Job
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
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Track subcontractor performance metrics and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top Performers */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Top Rated</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredSubcontractors
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 5)
                        .map((sub, index) => (
                          <div key={sub.id} className="flex justify-between items-center">
                            <span className="text-sm">{index + 1}. {sub.full_name}</span>
                            <Badge variant="secondary">{sub.rating.toFixed(1)} ⭐</Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Most Active */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Most Active</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredSubcontractors
                        .sort((a, b) => b.jobs_completed_this_month - a.jobs_completed_this_month)
                        .slice(0, 5)
                        .map((sub, index) => (
                          <div key={sub.id} className="flex justify-between items-center">
                            <span className="text-sm">{index + 1}. {sub.full_name}</span>
                            <Badge variant="secondary">{sub.jobs_completed_this_month} jobs</Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Top Earners */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Top Earners</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredSubcontractors
                        .sort((a, b) => b.total_earnings - a.total_earnings)
                        .slice(0, 5)
                        .map((sub, index) => (
                          <div key={sub.id} className="flex justify-between items-center">
                            <span className="text-sm">{index + 1}. {sub.full_name}</span>
                            <Badge variant="secondary">${sub.total_earnings.toFixed(2)}</Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Management
                </CardTitle>
                <CardDescription>
                  Overview of subcontractor payments and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">${filteredSubcontractors.reduce((sum, sub) => sum + sub.total_earnings, 0).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total Paid Out</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{filteredSubcontractors.reduce((sum, sub) => sum + sub.jobs_completed_this_month, 0)}</div>
                        <p className="text-xs text-muted-foreground">Jobs This Month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{filteredSubcontractors.filter(sub => sub.subscription_status === 'active').length}</div>
                        <p className="text-xs text-muted-foreground">Active Subcontractors</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{(filteredSubcontractors.reduce((sum, sub) => sum + sub.rating, 0) / filteredSubcontractors.length || 0).toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Average Rating</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubcontractorManagement;