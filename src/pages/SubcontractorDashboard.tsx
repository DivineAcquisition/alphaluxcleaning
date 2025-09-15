import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { 
  CalendarDays, 
  DollarSign, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  User as UserIcon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { SubcontractorProfileSettings } from "@/components/SubcontractorProfileSettings";
import { SubcontractorSubscriptionSettings } from "@/components/SubcontractorSubscriptionSettings";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface Subcontractor {
  id: string;
  user_id: string;
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
  review_count: number;
  completed_jobs_count: number;
  hourly_rate: number;
  monthly_fee: number;
  tier_level: number;
}

interface JobAssignment {
  id: string;
  status: string;
  assigned_at: string;
  accepted_at: string;
  completed_at: string;
  dropped_at: string;
  drop_reason: string;
  customer_rating: number;
  subcontractor_notes: string;
  bookings: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions: string;
  };
}

interface Payment {
  id: string;
  total_amount: number;
  subcontractor_amount: number;
  company_amount: number;
  split_percentage: number;
  payment_status: string;
  paid_at: string;
  created_at: string;
  bookings: {
    customer_name: string;
    service_date: string;
  };
}

const SubcontractorDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropReason, setDropReason] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/subcontractor-auth');
        return;
      }
      
      setUser(session.user);
      
      // Check for successful payment session
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        // Process successful payment
        await processPaymentSuccess(sessionId);
        // Clean up URL
        window.history.replaceState({}, '', '/subcontractor-dashboard');
      }
      
      await fetchSubcontractorData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSubcontractorData(session.user.id);
        } else {
          navigate('/subcontractor-auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const processPaymentSuccess = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-subcontractor-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('Payment processing error:', error);
        toast({
          variant: "destructive",
          title: "Payment Processing Error", 
          description: "There was an issue processing your payment. Please contact support.",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Payment Successful!",
          description: `Welcome to the network, ${data.subcontractor?.full_name}! Your subscription is now active.`,
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process payment confirmation.",
      });
    }
  };

  const fetchSubcontractorData = async (userId: string) => {
    try {
      // Fetch subcontractor profile
      const { data: subcontractorData, error: subcontractorError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subcontractorError || !subcontractorData) {
        navigate('/subcontractor-onboarding');
        return;
      }

      setSubcontractor(subcontractorData);

      // Fetch job assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings (
            id,
            customer_name,
            customer_email,
            customer_phone,
            service_address,
            service_date,
            service_time,
            special_instructions
          )
        `)
        .eq('subcontractor_id', subcontractorData.id)
        .order('created_at', { ascending: false });

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subcontractor_payments')
        .select(`
          *,
          bookings (
            customer_name,
            service_date
          )
        `)
        .eq('subcontractor_id', subcontractorData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

      // Fetch tips received
      const { data: tipsData, error: tipsError } = await supabase
        .from('order_tips')
        .select('*')
        .eq('subcontractor_id', subcontractorData.id)
        .order('created_at', { ascending: false });

      if (!tipsError && tipsData) {
        // Calculate total tips
        const totalTips = tipsData.reduce((sum, tip) => sum + parseFloat(tip.amount.toString()), 0);
        // Store tips for display
        localStorage.setItem('subcontractor_tips', JSON.stringify({ total: totalTips, tips: tipsData }));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_job_assignments')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Job Accepted",
        description: "You have successfully accepted this job.",
      });

      if (user) {
        fetchSubcontractorData(user.id);
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept job.",
      });
    }
  };

  const handleDropJob = async (assignmentId: string, bookingId: string, serviceDate: string) => {
    if (!subcontractor || !dropReason.trim()) {
      toast({
        variant: "destructive",
        title: "Drop Reason Required",
        description: "Please provide a reason for dropping this job.",
      });
      return;
    }

    try {
      // Check drop restrictions first
      const { data: restrictionCheck } = await supabase
        .rpc('check_job_drop_restrictions', {
          p_subcontractor_id: subcontractor.id,
          p_service_date: serviceDate
        });

      if (restrictionCheck && typeof restrictionCheck === 'object' && 'can_drop' in restrictionCheck && !restrictionCheck.can_drop) {
        toast({
          variant: "destructive",
          title: "Cannot Drop Job",
          description: (restrictionCheck as any).message || "Cannot drop this job due to restrictions.",
        });
        return;
      }

      // Calculate hours before service
      const serviceDateTime = new Date(serviceDate);
      const now = new Date();
      const hoursBeforeService = Math.floor((serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Update assignment status
      const { error: updateError } = await supabase
        .from('subcontractor_job_assignments')
        .update({
          status: 'dropped',
          dropped_at: new Date().toISOString(),
          drop_reason: dropReason
        })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Record the drop event in security logs
      const { error: dropError } = await supabase
        .from('security_logs')
        .insert({
          action: 'subcontractor_job_dropped',
          user_id: user?.id ?? null,
          resource: 'job_assignment',
          details: {
            subcontractor_id: subcontractor.id,
            booking_id: bookingId,
            assignment_id: assignmentId,
            service_date: serviceDate,
            hours_before_service: hoursBeforeService,
            reason: dropReason
          }
        });

      if (dropError) throw dropError;

      toast({
        title: "Job Dropped",
        description: hoursBeforeService <= 48 
          ? "Job dropped. Note: This was within 48 hours of service and counts toward your monthly limit."
          : "Job dropped successfully.",
      });

      setDropReason("");
      if (user) {
        fetchSubcontractorData(user.id);
      }
    } catch (error) {
      console.error('Error dropping job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to drop job.",
      });
    }
  };

  const handleCompleteJob = async (assignmentId: string) => {
    try {
      // Call the completion notification function
      const { data, error } = await supabase.functions.invoke('complete-order-notification', {
        body: {
          orderId: assignments.find(a => a.id === assignmentId)?.bookings?.id,
          assignmentId: assignmentId,
          completionNotes: "Service completed successfully"
        }
      });

      if (error) throw error;

      toast({
        title: "Job Completed! 🎉",
        description: "Great work! Customer has been notified and payment will be processed.",
      });

      if (user) {
        fetchSubcontractorData(user.id);
      }
    } catch (error) {
      console.error('Error completing job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete job. Please try again.",
      });
    }
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/subcontractor-auth');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !subcontractor) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalPendingEarnings = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.subcontractor_amount, 0);

  const completedJobs = assignments.filter(a => a.status === 'completed').length;
  const assignedJobs = assignments.filter(a => a.status === 'assigned').length;
  const acceptedJobs = assignments.filter(a => a.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/dc717713-12d1-4d02-8524-1f775106da30.png" 
              alt="Bay Area Cleaning Professionals" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome, {subcontractor.full_name}!
              </h1>
              <p className="text-muted-foreground">Bay Area Cleaning Professionals</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${subcontractor.total_earnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${totalPendingEarnings.toFixed(2)} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs This Month</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractor.jobs_completed_this_month}</div>
              <p className="text-xs text-muted-foreground">
                {subcontractor.split_tier === '35_65' ? '15 guaranteed' : subcontractor.split_tier === '50_50' ? '10 guaranteed' : 'No minimum'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractor.rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {completedJobs} completed jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Split Tier</CardTitle>
              <Badge variant={subcontractor.split_tier === '35_65' ? 'default' : subcontractor.split_tier === '50_50' ? 'secondary' : 'outline'}>
                {subcontractor.split_tier === '35_65' ? '35/65' : subcontractor.split_tier === '50_50' ? '50/50' : '60/40'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractor.split_tier === '35_65' ? '65%' : subcontractor.split_tier === '50_50' ? '50%' : '40%'}
              </div>
              <p className="text-xs text-muted-foreground">Your share</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">
              Job Assignments ({assignedJobs + acceptedJobs})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Jobs ({completedJobs})
            </TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Active Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Current Job Assignments</CardTitle>
                <CardDescription>
                  Jobs you can accept or that you've already accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.filter(a => ['assigned', 'accepted'].includes(a.status)).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active job assignments at the moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments
                      .filter(a => ['assigned', 'accepted'].includes(a.status))
                      .map((assignment) => (
                        <Card key={assignment.id} className="border-l-4 border-l-primary">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {assignment.bookings.customer_name}
                                </CardTitle>
                                <Badge className={getStatusColor(assignment.status)}>
                                  {assignment.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {new Date(assignment.bookings.service_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm font-medium">
                                  {assignment.bookings.service_time}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{assignment.bookings.service_address}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{assignment.bookings.customer_phone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{assignment.bookings.customer_email}</span>
                                </div>
                              </div>
                              
                              {assignment.bookings.special_instructions && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Special Instructions:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.bookings.special_instructions}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              {assignment.status === 'assigned' && (
                                <Button 
                                  onClick={() => handleAcceptJob(assignment.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Accept Job</span>
                                </Button>
                              )}
                              
                              {assignment.status === 'accepted' && (
                                <Button 
                                  onClick={() => handleCompleteJob(assignment.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Mark Complete</span>
                                </Button>
                              )}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" className="flex items-center space-x-2">
                                    <XCircle className="h-4 w-4" />
                                    <span>Drop Job</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Drop Job Confirmation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to drop this job? Please provide a reason.
                                      {Math.floor((new Date(assignment.bookings.service_date).getTime() - new Date().getTime()) / (1000 * 60 * 60)) <= 48 && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                          <div className="flex items-center space-x-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm text-yellow-800">
                                              Warning: This job is within 48 hours. Dropping it will count toward your monthly limit.
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="my-4">
                                    <Textarea
                                      placeholder="Please explain why you need to drop this job..."
                                      value={dropReason}
                                      onChange={(e) => setDropReason(e.target.value)}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDropJob(
                                        assignment.id, 
                                        assignment.bookings.id, 
                                        assignment.bookings.service_date
                                      )}
                                      disabled={!dropReason.trim()}
                                    >
                                      Drop Job
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Jobs Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Jobs</CardTitle>
                <CardDescription>
                  Your job history and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments
                      .filter(a => a.status === 'completed')
                      .map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.bookings.customer_name}
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.bookings.service_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{assignment.bookings.service_address}</TableCell>
                          <TableCell>
                            {assignment.customer_rating ? (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{assignment.customer_rating}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not rated</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Track your earnings and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Your Share</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.bookings.customer_name}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.bookings.service_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${payment.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          ${payment.subcontractor_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.payment_status)}>
                            {payment.payment_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paid_at 
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : new Date(payment.created_at).toLocaleDateString()
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <SubcontractorProfileSettings 
                subcontractor={subcontractor} 
                onUpdate={() => user && fetchSubcontractorData(user.id)} 
              />
              <SubcontractorSubscriptionSettings 
                subcontractor={subcontractor} 
                onUpdate={() => user && fetchSubcontractorData(user.id)} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubcontractorDashboard;