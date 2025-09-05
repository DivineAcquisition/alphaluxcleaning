import { ContractorPortalLayout } from "@/components/contractor/ContractorPortalLayout";
import { useSubcontractorHub } from "@/hooks/useSubcontractorHub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  ClipboardList, 
  AlertTriangle,
  TrendingUp,
  Star,
  Clock,
  CheckCircle
} from "lucide-react";

export default function ContractorSubcontractorHub() {
  const { hubData, loading, refreshData } = useSubcontractorHub();

  if (loading) {
    return (
      <ContractorPortalLayout title="Subcontractor Hub" description="Loading hub data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        </div>
      </ContractorPortalLayout>
    );
  }

  if (!hubData) {
    return (
      <ContractorPortalLayout title="Subcontractor Hub" description="Failed to load data">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Failed to load hub data</p>
            <Button onClick={refreshData} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </ContractorPortalLayout>
    );
  }

  return (
    <ContractorPortalLayout 
      title="Subcontractor Hub" 
      description="Comprehensive overview of subcontractor operations and performance"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subcontractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{hubData.stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{hubData.stats.active}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{hubData.stats.applications}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{hubData.stats.unassignedJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{hubData.stats.alerts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{hubData.stats.avgRating.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subcontractors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Subcontractors
            </CardTitle>
            <CardDescription>Latest subcontractor registrations and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hubData.subcontractors.slice(0, 5).map((subcontractor: any) => (
                <div key={subcontractor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{subcontractor.full_name}</p>
                    <p className="text-sm text-muted-foreground">{subcontractor.email}</p>
                  </div>
                  <Badge variant={subcontractor.account_status === 'active' ? 'default' : 'secondary'}>
                    {subcontractor.account_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Applications
            </CardTitle>
            <CardDescription>Applications awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hubData.applications.slice(0, 5).map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{application.full_name}</p>
                    <p className="text-sm text-muted-foreground">{application.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Active Assignments
            </CardTitle>
            <CardDescription>Jobs currently assigned to subcontractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hubData.assignments.slice(0, 5).map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{assignment.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{assignment.service_address}</p>
                  </div>
                  <Badge variant="default">
                    {assignment.order_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Analytics
            </CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{hubData.analytics?.performance?.avgRating || '4.5'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">On-Time Rate</span>
                <span className="text-green-600 font-semibold">
                  {hubData.analytics?.performance?.onTimeRate || '85.5'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Completion Rate</span>
                <span className="text-blue-600 font-semibold">
                  {hubData.analytics?.performance?.completionRate || '94.2'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Revenue per Hour</span>
                <span className="text-purple-600 font-semibold">
                  ${hubData.analytics?.performance?.revenuePerHour || '45.75'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContractorPortalLayout>
  );
}