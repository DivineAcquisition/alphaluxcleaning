import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminGrid } from '@/components/admin/AdminGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Eye, Mail, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommercialEstimate {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_type: string;
  square_footage: number;
  service_type: string;
  frequency: string;
  status: string;
  created_at: string;
  preferred_walkthrough_date: string;
  preferred_walkthrough_time: string;
}

export default function CommercialEstimates() {
  const [estimates, setEstimates] = useState<CommercialEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_estimates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEstimates(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(e => e.status === 'pending').length || 0;
      const scheduled = data?.filter(e => e.status === 'scheduled').length || 0;
      const completed = data?.filter(e => e.status === 'completed').length || 0;
      
      setStats({ total, pending, scheduled, completed });
    } catch (error) {
      console.error('Error fetching estimates:', error);
      toast({
        title: "Error",
        description: "Failed to load commercial estimates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEstimateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('commercial_estimates')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Estimate status updated successfully"
      });
      
      fetchEstimates(); // Refresh data
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast({
        title: "Error",
        description: "Failed to update estimate status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'scheduled': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Commercial Estimates" description="Manage commercial cleaning estimate requests">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Commercial Estimates" 
      description="Manage commercial cleaning estimate requests"
    >
      {/* Stats Overview */}
      <AdminGrid columns={4} className="mb-6">
        <AdminCard 
          title="Total Requests" 
          variant="default"
          icon={<Building className="h-5 w-5" />}
        >
          {stats.total.toString()}
        </AdminCard>
        <AdminCard 
          title="Pending Review" 
          variant="stat"
          icon={<Clock className="h-5 w-5" />}
        >
          {stats.pending.toString()}
        </AdminCard>
        <AdminCard 
          title="Scheduled" 
          variant="metric"
          icon={<AlertCircle className="h-5 w-5" />}
        >
          {stats.scheduled.toString()}
        </AdminCard>
        <AdminCard 
          title="Completed" 
          variant="stat"
          icon={<CheckCircle className="h-5 w-5" />}
        >
          {stats.completed.toString()}
        </AdminCard>
      </AdminGrid>

      {/* Estimates Table */}
      <AdminCard title="Commercial Estimate Requests" description="All commercial cleaning estimate requests">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service Details</TableHead>
              <TableHead>Walkthrough</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((estimate) => (
              <TableRow key={estimate.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{estimate.business_name}</div>
                    <div className="text-sm text-muted-foreground">{estimate.business_type}</div>
                    <div className="text-sm text-muted-foreground">{estimate.square_footage.toLocaleString()} sq ft</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estimate.contact_person}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {estimate.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {estimate.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estimate.service_type}</div>
                    <div className="text-sm text-muted-foreground">{estimate.frequency}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{estimate.preferred_walkthrough_date}</div>
                    <div className="text-sm text-muted-foreground">{estimate.preferred_walkthrough_time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(estimate.status)} className="flex items-center gap-1">
                    {getStatusIcon(estimate.status)}
                    {estimate.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {estimate.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateEstimateStatus(estimate.id, 'scheduled')}
                      >
                        Schedule
                      </Button>
                    )}
                    {estimate.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateEstimateStatus(estimate.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {estimates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No commercial estimates found
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}