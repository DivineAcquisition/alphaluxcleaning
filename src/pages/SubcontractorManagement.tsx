import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSubcontractorManagement } from '@/hooks/useSubcontractorManagement';
import { BulkActionsPanel } from '@/components/admin/BulkActionsPanel';
import { SubcontractorCard } from '@/components/admin/SubcontractorCard';
import { Users, CheckCircle, AlertTriangle, UserCheck, Star, Crown, Clock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TierConfig {
  tier_level: number;
  tier_name: string;
  hourly_rate: number;
  monthly_fee: number;
  reviews_required: number;
  jobs_required: number;
}

export default function SubcontractorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedAccountStatus, setSelectedAccountStatus] = useState<string>('all');
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [onboardingInProgress, setOnboardingInProgress] = useState<string[]>([]);

  // Tier management states
  const [selectedForTierChange, setSelectedForTierChange] = useState<any>(null);
  const [newTierLevel, setNewTierLevel] = useState<number>(1);
  const [tierChangeReason, setTierChangeReason] = useState('');

  // Dialog states for individual actions
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendEndDate, setSuspendEndDate] = useState('');
  const [banReason, setBanReason] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const { toast } = useToast();

  const {
    subcontractors,
    loading,
    suspendAccount,
    unsuspendAccount,
    banAccount,
    forcePasswordReset,
    sendCustomEmail,
    exportSubcontractorData,
    completeOnboarding,
    updateTier,
    refreshSubcontractors
  } = useSubcontractorManagement();

  // Fetch tier configurations
  const { data: tierConfigs = [] } = useQuery({
    queryKey: ['tier-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_system_config')
        .select('*')
        .order('tier_level');
      
      if (error) throw error;
      return data as TierConfig[];
    }
  });

  // Filter subcontractors based on search, tier, status, and tab
  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || sub.tier_level?.toString() === selectedTier;
    const matchesLocation = selectedLocation === 'all' || sub.state === selectedLocation;
    const matchesStatus = selectedAccountStatus === 'all' || sub.account_status === selectedAccountStatus;
    
    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'applications') {
      matchesTab = sub.type === 'application';
    } else if (activeTab === 'active') {
      matchesTab = sub.type === 'subcontractor' && sub.account_status === 'active';
    }
    
    return matchesSearch && matchesTier && matchesLocation && matchesStatus && matchesTab;
  });

  // Statistics
  const stats = {
    total: subcontractors.length,
    applications: subcontractors.filter(s => s.type === 'application').length,
    active: subcontractors.filter(s => s.type === 'subcontractor' && s.account_status === 'active').length,
    suspended: subcontractors.filter(s => s.account_status === 'suspended').length,
    avgRating: subcontractors.reduce((acc, sub) => acc + (sub.rating || 0), 0) / Math.max(subcontractors.length, 1)
  };

  // Tier statistics
  const tierStats = tierConfigs.map(config => ({
    ...config,
    count: subcontractors.filter(s => s.tier_level === config.tier_level && s.type === 'subcontractor').length
  }));

  const handleSelectSubcontractor = (id: string, checked: boolean) => {
    setSelectedSubcontractors(prev =>
      checked ? [...prev, id] : prev.filter(subId => subId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedSubcontractors(checked ? filteredSubcontractors.map(s => s.id) : []);
  };

  const getTierBadgeVariant = (tier: number) => {
    switch (tier) {
      case 3: return "default";
      case 2: return "secondary";
      default: return "outline";
    }
  };

  const getTierName = (tier: number) => {
    const config = tierConfigs.find(t => t.tier_level === tier);
    return config?.tier_name || `Tier ${tier}`;
  };

  const getStatusBadge = (sub: any) => {
    if (sub.type === 'application') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Onboarding</Badge>;
    }
    
    switch (sub.account_status) {
      case 'active':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleTierUpdate = async () => {
    if (!selectedForTierChange || !tierChangeReason.trim()) return;
    
    await updateTier(selectedForTierChange.id, newTierLevel, tierChangeReason);
    setSelectedForTierChange(null);
    setTierChangeReason('');
  };

  const handleCompleteOnboarding = async (applicationId: string) => {
    setOnboardingInProgress(prev => [...prev, applicationId]);
    try {
      await completeOnboarding(applicationId);
      toast({
        title: "Onboarding Completed!",
        description: "Subcontractor account created successfully. Welcome email sent.",
      });
    } catch (error) {
      toast({
        title: "Onboarding Failed",
        description: "There was an error completing the onboarding process.",
        variant: "destructive",
      });
    } finally {
      setOnboardingInProgress(prev => prev.filter(id => id !== applicationId));
    }
  };

  const uniqueLocations = [...new Set(subcontractors.map(sub => sub.state).filter(Boolean))];

  if (loading) {
    return (
      <AdminLayout title="Subcontractor Management" description="Loading...">
        <div>Loading subcontractor management data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Subcontractor & Tier Management" 
      description="Unified subcontractor management with applications, tiers, and comprehensive controls"
    >
      <div className="space-y-6">
        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.applications}</div>
              <p className="text-xs text-muted-foreground">Need onboarding</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tierStats.map((tier) => (
            <Card key={tier.tier_level}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{tier.tier_name}</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tier.count}</div>
                <p className="text-xs text-muted-foreground">
                  ${tier.hourly_rate}/hr • ${tier.monthly_fee}/month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Input
            placeholder="Search subcontractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tierConfigs.map((tier) => (
                <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                  {tier.tier_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAccountStatus} onValueChange={setSelectedAccountStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedSubcontractors.length > 0 && (
          <BulkActionsPanel
            selectedCount={selectedSubcontractors.length}
            onClearSelection={() => setSelectedSubcontractors([])}
            onBulkEmail={() => {/* Implement bulk email */}}
            onBulkExport={() => exportSubcontractorData(selectedSubcontractors)}
            onBulkSuspend={() => {/* Implement bulk suspend */}}
            onBulkUnsuspend={() => {/* Implement bulk unsuspend */}}
            onBulkBan={() => {/* Implement bulk ban */}}
            onBulkAvailabilityUpdate={() => {/* Implement bulk availability */}}
            onBulkPasswordReset={() => {/* Implement bulk password reset */}}
          />
        )}

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({stats.applications})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectedSubcontractors.length === filteredSubcontractors.length && filteredSubcontractors.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="selectAll" className="text-sm font-medium">
                Select all ({filteredSubcontractors.length})
              </label>
            </div>

            {/* Subcontractors List */}
            <div className="grid gap-4">
              {filteredSubcontractors.map((subcontractor) => (
                <Card key={subcontractor.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedSubcontractors.includes(subcontractor.id)}
                        onCheckedChange={(checked) => handleSelectSubcontractor(subcontractor.id, checked as boolean)}
                      />
                      
                      <div>
                        <h3 className="font-semibold">{subcontractor.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{subcontractor.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(subcontractor)}
                          {subcontractor.type === 'subcontractor' && (
                            <Badge variant={getTierBadgeVariant(subcontractor.tier_level || 1)}>
                              {getTierName(subcontractor.tier_level || 1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      {subcontractor.type === 'subcontractor' && (
                        <>
                          <div className="text-center">
                            <div className="font-medium">{subcontractor.review_count || 0}</div>
                            <div className="text-muted-foreground">Reviews</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{subcontractor.completed_jobs_count || 0}</div>
                            <div className="text-muted-foreground">Jobs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">${subcontractor.hourly_rate || 0}</div>
                            <div className="text-muted-foreground">Per Hour</div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex gap-2">
                        {subcontractor.type === 'application' ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleCompleteOnboarding(subcontractor.id)}
                            disabled={onboardingInProgress.includes(subcontractor.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {onboardingInProgress.includes(subcontractor.id) ? 'Processing...' : 'Complete Onboarding'}
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedForTierChange(subcontractor);
                                  setNewTierLevel(subcontractor.tier_level || 1);
                                }}
                              >
                                Adjust Tier
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Tier for {subcontractor.full_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Current Tier</label>
                                  <p className="text-sm text-muted-foreground">
                                    {getTierName(subcontractor.tier_level || 1)} - ${subcontractor.hourly_rate || 0}/hr
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">New Tier</label>
                                  <Select value={newTierLevel.toString()} onValueChange={(value) => setNewTierLevel(parseInt(value))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tierConfigs.map((tier) => (
                                        <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                                          {tier.tier_name} - ${tier.hourly_rate}/hr
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Reason for Change</label>
                                  <Textarea
                                    value={tierChangeReason}
                                    onChange={(e) => setTierChangeReason(e.target.value)}
                                    placeholder="Enter reason for tier adjustment..."
                                  />
                                </div>
                                
                                <Button
                                  onClick={handleTierUpdate}
                                  disabled={!tierChangeReason.trim()}
                                  className="w-full"
                                >
                                  Update Tier
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSubcontractors.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}