import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  BarChart3,
  Bell,
  Zap
} from 'lucide-react';
import { useSubcontractorManagement, EnhancedSubcontractor } from '@/hooks/useSubcontractorManagement';
import { BulkActionsPanel } from '@/components/admin/BulkActionsPanel';
import { SubcontractorCard } from '@/components/admin/SubcontractorCard';
import { PerformanceAnalyticsDashboard } from '@/components/admin/PerformanceAnalyticsDashboard';
import { AdvancedFilters, FilterOptions } from '@/components/admin/AdvancedFilters';
import { AccountStatusManager } from '@/components/admin/AccountStatusManager';
import { SecurityAuditPanel } from '@/components/admin/SecurityAuditPanel';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function SubcontractorManagement() {
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

  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completingOnboarding, setCompletingOnboarding] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedSubcontractorForStatus, setSelectedSubcontractorForStatus] = useState<EnhancedSubcontractor | null>(null);
  const [processingNotifications, setProcessingNotifications] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    tier: 'all',
    rating: 'all',
    availability: 'all',
    location: '',
    joinedDate: 'all',
    complaints: 'all',
    jobsCompleted: 'all'
  });

  // Dialogs
  const [tierDialog, setTierDialog] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [newTier, setNewTier] = useState<number>(1);
  const [tierChangeReason, setTierChangeReason] = useState('');

  // Advanced filtering logic
  const filteredSubcontractors = useMemo(() => {
    let filtered = subcontractors.filter(sub => {
      switch (activeTab) {
        case 'applications':
          return sub.status === 'approved' && !sub.user_id;
        case 'active':
          return sub.user_id && sub.account_status === 'active';
        default:
          return true;
      }
    });

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.full_name?.toLowerCase().includes(searchTerm) ||
        sub.email?.toLowerCase().includes(searchTerm) ||
        sub.phone?.toLowerCase().includes(searchTerm) ||
        sub.city?.toLowerCase().includes(searchTerm) ||
        sub.state?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(sub => {
        if (filters.status === 'pending') return sub.status === 'approved' && !sub.user_id;
        if (filters.status === 'active') return sub.account_status === 'active';
        if (filters.status === 'suspended') return sub.account_status === 'suspended';
        if (filters.status === 'banned') return sub.account_status === 'banned';
        return true;
      });
    }

    // Apply tier filter
    if (filters.tier !== 'all') {
      filtered = filtered.filter(sub => sub.tier_level === parseInt(filters.tier));
    }

    // Apply rating filter
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(sub => sub.rating >= minRating);
    }

    // Apply availability filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      filtered = filtered.filter(sub => sub.is_available === isAvailable);
    }

    // Apply location filter
    if (filters.location) {
      const locationTerm = filters.location.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.city?.toLowerCase().includes(locationTerm) ||
        sub.state?.toLowerCase().includes(locationTerm)
      );
    }

    // Apply jobs completed filter
    if (filters.jobsCompleted !== 'all') {
      filtered = filtered.filter(sub => {
        const jobs = sub.jobsCompleted || 0;
        switch (filters.jobsCompleted) {
          case '0': return jobs === 0;
          case '1-10': return jobs >= 1 && jobs <= 10;
          case '11-25': return jobs >= 11 && jobs <= 25;
          case '26-50': return jobs >= 26 && jobs <= 50;
          case '50+': return jobs > 50;
          default: return true;
        }
      });
    }

    return filtered;
  }, [subcontractors, activeTab, filters]);

  // Load performance notifications
  const loadNotifications = async () => {
    setProcessingNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke('performance-notifications');
      if (error) throw error;
      setNotifications(data?.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setProcessingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSubcontractors.map(sub => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      tier: 'all',
      rating: 'all',
      availability: 'all',
      location: '',
      joinedDate: 'all',
      complaints: 'all',
      jobsCompleted: 'all'
    });
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked ? [...prev, id] : prev.filter(subId => subId !== id)
    );
  };

  const handleCompleteOnboarding = async (applicationId: string) => {
    setCompletingOnboarding(prev => [...prev, applicationId]);
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
      setCompletingOnboarding(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleTierUpdate = async () => {
    if (!selectedSubcontractor || !tierChangeReason.trim()) return;
    
    try {
      await updateTier(selectedSubcontractor, newTier, tierChangeReason);
      setTierDialog(false);
      setSelectedSubcontractor('');
      setTierChangeReason('');
      toast({
        title: "Tier Updated",
        description: "Subcontractor tier has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update subcontractor tier.",
        variant: "destructive",
      });
    }
  };

  // Bulk action handlers
  const handleBulkAvailabilityUpdate = async (available: boolean) => {
    // Implement bulk availability update
    toast({
      title: "Bulk Update",
      description: `Updated availability for ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkSuspend = async (reason: string, endDate?: Date) => {
    for (const id of selectedIds) {
      await suspendAccount(id, reason, endDate);
    }
    setSelectedIds([]);
    toast({
      title: "Bulk Suspend",
      description: `Suspended ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkUnsuspend = async () => {
    for (const id of selectedIds) {
      await unsuspendAccount(id);
    }
    setSelectedIds([]);
    toast({
      title: "Bulk Unsuspend",
      description: `Unsuspended ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkBan = async (reason: string) => {
    for (const id of selectedIds) {
      await banAccount(id, reason);
    }
    setSelectedIds([]);
    toast({
      title: "Bulk Ban",
      description: `Banned ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkEmail = async (subject: string, message: string) => {
    await sendCustomEmail(selectedIds, subject, message);
    setSelectedIds([]);
    toast({
      title: "Bulk Email Sent",
      description: `Email sent to ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkExport = async () => {
    await exportSubcontractorData(selectedIds);
    toast({
      title: "Export Complete",
      description: `Data exported for ${selectedIds.length} subcontractors.`,
    });
  };

  const handleBulkPasswordReset = async () => {
    for (const id of selectedIds) {
      await forcePasswordReset(id);
    }
    setSelectedIds([]);
    toast({
      title: "Bulk Password Reset",
      description: `Password reset emails sent to ${selectedIds.length} subcontractors.`,
    });
  };

  // Individual action handlers
  const handleUpdateAvailability = async (id: string, available: boolean) => {
    // Implementation for individual availability update
  };

  const handleSuspend = async (id: string) => {
    await suspendAccount(id, 'Manual suspension');
  };

  const handleUnsuspend = async (id: string) => {
    await unsuspendAccount(id);
  };

  const handleBan = async (id: string) => {
    await banAccount(id, 'Manual ban');
  };

  const handlePasswordReset = async (id: string) => {
    await forcePasswordReset(id);
  };

  const handleSendEmail = async (id: string) => {
    // Implementation for individual email
  };

  const handleOpenTierDialog = (subcontractor: any) => {
    setSelectedSubcontractor(subcontractor.id);
    setNewTier(subcontractor.tier_level || 1);
    setTierDialog(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Subcontractor Management" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading subcontractor management data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Statistics
  const stats = {
    total: subcontractors.length,
    applications: subcontractors.filter(s => s.status === 'approved' && !s.user_id).length,
    active: subcontractors.filter(s => s.user_id && s.account_status === 'active').length,
    suspended: subcontractors.filter(s => s.account_status === 'suspended').length,
    avgRating: subcontractors.reduce((acc, sub) => acc + (sub.rating || 0), 0) / Math.max(subcontractors.length, 1)
  };

  return (
    <AdminLayout 
      title="Advanced Subcontractor Management" 
      description="Phase 3: Comprehensive subcontractor management with performance analytics and intelligent notifications"
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
              <p className="text-xs text-muted-foreground">Subcontractors & Applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.applications}</div>
              <p className="text-xs text-muted-foreground">Pending onboarding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Working subcontractors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Performance alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Smart Notifications Bar */}
        {notifications.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">Smart Alerts</span>
                  <Badge variant="secondary">{notifications.length} active</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadNotifications}
                  disabled={processingNotifications}
                >
                  {processingNotifications ? 'Refreshing...' : 'Refresh Alerts'}
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="text-sm text-orange-800 bg-orange-100 rounded p-2">
                    <span className="font-medium">{notification.priority.toUpperCase()}:</span> {notification.message}
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-sm text-orange-700">+{notifications.length - 3} more alerts...</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All ({subcontractors.length})
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Applications ({stats.applications})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active ({stats.active})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={refreshSubcontractors} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* All Subcontractors Tab */}
          <TabsContent value="all" className="space-y-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              totalResults={subcontractors.length}
              filteredResults={filteredSubcontractors.length}
            />

            {selectedIds.length > 0 && (
              <BulkActionsPanel
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                onBulkAvailabilityUpdate={handleBulkAvailabilityUpdate}
                onBulkSuspend={handleBulkSuspend}
                onBulkUnsuspend={handleBulkUnsuspend}
                onBulkBan={handleBulkBan}
                onBulkEmail={handleBulkEmail}
                onBulkExport={handleBulkExport}
                onBulkPasswordReset={handleBulkPasswordReset}
              />
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Subcontractors</CardTitle>
                    <CardDescription>
                      Manage all subcontractors and applications in one place
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.length === filteredSubcontractors.length && filteredSubcontractors.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Select all</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSubcontractors.map((contractor) => (
                    <SubcontractorCard
                      key={contractor.id}
                      contractor={contractor}
                      isSelected={selectedIds.includes(contractor.id)}
                      onSelect={handleSelect}
                      onUpdateAvailability={handleUpdateAvailability}
                      onSuspend={handleSuspend}
                      onUnsuspend={handleUnsuspend}
                      onBan={handleBan}
                      onPasswordReset={handlePasswordReset}
                      onSendEmail={handleSendEmail}
                    />
                  ))}
                  {filteredSubcontractors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subcontractors found matching your filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Approved applications ready for onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSubcontractors.filter(s => s.status === 'approved' && !s.user_id).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{application.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{application.email}</p>
                      </div>
                      <Button 
                        onClick={() => handleCompleteOnboarding(application.id)}
                        disabled={completingOnboarding.includes(application.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {completingOnboarding.includes(application.id) ? 'Processing...' : 'Complete Onboarding'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Subcontractors</CardTitle>
                <CardDescription>Currently active subcontractors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSubcontractors.filter(s => s.user_id && s.account_status === 'active').map((contractor) => (
                    <SubcontractorCard
                      key={contractor.id}
                      contractor={contractor}
                      isSelected={selectedIds.includes(contractor.id)}
                      onSelect={handleSelect}
                      onUpdateAvailability={handleUpdateAvailability}
                      onSuspend={handleSuspend}
                      onUnsuspend={handleUnsuspend}
                      onBan={handleBan}
                      onPasswordReset={handlePasswordReset}
                      onSendEmail={handleSendEmail}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <PerformanceAnalyticsDashboard />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceAnalyticsDashboard />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6">
              <SecurityAuditPanel />
              
              {selectedSubcontractorForStatus && (
                <AccountStatusManager
                  subcontractorId={selectedSubcontractorForStatus.id}
                  currentStatus={selectedSubcontractorForStatus.account_status || 'active'}
                  subcontractorName={selectedSubcontractorForStatus.full_name}
                  onStatusUpdate={() => {
                    refreshSubcontractors();
                    setSelectedSubcontractorForStatus(null);
                  }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Tier Update Dialog */}
        <Dialog open={tierDialog} onOpenChange={setTierDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Subcontractor Tier</DialogTitle>
              <DialogDescription>
                Change the tier level and rates for this subcontractor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tier">New Tier Level</Label>
                <Select value={newTier.toString()} onValueChange={(value) => setNewTier(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tier 1 - Standard</SelectItem>
                    <SelectItem value="2">Tier 2 - Professional</SelectItem>
                    <SelectItem value="3">Tier 3 - Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={tierChangeReason}
                  onChange={(e) => setTierChangeReason(e.target.value)}
                  placeholder="Enter reason for tier change..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTierDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleTierUpdate} disabled={!tierChangeReason.trim()}>
                Update Tier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}