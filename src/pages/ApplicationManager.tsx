import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  RefreshCw
} from "lucide-react";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  why_join_us: string;
  previous_cleaning_experience: string;
  availability: string;
  preferred_work_areas: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_drivers_license: boolean;
  has_own_vehicle: boolean;
  can_lift_heavy_items: boolean;
  comfortable_with_chemicals: boolean;
  reliable_transportation: boolean;
  background_check_consent: boolean;
  brand_shirt_consent: boolean;
  subcontractor_agreement_consent: boolean;
  status: string;
  created_at: string;
  admin_notes?: string;
}

const ApplicationManager = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Application Manager" description="Review and manage subcontractor applications">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading applications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Application Manager" description="Review and manage subcontractor applications">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button onClick={fetchApplications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Applications Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Review and manage subcontractor applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{application.full_name}</div>
                          <div className="text-sm text-muted-foreground">{application.preferred_work_areas}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {application.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{application.previous_cleaning_experience || 'No experience listed'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(value) => updateApplicationStatus(application.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Application Details - {selectedApplication.full_name}</CardTitle>
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                    <p><strong>Availability:</strong> {selectedApplication.availability}</p>
                    <p><strong>Preferred Areas:</strong> {selectedApplication.preferred_work_areas}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Emergency Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedApplication.emergency_contact_name}</p>
                    <p><strong>Phone:</strong> {selectedApplication.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Experience & Motivation</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Why join us:</strong> {selectedApplication.why_join_us}</p>
                  <p><strong>Previous experience:</strong> {selectedApplication.previous_cleaning_experience}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <p>Driver's License: {selectedApplication.has_drivers_license ? '✅' : '❌'}</p>
                  <p>Own Vehicle: {selectedApplication.has_own_vehicle ? '✅' : '❌'}</p>
                  <p>Can Lift Heavy Items: {selectedApplication.can_lift_heavy_items ? '✅' : '❌'}</p>
                  <p>Comfortable with Chemicals: {selectedApplication.comfortable_with_chemicals ? '✅' : '❌'}</p>
                  <p>Reliable Transportation: {selectedApplication.reliable_transportation ? '✅' : '❌'}</p>
                  <p>Background Check Consent: {selectedApplication.background_check_consent ? '✅' : '❌'}</p>
                </div>
              </div>

              {selectedApplication.admin_notes && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Notes</h4>
                  <p className="text-sm">{selectedApplication.admin_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ApplicationManager;