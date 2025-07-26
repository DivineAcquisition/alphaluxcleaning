import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, UserX, Eye, Calendar, Phone, Mail, Car, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  has_drivers_license: boolean;
  has_own_vehicle: boolean;
  why_join_us: string;
  previous_cleaning_experience: string;
  availability: string;
  preferred_work_areas: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  can_lift_heavy_items: boolean;
  comfortable_with_chemicals: boolean;
  reliable_transportation: boolean;
  background_check_consent: boolean;
  brand_shirt_consent: boolean;
  subcontractor_agreement_consent: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string;
  reviewed_at: string;
  admin_notes: string;
  created_at: string;
}

export default function ApplicationManager() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as Application[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (applicationId: string, decision: 'approved' | 'rejected') => {
    setProcessing(applicationId);
    
    try {
      // Get current user for reviewer ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call the edge function to send email and update status
      const { data, error } = await supabase.functions.invoke('send-application-response', {
        body: {
          applicationId,
          decision,
          adminNotes,
          reviewerId: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${decision} and email sent successfully`,
      });

      // Refresh applications
      await fetchApplications();
      setAdminNotes("");
      setSelectedApp(null);

    } catch (error) {
      console.error('Error processing application:', error);
      toast({
        title: "Error",
        description: "Failed to process application",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      approved: "default",
      rejected: "destructive"
    } as const;
    
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === "all" || app.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">Application Manager</h1>
          <p className="text-xl text-muted-foreground">
            Review and manage subcontractor applications
          </p>
        </div>

        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{app.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {app.email}
                    </CardDescription>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {app.phone}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-3 w-3" />
                    License: {app.has_drivers_license ? "✓" : "✗"} | 
                    Vehicle: {app.has_own_vehicle ? "✓" : "✗"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Application Details - {app.full_name}</DialogTitle>
                        <DialogDescription>
                          Review the complete application and make a decision
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedApp && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Email</Label>
                              <p className="text-sm">{selectedApp.email}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Phone</Label>
                              <p className="text-sm">{selectedApp.phone}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Emergency Contact</Label>
                              <p className="text-sm">{selectedApp.emergency_contact_name} - {selectedApp.emergency_contact_phone}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Preferred Areas</Label>
                              <p className="text-sm">{selectedApp.preferred_work_areas || "No preference"}</p>
                            </div>
                          </div>

                          <div>
                            <Label className="font-semibold">Why Join Us</Label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedApp.why_join_us}</p>
                          </div>

                          <div>
                            <Label className="font-semibold">Previous Experience</Label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                              {selectedApp.previous_cleaning_experience || "No previous experience mentioned"}
                            </p>
                          </div>

                          <div>
                            <Label className="font-semibold">Availability</Label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedApp.availability}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="font-semibold">Requirements Met</Label>
                              <ul className="mt-1 space-y-1">
                                <li>Driver's License: {selectedApp.has_drivers_license ? "✓" : "✗"}</li>
                                <li>Own Vehicle: {selectedApp.has_own_vehicle ? "✓" : "✗"}</li>
                                <li>Can Lift Heavy: {selectedApp.can_lift_heavy_items ? "✓" : "✗"}</li>
                                <li>Comfortable w/ Chemicals: {selectedApp.comfortable_with_chemicals ? "✓" : "✗"}</li>
                              </ul>
                            </div>
                            <div>
                              <Label className="font-semibold">Consents</Label>
                              <ul className="mt-1 space-y-1">
                                <li>Background Check: {selectedApp.background_check_consent ? "✓" : "✗"}</li>
                                <li>Brand Shirt: {selectedApp.brand_shirt_consent ? "✓" : "✗"}</li>
                                <li>Subcontractor Agreement: {selectedApp.subcontractor_agreement_consent ? "✓" : "✗"}</li>
                                <li>Reliable Transport: {selectedApp.reliable_transportation ? "✓" : "✗"}</li>
                              </ul>
                            </div>
                          </div>

                          {app.status === 'pending' && (
                            <div className="space-y-4 border-t pt-4">
                              <div>
                                <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                                <Textarea
                                  id="admin_notes"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add any notes for the applicant..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-4">
                                <Button
                                  onClick={() => handleDecision(app.id, 'approved')}
                                  disabled={processing === app.id}
                                  className="flex-1"
                                >
                                  {processing === app.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 mr-2" />
                                  )}
                                  Approve & Send to Onboarding
                                </Button>

                                <Button
                                  variant="destructive"
                                  onClick={() => handleDecision(app.id, 'rejected')}
                                  disabled={processing === app.id}
                                  className="flex-1"
                                >
                                  {processing === app.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserX className="h-4 w-4 mr-2" />
                                  )}
                                  Reject Application
                                </Button>
                              </div>
                            </div>
                          )}

                          {app.status !== 'pending' && (
                            <div className="border-t pt-4">
                              <Label className="font-semibold">Review Information</Label>
                              <p className="text-sm mt-1">
                                Status: {getStatusBadge(app.status)}
                              </p>
                              {app.reviewed_at && (
                                <p className="text-sm">
                                  Reviewed: {new Date(app.reviewed_at).toLocaleString()}
                                </p>
                              )}
                              {app.admin_notes && (
                                <div className="mt-2">
                                  <Label className="font-semibold">Admin Notes</Label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{app.admin_notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "No applications have been submitted yet." 
                : `No ${statusFilter} applications found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}