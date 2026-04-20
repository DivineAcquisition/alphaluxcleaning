import { useState, useEffect } from "react";
import { SubcontractorManagementLayout } from "@/components/admin/SubcontractorManagementLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubcontractorTiers } from "@/hooks/useSubcontractorTiers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Award, 
  TrendingUp, 
  Settings, 
  Users,
  DollarSign,
  Star,
  Edit,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface TierConfig {
  id: string;
  tier_level: number;
  tier_name: string;
  hourly_rate: number;
  monthly_fee: number;
  reviews_required: number;
  jobs_required: number;
  is_active: boolean;
}

interface SubcontractorTierData {
  id: string;
  full_name: string;
  email: string;
  tier_level: number;
  completed_jobs_count: number;
  review_count: number;
  rating: number;
  can_upgrade: boolean;
  next_tier_requirements: string;
}

export default function SubcontractorTiers() {
  const { toast } = useToast();
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [subcontractors, setSubcontractors] = useState<SubcontractorTierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<TierConfig | null>(null);
  const [newTierData, setNewTierData] = useState({
    tier_name: '',
    hourly_rate: 0,
    monthly_fee: 0,
    reviews_required: 0,
    jobs_required: 0
  });

  useEffect(() => {
    fetchTierData();
  }, []);

  const fetchTierData = async () => {
    try {
      setLoading(true);
      
      // Fetch tier configurations
      const { data: configs, error: configError } = await supabase
        .from('tier_system_config')
        .select('*')
        .eq('is_active', true)
        .order('tier_level');

      if (configError) throw configError;

      // Fetch subcontractors with tier info
      const { data: subs, error: subsError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('account_status', 'active')
        .order('tier_level', { ascending: false });

      if (subsError) throw subsError;

      setTierConfigs(configs || []);

      // Process subcontractor data with tier upgrade eligibility
      const processedSubs = subs?.map(sub => {
        const currentTier = configs?.find(c => c.tier_level === sub.tier_level);
        const nextTier = configs?.find(c => c.tier_level === (sub.tier_level || 1) + 1);
        
        let canUpgrade = false;
        let nextTierRequirements = 'Max tier reached';
        
        if (nextTier) {
          const hasEnoughJobs = (sub.completed_jobs_count || 0) >= nextTier.jobs_required;
          const hasEnoughReviews = (sub.review_count || 0) >= nextTier.reviews_required;
          canUpgrade = hasEnoughJobs && hasEnoughReviews;
          
          if (!canUpgrade) {
            const missingJobs = Math.max(0, nextTier.jobs_required - (sub.completed_jobs_count || 0));
            const missingReviews = Math.max(0, nextTier.reviews_required - (sub.review_count || 0));
            nextTierRequirements = `Need: ${missingJobs} more jobs, ${missingReviews} more reviews`;
          } else {
            nextTierRequirements = 'Eligible for upgrade!';
          }
        }

        return {
          id: sub.id,
          full_name: sub.full_name,
          email: sub.email,
          tier_level: sub.tier_level || 1,
          completed_jobs_count: sub.completed_jobs_count || 0,
          review_count: sub.review_count || 0,
          rating: sub.rating || 0,
          can_upgrade: canUpgrade,
          next_tier_requirements: nextTierRequirements
        };
      }) || [];

      setSubcontractors(processedSubs);
    } catch (error) {
      console.error('Error fetching tier data:', error);
      toast({
        title: "Error",
        description: "Failed to load tier data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTierUpdate = async (tierId: string, newData: Partial<TierConfig>) => {
    try {
      const { error } = await supabase
        .from('tier_system_config')
        .update(newData)
        .eq('id', tierId);

      if (error) throw error;

      toast({
        title: "Tier Updated",
        description: "Tier configuration updated successfully",
      });

      fetchTierData();
      setEditingTier(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update tier configuration",
        variant: "destructive",
      });
    }
  };

  const handleSubcontractorTierUpgrade = async (subcontractorId: string, newTier: number) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ tier_level: newTier })
        .eq('id', subcontractorId);

      if (error) throw error;

      // Log tier change
      await supabase
        .from('tier_change_history')
        .insert({
          subcontractor_id: subcontractorId,
          old_tier: subcontractors.find(s => s.id === subcontractorId)?.tier_level,
          new_tier: newTier,
          automatic: false,
          change_reason: 'Manual tier upgrade by admin'
        });

      toast({
        title: "Tier Upgraded",
        description: "Subcontractor tier upgraded successfully",
      });

      fetchTierData();
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade subcontractor tier",
        variant: "destructive",
      });
    }
  };

  const tierDistribution = tierConfigs.map(tier => ({
    ...tier,
    count: subcontractors.filter(sub => sub.tier_level === tier.tier_level).length
  }));

  const eligibleForUpgrade = subcontractors.filter(sub => sub.can_upgrade).length;

  return (
    <SubcontractorManagementLayout 
      title="Tier Management" 
      description="Manage subcontractor tier system and progression"
    >
      <div className="space-y-6">
        {/* Tier Overview */}
        <AdminSection title="Tier System Overview" description="Current tier distribution and metrics">
          <AdminGrid columns={4} gap="md">
            <AdminCard variant="metric" title="Total Tiers" icon={<Award className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{tierConfigs.length}</div>
              <p className="text-xs text-muted-foreground">Active tier levels</p>
            </AdminCard>

            <AdminCard variant="metric" title="Eligible for Upgrade" icon={<TrendingUp className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-green-600">{eligibleForUpgrade}</div>
              <p className="text-xs text-muted-foreground">Ready for promotion</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Subcontractors" icon={<Users className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{subcontractors.length}</div>
              <p className="text-xs text-muted-foreground">In tier system</p>
            </AdminCard>

            <AdminCard variant="metric" title="Avg Tier Level" icon={<Star className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-blue-600">
                {(subcontractors.reduce((sum, sub) => sum + sub.tier_level, 0) / subcontractors.length || 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Average tier</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Tier Configuration */}
        <AdminSection title="Tier Configuration" description="Manage tier settings and requirements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tier Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Award className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading tier configuration...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Monthly Fee</TableHead>
                      <TableHead>Jobs Required</TableHead>
                      <TableHead>Reviews Required</TableHead>
                      <TableHead>Active Members</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tierConfigs.map((tier) => {
                      const memberCount = tierDistribution.find(t => t.tier_level === tier.tier_level)?.count || 0;
                      return (
                        <TableRow key={tier.id}>
                          <TableCell>
                            <Badge variant="outline">Tier {tier.tier_level}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{tier.tier_name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-success">${tier.hourly_rate.toFixed(2)}/hr</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${tier.monthly_fee.toFixed(2)}/mo</span>
                          </TableCell>
                          <TableCell>
                            <span>{tier.jobs_required} jobs</span>
                          </TableCell>
                          <TableCell>
                            <span>{tier.reviews_required} reviews</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{memberCount} members</Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingTier(tier);
                                    setNewTierData({
                                      tier_name: tier.tier_name,
                                      hourly_rate: tier.hourly_rate,
                                      monthly_fee: tier.monthly_fee,
                                      reviews_required: tier.reviews_required,
                                      jobs_required: tier.jobs_required
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Tier {tier.tier_level}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="tier_name">Tier Name</Label>
                                    <Input
                                      id="tier_name"
                                      value={newTierData.tier_name}
                                      onChange={(e) => setNewTierData({...newTierData, tier_name: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                                      <Input
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        value={newTierData.hourly_rate}
                                        onChange={(e) => setNewTierData({...newTierData, hourly_rate: parseFloat(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                                      <Input
                                        id="monthly_fee"
                                        type="number"
                                        step="0.01"
                                        value={newTierData.monthly_fee}
                                        onChange={(e) => setNewTierData({...newTierData, monthly_fee: parseFloat(e.target.value)})}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="jobs_required">Jobs Required</Label>
                                      <Input
                                        id="jobs_required"
                                        type="number"
                                        value={newTierData.jobs_required}
                                        onChange={(e) => setNewTierData({...newTierData, jobs_required: parseInt(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="reviews_required">Reviews Required</Label>
                                      <Input
                                        id="reviews_required"
                                        type="number"
                                        value={newTierData.reviews_required}
                                        onChange={(e) => setNewTierData({...newTierData, reviews_required: parseInt(e.target.value)})}
                                      />
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => editingTier && handleTierUpdate(editingTier.id, newTierData)}
                                    className="w-full"
                                  >
                                    Update Tier Configuration
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </AdminSection>

        {/* Subcontractor Tier Status */}
        <AdminSection title="Subcontractor Tier Status" description="Individual tier progression tracking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tier Progression ({subcontractors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Current Tier</TableHead>
                    <TableHead>Jobs Completed</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Upgrade Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcontractors.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.full_name}</p>
                          <p className="text-sm text-muted-foreground">{sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Tier {sub.tier_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{sub.completed_jobs_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{sub.review_count}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{sub.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {sub.can_upgrade ? (
                            <Badge className="bg-green-100 text-green-800">Eligible for upgrade!</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">{sub.next_tier_requirements}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.can_upgrade && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubcontractorTierUpgrade(sub.id, sub.tier_level + 1)}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Upgrade
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AdminSection>
      </div>
    </SubcontractorManagementLayout>
  );
}