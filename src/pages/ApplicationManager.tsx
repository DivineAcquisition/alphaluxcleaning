import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  why_join_us: string;
  previous_cleaning_experience?: string;
  availability: string;
  admin_notes?: string;
  created_at: string;
}

export default function ApplicationManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

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
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status, admin_notes: notes } : app
        )
      );
      
      toast.success(`Application ${status}`);
      setSelectedApp(null);
      setAdminNotes("");
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Application Manager" description="Review and manage subcontractor applications">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Application Manager" description="Review and manage subcontractor applications">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subcontractor Applications</CardTitle>
            <CardDescription>
              Review and approve new subcontractor applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No applications found.
              </p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{application.full_name}</h3>
                        <p className="text-muted-foreground">{application.email}</p>
                        <p className="text-muted-foreground">{application.phone}</p>
                        <Badge variant={getStatusColor(application.status)} className="mt-2">
                          {application.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Applied: {new Date(application.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Why they want to join:</h4>
                        <p className="text-sm text-muted-foreground">{application.why_join_us}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Experience:</h4>
                        <p className="text-sm text-muted-foreground">
                          {application.previous_cleaning_experience || "No previous experience mentioned"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Availability:</h4>
                      <p className="text-sm text-muted-foreground">{application.availability}</p>
                    </div>

                    {application.admin_notes && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Admin Notes:</h4>
                        <p className="text-sm text-muted-foreground">{application.admin_notes}</p>
                      </div>
                    )}

                    {application.status === 'pending' && (
                      <div className="space-y-3">
                        {selectedApp === application.id && (
                          <div>
                            <Textarea
                              placeholder="Add notes about this application..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          {selectedApp === application.id ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateApplicationStatus(application.id, 'approved', adminNotes)}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected', adminNotes)}
                              >
                                Reject
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedApp(null);
                                  setAdminNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(application.id);
                                setAdminNotes(application.admin_notes || "");
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}