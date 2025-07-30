import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, User } from "lucide-react";

export default function ApplicationManager() {
  // Mock data for demonstration
  const applications = [
    {
      id: 1,
      name: "Mike Davis",
      email: "mike@example.com",
      phone: "(555) 111-2222",
      status: "pending",
      submittedAt: "2024-01-15",
      experience: "5 years"
    },
    {
      id: 2,
      name: "Lisa Chen",
      email: "lisa@example.com", 
      phone: "(555) 333-4444",
      status: "approved",
      submittedAt: "2024-01-14",
      experience: "3 years"
    },
    {
      id: 3,
      name: "Tom Wilson",
      email: "tom@example.com",
      phone: "(555) 555-6666",
      status: "rejected",
      submittedAt: "2024-01-13",
      experience: "1 year"
    }
  ];

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

  return (
    <AdminLayout 
      title="Application Manager" 
      description="Review and manage subcontractor applications"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">68% approval rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">15% rejection rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Review and process subcontractor applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((application) => {
                const StatusIcon = getStatusIcon(application.status);
                return (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{application.name}</h3>
                        <p className="text-sm text-muted-foreground">{application.email}</p>
                        <p className="text-sm text-muted-foreground">{application.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {application.submittedAt} • Experience: {application.experience}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {application.status}
                      </Badge>
                      {application.status === "pending" && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm">
                            Reject
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}