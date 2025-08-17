import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Mail,
  Phone,
  User,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationsOnboardingProps {
  data: any[];
}

export function ApplicationsOnboarding({ data = [] }: ApplicationsOnboardingProps) {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const pendingApplications = data.filter(app => app.status === 'pending');
  const approvedApplications = data.filter(app => app.status === 'approved');
  const rejectedApplications = data.filter(app => app.status === 'rejected');

  const handleApproval = async (applicationId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(applicationId);
    try {
      const { error } = await supabase.functions.invoke('send-application-response', {
        body: {
          applicationId,
          decision,
          adminNotes,
          reviewerId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${decision} successfully!`,
      });
      
      setAdminNotes('');
      // Refresh data would happen in parent component
    } catch (error: any) {
      toast({
        title: "Error",  
        description: error.message || `Failed to ${decision.slice(0, -1)} application`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkOnboarding = async () => {
    try {
      const { error } = await supabase.functions.invoke('bulk-onboard-existing-cleaners', {
        body: {
          applications: approvedApplications.filter(app => !app.user_id)
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bulk onboarding completed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete bulk onboarding",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedApplications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedApplications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {approvedApplications.filter(app => !app.user_id).length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">Ready for Onboarding</h3>
                <p className="text-sm text-green-700">
                  {approvedApplications.filter(app => !app.user_id).length} approved applications ready for bulk onboarding
                </p>
              </div>
              <Button onClick={handleBulkOnboarding} className="bg-green-600 hover:bg-green-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Onboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Applications & Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((application) => (
                <div 
                  key={application.id} 
                  className="flex items-center justify-between p-6 border rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{application.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.phone}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(application.status)}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Application Details - {selectedApplication?.full_name}</DialogTitle>
                          <DialogDescription>
                            Review the complete application and make a decision
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedApplication && (
                          <div className="space-y-6">
                            {/* Application details would go here - keeping it concise for space */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                                  <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                  <p><strong>Availability:</strong> {selectedApplication.availability}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Experience</h4>
                                <p className="text-sm bg-muted p-3 rounded">
                                  {selectedApplication.why_join_us}
                                </p>
                              </div>
                            </div>

                            {selectedApplication.status === 'pending' && (
                              <div className="space-y-4 pt-4 border-t">
                                <div>
                                  <label htmlFor="adminNotes" className="text-sm font-medium">Admin Notes (optional)</label>
                                  <Textarea
                                    id="adminNotes"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add any notes about this application..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-3 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleApproval(selectedApplication.id, 'rejected')}
                                    disabled={processingId === selectedApplication.id}
                                  >
                                    {processingId === selectedApplication.id ? "Processing..." : "Reject"}
                                  </Button>
                                  <Button
                                    onClick={() => handleApproval(selectedApplication.id, 'approved')}
                                    disabled={processingId === selectedApplication.id}
                                  >
                                    {processingId === selectedApplication.id ? "Processing..." : "Approve"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {application.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApproval(application.id, 'approved')}
                          disabled={processingId === application.id}
                          className="hover:bg-green-50"
                        >
                          {processingId === application.id ? "..." : "Approve"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApproval(application.id, 'rejected')}
                          disabled={processingId === application.id}
                          className="hover:bg-red-50"
                        >
                          {processingId === application.id ? "..." : "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
