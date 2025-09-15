import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Briefcase, 
  MessageSquare, 
  DollarSign,
  ArrowLeft,
  Activity,
  TrendingUp,
  Calendar,
  Award
} from "lucide-react";

interface SubcontractorDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  is_available: boolean;
  rating: number;
  tier_level?: number;
  hourly_rate?: number;
  monthly_fee?: number;
  review_count?: number;
  completed_jobs_count?: number;
  created_at: string;
}

interface JobAssignment {
  id: string;
  status: string;
  created_at: string;
  booking: {
    service_date: string;
    customer_name: string;
    service_address: string;
  };
}

interface CustomerFeedback {
  id: string;
  customer_name: string;
  overall_rating: number;
  feedback_text: string;
  created_at: string;
  status: string;
}

interface TipRecord {
  id: string;
  amount: number;
  customer_message?: string;
  created_at: string;
  order: {
    customer_name: string;
  };
}

export default function SubcontractorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subcontractor, setSubcontractor] = useState<SubcontractorDetails | null>(null);
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>([]);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (id) {
      fetchSubcontractorDetails();
      fetchJobAssignments();
      fetchCustomerFeedback();
      fetchTips();
    }
  }, [id]);

  const fetchSubcontractorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSubcontractor(data);
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
      toast.error('Failed to load subcontractor details');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          id,
          status,
          created_at,
          booking:bookings(service_date, customer_name, service_address)
        `)
        .eq('subcontractor_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setJobAssignments(data || []);
    } catch (error) {
      console.error('Error fetching job assignments:', error);
    }
  };

  const fetchCustomerFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('subcontractor_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerFeedback(data || []);
    } catch (error) {
      console.error('Error fetching customer feedback:', error);
    }
  };

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('order_tips')
        .select(`
          id,
          amount,
          customer_message,
          created_at,
          order:orders(customer_name)
        `)
        .eq('subcontractor_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: isAvailable })
        .eq('id', id);

      if (error) throw error;

      setSubcontractor(prev => prev ? { ...prev, is_available: isAvailable } : null);
      toast.success(`Subcontractor marked as ${isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleRespondToFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ 
          response_text: responseText,
          status: 'acknowledged',
          responded_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;

      setResponseText("");
      fetchCustomerFeedback();
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast.error('Failed to send response');
    }
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Subcontractor Details" 
        description="Loading subcontractor information..."
      >
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!subcontractor) {
    return (
      <AdminLayout 
        title="Subcontractor Not Found" 
        description="The requested subcontractor could not be found"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Subcontractor not found</p>
              <Button onClick={() => navigate('/subcon-management')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subcontractors
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);

  return (
    <AdminLayout 
      title={subcontractor.full_name}
      description="Comprehensive subcontractor management and performance tracking"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/subcon-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subcontractors
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="availability">Available</Label>
            <Switch
              id="availability"
              checked={subcontractor.is_available}
              onCheckedChange={handleAvailabilityToggle}
            />
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractor.rating}</div>
              <p className="text-xs text-muted-foreground">
                {subcontractor.review_count || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractor.completed_jobs_count || 0}</div>
              <p className="text-xs text-muted-foreground">Total assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{tips.length} tip records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tier Level</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tier {subcontractor.tier_level || 1}</div>
              <p className="text-xs text-muted-foreground">
                ${subcontractor.hourly_rate || 16}/hr
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job History</TabsTrigger>
            <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{subcontractor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{subcontractor.phone}</span>
                </div>
                {subcontractor.city && subcontractor.state && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{subcontractor.city}, {subcontractor.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={subcontractor.is_available ? "default" : "secondary"}>
                    {subcontractor.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Assignments</CardTitle>
                <CardDescription>Latest job assignments and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobAssignments.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{job.booking.service_address}</p>
                        <p className="text-xs text-muted-foreground">
                          Service Date: {new Date(job.booking.service_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  {jobAssignments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No job assignments found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
                <CardDescription>Reviews and feedback from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerFeedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feedback.customer_name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < feedback.overall_rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <Badge variant={feedback.status === 'acknowledged' ? 'default' : 'secondary'}>
                          {feedback.status}
                        </Badge>
                      </div>
                      {feedback.feedback_text && (
                        <p className="text-sm">{feedback.feedback_text}</p>
                      )}
                      {feedback.status === 'new' && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Type your response..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleRespondToFeedback(feedback.id)}
                            disabled={!responseText.trim()}
                          >
                            Send Response
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {customerFeedback.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No customer feedback found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tips Received</CardTitle>
                <CardDescription>Customer tips and appreciation messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tips.map((tip) => (
                    <div key={tip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{tip.order.customer_name}</p>
                        {tip.customer_message && (
                          <p className="text-sm text-muted-foreground">"{tip.customer_message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(tip.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${tip.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {tips.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No tips received yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}