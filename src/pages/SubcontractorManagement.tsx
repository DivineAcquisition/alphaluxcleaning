import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subcontractor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
  subscription_status: string;
  split_tier: string;
  rating: number;
  created_at: string;
}

export default function SubcontractorManagement() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcontractors();
  }, []);

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
      setLoading(false);
    }
  };

  const updateSubcontractorStatus = async (id: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: isAvailable })
        .eq('id', id);

      if (error) throw error;
      
      setSubcontractors(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, is_available: isAvailable } : sub
        )
      );
      
      toast.success(`Subcontractor ${isAvailable ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating subcontractor:', error);
      toast.error('Failed to update subcontractor status');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Subcontractor Management" description="Manage your subcontractor network">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading subcontractors...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subcontractor Management" description="Manage your subcontractor network">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Subcontractors</CardTitle>
            <CardDescription>
              Manage your network of cleaning subcontractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subcontractors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No subcontractors found. New applications will appear here once approved.
              </p>
            ) : (
              <div className="space-y-4">
                {subcontractors.map((subcontractor) => (
                  <div key={subcontractor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{subcontractor.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{subcontractor.email}</p>
                      <p className="text-sm text-muted-foreground">{subcontractor.phone}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={subcontractor.is_available ? "default" : "secondary"}>
                          {subcontractor.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        <Badge variant="outline">{subcontractor.split_tier}</Badge>
                        <Badge variant="outline">Rating: {subcontractor.rating}/5</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={subcontractor.is_available ? "outline" : "default"}
                        onClick={() => updateSubcontractorStatus(subcontractor.id, !subcontractor.is_available)}
                      >
                        {subcontractor.is_available ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
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