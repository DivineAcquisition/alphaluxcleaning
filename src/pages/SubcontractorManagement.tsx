import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Users,
  Star,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";

interface Subcontractor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  split_tier: string;
  rating: number;
  is_available: boolean;
  subscription_status: string;
  city: string;
  state: string;
  created_at: string;
}

const SubcontractorManagement = () => {
  const { user } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubcontractors();
    }
  }, [user]);

  const fetchSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast.error('Failed to load subcontractors');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubcontractorStatus = async (subcontractorId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ [field]: value })
        .eq('id', subcontractorId);

      if (error) throw error;
      toast.success('Subcontractor updated');
      fetchSubcontractors();
    } catch (error) {
      console.error('Error updating subcontractor:', error);
      toast.error('Failed to update subcontractor');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Subcontractor Management" description="Manage active subcontractors and their performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading subcontractors...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subcontractor Management" description="Manage active subcontractors and their performance">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button onClick={fetchSubcontractors} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Subcontractor Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Subcontractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.filter(sub => sub.subscription_status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.filter(sub => sub.is_available).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.length > 0 
                  ? (subcontractors.reduce((sum, sub) => sum + (sub.rating || 0), 0) / subcontractors.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subcontractors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subcontractors</CardTitle>
            <CardDescription>Manage active subcontractors and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontractors.map((subcontractor) => (
                  <TableRow key={subcontractor.id}>
                    <TableCell>
                      <div className="font-medium">{subcontractor.full_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{subcontractor.email}</div>
                        <div>{subcontractor.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {subcontractor.city}, {subcontractor.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(subcontractor.split_tier)}>
                        {subcontractor.split_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{subcontractor.rating || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(subcontractor.subscription_status)}>
                        {subcontractor.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={subcontractor.is_available ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSubcontractorStatus(
                          subcontractor.id, 
                          'is_available', 
                          !subcontractor.is_available
                        )}
                      >
                        {subcontractor.is_available ? 'Available' : 'Unavailable'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SubcontractorManagement;