import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter,
  Star,
  AlertTriangle,
  MessageSquare,
  Camera,
  Flag,
  TrendingDown,
  TrendingUp,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCustomerFeedback } from "@/hooks/useCustomerFeedback";
import { useSubcontractorPerformance } from "@/hooks/useSubcontractorPerformance";
import { FeedbackResponseDialog } from "@/components/admin/FeedbackResponseDialog";
import { PhotoViewerDialog } from "@/components/admin/PhotoViewerDialog";
import { useState } from "react";

export default function OfficeManagerQuality() {
  const { feedback, loading, searchTerm, setSearchTerm, updateFeedbackStatus, respondToFeedback } = useCustomerFeedback();
  const { performance, loading: perfLoading, flagSubcontractor } = useSubcontractorPerformance();
  
  const [responseDialog, setResponseDialog] = useState<{
    open: boolean;
    feedbackId: string;
    customerName: string;
  }>({ open: false, feedbackId: '', customerName: '' });

  const [photoDialog, setPhotoDialog] = useState<{
    open: boolean;
    photos: any[];
    customerName: string;
  }>({ open: false, photos: [], customerName: '' });

  const [quickResponseOpen, setQuickResponseOpen] = useState(false);
  const [quickResponse, setQuickResponse] = useState("");

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'complaint':
        return 'bg-red-100 text-red-800';
      case 'feedback':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleViewDetails = (feedbackItem: any) => {
    // For now, just update status to acknowledged
    updateFeedbackStatus(feedbackItem.id, 'acknowledged');
  };

  const handleRespond = (feedbackItem: any) => {
    setResponseDialog({
      open: true,
      feedbackId: feedbackItem.id,
      customerName: feedbackItem.customer_name
    });
  };

  const handleViewPhotos = (feedbackItem: any) => {
    setPhotoDialog({
      open: true,
      photos: feedbackItem.photos || [],
      customerName: feedbackItem.customer_name
    });
  };

  const handleFlagCleaner = async (feedbackItem: any) => {
    if (feedbackItem.subcontractor_id) {
      await flagSubcontractor(feedbackItem.subcontractor_id, `Flagged from feedback: ${feedbackItem.feedback_text}`);
    }
  };

  const handleEscalate = (feedbackItem: any) => {
    updateFeedbackStatus(feedbackItem.id, 'escalated');
  };

  if (loading || perfLoading) {
    return (
      <AdminLayout title="Quality Control" description="Monitor customer feedback and team performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quality Control" description="Monitor customer feedback and team performance">
      <div className="space-y-6">
        {/* Quality Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedback.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {feedback.length > 0 
                  ? (feedback.filter(f => f.overall_rating).reduce((sum, r) => sum + (r.overall_rating || 0), 0) / feedback.filter(f => f.overall_rating).length).toFixed(1)
                  : "0.0"
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {feedback.filter(r => r.category === 'complaint' && r.status !== 'resolved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos Submitted</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {feedback.reduce((sum, r) => sum + (r.photos?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest customer reviews and complaints</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{report.customer_name}</p>
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.subcontractor?.full_name || 'Unassigned'} • {report.booking?.service_date || new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {report.overall_rating && (
                          <div className="flex">{renderStars(report.overall_rating)}</div>
                        )}
                        {report.photos && report.photos.length > 0 && (
                          <Badge variant="outline">
                            <Camera className="h-3 w-3 mr-1" />
                            {report.photos.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{report.feedback_text}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(report)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRespond(report)}>
                            Respond
                          </DropdownMenuItem>
                          {report.photos && report.photos.length > 0 && (
                            <DropdownMenuItem onClick={() => handleViewPhotos(report)}>
                              View Photos
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleFlagCleaner(report)}>
                            Flag Cleaner
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleEscalate(report)}
                          >
                            Escalate to Owner
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {report.response_text && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Response:</strong> {report.response_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cleaner Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Cleaner Performance</CardTitle>
              <CardDescription>Track individual performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.map((cleaner, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{cleaner.full_name}</p>
                        {cleaner.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : cleaner.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          {cleaner.rating} avg
                        </div>
                        <div>{cleaner.totalReviews} reviews</div>
                        <div className="text-red-600">{cleaner.complaints} complaints</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {cleaner.complaints > 5 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => flagSubcontractor(cleaner.id, 'High complaint count')}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Flag
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Response Dialog */}
        <Dialog open={quickResponseOpen} onOpenChange={setQuickResponseOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Response</DialogTitle>
              <DialogDescription>
                Send a quick response or notification
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea 
                placeholder="Type your message here..." 
                value={quickResponse}
                onChange={(e) => setQuickResponse(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickResponseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle quick response
                setQuickResponse("");
                setQuickResponseOpen(false);
              }}>
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Response Dialog */}
        <FeedbackResponseDialog
          open={responseDialog.open}
          onOpenChange={(open) => setResponseDialog(prev => ({ ...prev, open }))}
          feedbackId={responseDialog.feedbackId}
          customerName={responseDialog.customerName}
          onRespond={respondToFeedback}
        />

        {/* Photo Viewer Dialog */}
        <PhotoViewerDialog
          open={photoDialog.open}
          onOpenChange={(open) => setPhotoDialog(prev => ({ ...prev, open }))}
          photos={photoDialog.photos}
          customerName={photoDialog.customerName}
        />
      </div>
    </AdminLayout>
  );
}