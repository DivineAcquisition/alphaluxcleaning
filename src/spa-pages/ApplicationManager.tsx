import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Clock, CheckCircle, XCircle, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  why_join_us: string;
  previous_cleaning_experience: string;
  availability: string;
  preferred_work_areas: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_drivers_license: boolean;
  has_own_vehicle: boolean;
  reliable_transportation: boolean;
  can_lift_heavy_items: boolean;
  comfortable_with_chemicals: boolean;
  background_check_consent: boolean;
  brand_shirt_consent: boolean;
  subcontractor_agreement_consent: boolean;
  admin_notes?: string;
}

interface ApplicationManagerProps {
  useContractorLayout?: boolean;
}

export default function ApplicationManager({ useContractorLayout = false }: ApplicationManagerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("subcontractor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApproval = async (applicationId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(applicationId);
    try {
      const { error } = await supabase.functions.invoke('send-application-response', {
        body: {
          applicationId,
          decision,
          adminNotes: adminNotes,
          reviewerId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast.success(`Application ${decision} successfully!`);
      setAdminNotes("");
      await fetchApplications();
    } catch (error: any) {
      console.error("Error processing application:", error);
      toast.error(error.message || `Failed to ${decision.slice(0, -1)} application`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "approved": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "approved": return CheckCircle;
      case "rejected": return XCircle;
      default: return Clock;
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === "pending").length,
    approved: applications.filter(app => app.status === "approved").length,
    rejected: applications.filter(app => app.status === "rejected").length
  };

  if (loading && !useContractorLayout) {
    return (
      <AdminLayout title="Application Manager" description="Loading applications...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (loading && useContractorLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const content = (
    <AdminSection 
      title="Application Overview"
      description="Track and process subcontractor applications with comprehensive insights"
    >
      {/* Stats Cards */}
      <AdminGrid columns={4} gap="md">
        <AdminCard
          variant="metric"
          title="Total Applications"
          icon={<FileText className="h-4 w-4" />}
        >
          <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </AdminCard>

        <AdminCard
          variant="metric"
          title="Pending Review"
          icon={<Clock className="h-4 w-4" />}
        >
          <div className="text-3xl font-bold tracking-tight text-warning">{stats.pending}</div>
          <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
        </AdminCard>

        <AdminCard
          variant="metric"
          title="Approved"
          icon={<CheckCircle className="h-4 w-4" />}
        >
          <div className="text-3xl font-bold tracking-tight text-success">{stats.approved}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
          </p>
        </AdminCard>

        <AdminCard
          variant="metric"
          title="Rejected"
          icon={<XCircle className="h-4 w-4" />}
        >
          <div className="text-3xl font-bold tracking-tight text-destructive">{stats.rejected}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% rejection rate
          </p>
        </AdminCard>
      </AdminGrid>

      {/* Applications List */}
      <AdminCard
        title="Recent Applications"
        description="Review and process subcontractor applications with detailed information"
        variant="default"
      >
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found
            </div>
          ) : (
            applications.map((application) => {
              const StatusIcon = getStatusIcon(application.status);
              return (
                <div 
                  key={application.id} 
                  className="flex items-center justify-between p-6 border border-border/40 rounded-xl bg-card/20 hover:bg-card/40 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-primary/20">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg tracking-tight">{application.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          📧 {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          📞 {application.phone}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 bg-muted/30 px-2 py-1 rounded-md inline-block">
                        Submitted: {new Date(application.created_at).toLocaleDateString()} • 
                        Availability: {application.availability}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={getStatusColor(application.status)} 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                    >
                      <StatusIcon className="h-4 w-4" />
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:border-primary/40"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
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
                            {/* Personal Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold">Contact Information</Label>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                                  <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                  <p><strong>Availability:</strong> {selectedApplication.availability}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="font-semibold">Emergency Contact</Label>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>Name:</strong> {selectedApplication.emergency_contact_name}</p>
                                  <p><strong>Phone:</strong> {selectedApplication.emergency_contact_phone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Experience */}
                            <div>
                              <Label className="font-semibold">Why Join Us</Label>
                              <p className="mt-2 text-sm bg-muted/50 p-3 rounded-lg">
                                {selectedApplication.why_join_us}
                              </p>
                            </div>

                            {selectedApplication.previous_cleaning_experience && (
                              <div>
                                <Label className="font-semibold">Previous Experience</Label>
                                <p className="mt-2 text-sm bg-muted/50 p-3 rounded-lg">
                                  {selectedApplication.previous_cleaning_experience}
                                </p>
                              </div>
                            )}

                            {/* Capabilities */}
                            <div>
                              <Label className="font-semibold">Capabilities & Requirements</Label>
                              <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  {selectedApplication.has_drivers_license ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                  Driver's License
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.has_own_vehicle ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                  Own Vehicle
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.reliable_transportation ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                  Reliable Transportation
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.can_lift_heavy_items ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                  Can Lift Heavy Items
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.comfortable_with_chemicals ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                  Comfortable with Chemicals
                                </div>
                              </div>
                            </div>

                            {selectedApplication.status === "pending" && (
                              <div className="space-y-4 pt-4 border-t">
                                <div>
                                  <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
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
                                    className="hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
                                  >
                                    {processingId === selectedApplication.id ? "Processing..." : "Reject"}
                                  </Button>
                                  <Button
                                    onClick={() => handleApproval(selectedApplication.id, 'approved')}
                                    disabled={processingId === selectedApplication.id}
                                    className="hover:bg-success/10 hover:border-success/40"
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

                    {application.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-success/10 hover:border-success/40 hover:text-success"
                          onClick={() => handleApproval(application.id, 'approved')}
                          disabled={processingId === application.id}
                        >
                          {processingId === application.id ? "..." : "Approve"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
                          onClick={() => handleApproval(application.id, 'rejected')}
                          disabled={processingId === application.id}
                        >
                          {processingId === application.id ? "..." : "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </AdminCard>
    </AdminSection>
  );

  return useContractorLayout ? content : (
    <AdminLayout 
      title="Application Manager" 
      description="Review and manage subcontractor applications efficiently"
    >
      {content}
    </AdminLayout>
  );
}