import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, Upload, Activity, HardDrive } from "lucide-react";

export default function DatabaseTools() {
  return (
    <AdminLayout 
      title="Database Tools" 
      description="Database management, backups, and performance monitoring"
    >
      <div className="space-y-6">
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            title="Database Size"
            description="Total storage used"
            icon={<HardDrive className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">2.4 GB</div>
          </AdminCard>

          <AdminCard
            title="Active Connections"
            description="Current database connections"
            icon={<Activity className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">12</div>
          </AdminCard>

          <AdminCard
            title="Last Backup"
            description="Most recent backup"
            icon={<Database className="h-5 w-5" />}
          >
            <div className="text-sm font-medium mt-2">2 hours ago</div>
          </AdminCard>
        </AdminGrid>

        <AdminGrid columns={2} gap="lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Database Backup
              </CardTitle>
              <CardDescription>
                Create and download database backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
              <Button variant="outline" className="w-full">
                View Backup History
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Data Import/Export
              </CardTitle>
              <CardDescription>
                Import and export data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline" className="w-full">
                Export Data
              </Button>
            </CardContent>
          </Card>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Monitor database performance and query statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Performance monitoring dashboard coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}