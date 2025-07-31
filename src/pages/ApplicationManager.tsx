import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
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
      description="Review and manage subcontractor applications efficiently"
    >
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
            <div className="text-3xl font-bold tracking-tight">47</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Pending Review"
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">8</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Approved"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">32</div>
            <p className="text-xs text-muted-foreground mt-1">68% approval rate</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Rejected"
            icon={<XCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-destructive">7</div>
            <p className="text-xs text-muted-foreground mt-1">15% rejection rate</p>
          </AdminCard>
        </AdminGrid>

        {/* Applications List */}
        <AdminCard
          title="Recent Applications"
          description="Review and process subcontractor applications with detailed information"
          variant="default"
        >
          <div className="space-y-4">
            {applications.map((application) => {
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
                      <h3 className="font-semibold text-lg tracking-tight">{application.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          📧 {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          📞 {application.phone}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 bg-muted/30 px-2 py-1 rounded-md inline-block">
                        Submitted: {application.submittedAt} • Experience: {application.experience}
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
                    {application.status === "pending" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-success/10 hover:border-success/40 hover:text-success">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive">
                          Reject
                        </Button>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      </AdminSection>
    </AdminLayout>
  );
}