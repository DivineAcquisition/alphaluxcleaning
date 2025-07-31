import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, Shield } from "lucide-react";

export default function UserManagement() {
  return (
    <AdminLayout 
      title="User Management" 
      description="Manage user accounts, roles, and permissions across the platform"
    >
      <div className="space-y-6">
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            title="Total Users"
            description="Active user accounts"
            icon={<Users className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">1,247</div>
          </AdminCard>

          <AdminCard
            title="Admin Users"
            description="Administrator accounts"
            icon={<Shield className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">5</div>
          </AdminCard>

          <AdminCard
            title="New This Month"
            description="Recent registrations"
            icon={<UserPlus className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">89</div>
          </AdminCard>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10" />
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>John Doe</TableCell>
                  <TableCell>john@example.com</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Customer</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>jane@example.com</TableCell>
                  <TableCell>
                    <Badge variant="default">Admin</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}