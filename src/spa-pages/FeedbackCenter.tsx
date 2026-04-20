import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Filter,
  Send,
  CheckCircle,
  Clock,
  User
} from "lucide-react";

interface FeedbackData {
  id: string;
  customer_name: string;
  customer_email: string;
  overall_rating: number;
  cleanliness_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
  feedback_text?: string;
  category: string;
  status: string;
  response_text?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  subcontractor: {
    id: string;
    full_name: string;
    email: string;
  };
  booking: {
    service_date: string;
    service_address: string;
  };
}

interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  pendingCount: number;
  responseRate: number;
  categoryBreakdown: Record<string, number>;
}

export default function FeedbackCenter() {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [responseText, setResponseText] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('customer_feedback')
        .select(`
          id,
          customer_name,
          customer_email,
          overall_rating,
          cleanliness_rating,
          timeliness_rating,
          professionalism_rating,
          feedback_text,
          category,
          status,
          response_text,
          responded_by,
          responded_at,
          created_at,
          subcontractor:subcontractors(id, full_name, email),
          booking:bookings(service_date, service_address)
        `)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      setFeedback(feedbackData || []);
      calculateAnalytics(feedbackData || []);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (feedbackData: FeedbackData[]) => {
    const totalFeedback = feedbackData.length;
    const averageRating = totalFeedback > 0 
      ? feedbackData.reduce((sum, f) => sum + f.overall_rating, 0) / totalFeedback 
      : 0;
    
    const pendingCount = feedbackData.filter(f => f.status === 'new').length;
    const respondedCount = feedbackData.filter(f => f.status === 'acknowledged').length;
    const responseRate = totalFeedback > 0 ? (respondedCount / totalFeedback) * 100 : 0;

    const categoryBreakdown = feedbackData.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setAnalytics({
      totalFeedback,
      averageRating,
      pendingCount,
      responseRate,
      categoryBreakdown
    });
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ 
          response_text: responseText,
          status: 'acknowledged',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      setResponseText("");
      setShowResponseDialog(false);
      setSelectedFeedback(null);
      fetchFeedbackData();
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast.error('Failed to send response');
    }
  };

  const filteredFeedback = feedback.filter(f => {
    const matchesSearch = f.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subcontractor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || f.status === filterStatus;
    const matchesCategory = filterCategory === "all" || f.category === filterCategory;
    const matchesRating = filterRating === "all" || 
      (filterRating === "high" && f.overall_rating >= 4) ||
      (filterRating === "medium" && f.overall_rating >= 2 && f.overall_rating < 4) ||
      (filterRating === "low" && f.overall_rating < 2);

    return matchesSearch && matchesStatus && matchesCategory && matchesRating;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'acknowledged': return 'default';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'complaint': return 'destructive';
      case 'compliment': return 'default';
      case 'suggestion': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Feedback Center" description="Loading feedback data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Feedback Center" 
      description="Manage customer feedback and reviews"
    >
      <div className="space-y-6">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
                <p className="text-xs text-muted-foreground">All time feedback</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {analytics.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.pendingCount}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.responseRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Feedback responded to</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Feedback</CardTitle>
            <CardDescription>Search and filter customer feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="acknowledged">Responded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="compliment">Compliment</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="high">High (4-5 stars)</SelectItem>
                  <SelectItem value="medium">Medium (2-3 stars)</SelectItem>
                  <SelectItem value="low">Low (1-2 stars)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterCategory("all");
                  setFilterRating("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
            <CardDescription>
              {filteredFeedback.length} feedback entries found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.customer_name}</span>
                      </div>
                      <Badge variant="outline">→</Badge>
                      <span className="font-medium text-primary">{item.subcontractor.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < item.overall_rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="ml-1 text-sm font-medium">{item.overall_rating}</span>
                      </div>
                      <Badge variant={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge variant={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                  </div>

                  {item.feedback_text && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm">{item.feedback_text}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <p>{item.customer_email}</p>
                      <p>Service: {new Date(item.booking.service_date).toLocaleDateString()}</p>
                      <p>Submitted: {new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'new' && (
                        <Dialog open={showResponseDialog && selectedFeedback?.id === item.id} onOpenChange={setShowResponseDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => setSelectedFeedback(item)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Respond to Feedback</DialogTitle>
                              <DialogDescription>
                                Send a response to {item.customer_name}'s feedback
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="response">Your Response</Label>
                                <Textarea
                                  id="response"
                                  placeholder="Type your response here..."
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  rows={4}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleRespond}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Response
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {item.status === 'acknowledged' && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Responded
                        </Badge>
                      )}
                    </div>
                  </div>

                  {item.response_text && (
                    <div className="bg-primary/5 border-l-4 border-primary p-3 rounded-r-md">
                      <p className="text-sm font-medium text-primary mb-1">Admin Response:</p>
                      <p className="text-sm">{item.response_text}</p>
                      {item.responded_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Responded on {new Date(item.responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filteredFeedback.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No feedback found</p>
                  <p className="text-sm">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}