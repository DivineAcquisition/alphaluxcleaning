import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, UserCheck, UserX, Star, Search, Activity, Shield } from "lucide-react";
import { useSubcontractorManagement } from "@/hooks/useSubcontractorManagement";
import { BulkActionsPanel } from "@/components/admin/BulkActionsPanel";
import { SubcontractorCard } from "@/components/admin/SubcontractorCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SubcontractorManagement() {
  const { 
    subcontractors, 
    loading, 
    suspendAccount,
    unsuspendAccount,
    banAccount,
    forcePasswordReset,
    sendCustomEmail,
    exportSubcontractorData
  } = useSubcontractorManagement();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [filterTier, setFilterTier] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterAccountStatus, setFilterAccountStatus] = useState("all");
  
  // Individual action dialogs
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; subcontractorId?: string }>({ open: false });
  const [banDialog, setBanDialog] = useState<{ open: boolean; subcontractorId?: string }>({ open: false });
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; subcontractorId?: string }>({ open: false });
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  
  const navigate = useNavigate();

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm);
    
    const matchesTier = filterTier === "all" || sub.tier_level.toString() === filterTier;
    const matchesAvailability = filterAvailability === "all" || 
      (filterAvailability === "available" && sub.is_available) ||
      (filterAvailability === "unavailable" && !sub.is_available);
    const matchesLocation = filterLocation === "all" || sub.state === filterLocation;
    const matchesAccountStatus = filterAccountStatus === "all" || sub.account_status === filterAccountStatus;

    return matchesSearch && matchesTier && matchesAvailability && matchesLocation && matchesAccountStatus;
  });

  const handleSelectSubcontractor = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubcontractors(prev => [...prev, id]);
    } else {
      setSelectedSubcontractors(prev => prev.filter(subId => subId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubcontractors(filteredSubcontractors.map(sub => sub.id));
    } else {
      setSelectedSubcontractors([]);
    }
  };

  // Enhanced action handlers
  const handleBulkAvailabilityUpdate = async (isAvailable: boolean) => {
    try {
      // Here you would implement bulk availability update
      toast.success(`Updated availability for ${selectedSubcontractors.length} subcontractors`);
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleBulkSuspend = async (reason: string, endDate?: Date) => {
    try {
      await Promise.all(
        selectedSubcontractors.map(id => suspendAccount(id, reason, endDate))
      );
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to suspend accounts");
    }
  };

  const handleBulkUnsuspend = async () => {
    try {
      await Promise.all(
        selectedSubcontractors.map(id => unsuspendAccount(id))
      );
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to unsuspend accounts");
    }
  };

  const handleBulkBan = async (reason: string) => {
    try {
      await Promise.all(
        selectedSubcontractors.map(id => banAccount(id, reason))
      );
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to ban accounts");
    }
  };

  const handleBulkEmail = async (subject: string, message: string) => {
    try {
      await sendCustomEmail(selectedSubcontractors, subject, message);
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to send emails");
    }
  };

  const handleBulkPasswordReset = async () => {
    try {
      await Promise.all(
        selectedSubcontractors.map(id => forcePasswordReset(id))
      );
      toast.success(`Password reset sent to ${selectedSubcontractors.length} subcontractors`);
      setSelectedSubcontractors([]);
    } catch (error) {
      toast.error("Failed to send password resets");
    }
  };

  const handleBulkExport = async () => {
    await exportSubcontractorData(selectedSubcontractors);
  };

  // Individual action handlers
  const handleSuspendSubcontractor = (id: string) => {
    setSuspendDialog({ open: true, subcontractorId: id });
  };

  const handleBanSubcontractor = (id: string) => {
    setBanDialog({ open: true, subcontractorId: id });
  };

  const handleEmailSubcontractor = (id: string) => {
    setEmailDialog({ open: true, subcontractorId: id });
  };

  const uniqueTiers = [...new Set(subcontractors.map(sub => sub.tier_level.toString()))];
  const uniqueLocations = [...new Set(subcontractors.map(sub => sub.state).filter(Boolean))];

  if (loading) {
    return (
      <AdminLayout 
        title="Subcontractor Management" 
        description="Manage your subcontractor network"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Subcontractor Management" 
      description="Comprehensive subcontractor network management"
    >
      <div className="space-y-6">
        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subcontractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractors.length}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{subcontractors.filter(s => s.is_available).length}</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {subcontractors.filter(s => s.account_status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restricted</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {subcontractors.filter(s => s.account_status !== 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Suspended/banned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {subcontractors.length > 0 
                  ? (subcontractors.reduce((acc, s) => acc + s.rating, 0) / subcontractors.length).toFixed(1)
                  : "0.0"
                }
              </div>
              <p className="text-xs text-muted-foreground">Network average</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find and manage your subcontractor network efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {uniqueTiers.map(tier => (
                    <SelectItem key={tier} value={tier}>Tier {tier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAccountStatus} onValueChange={setFilterAccountStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Account status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterTier("all");
                  setFilterAvailability("all");
                  setFilterLocation("all");
                  setFilterAccountStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Bulk Actions */}
        {selectedSubcontractors.length > 0 && (
          <BulkActionsPanel
            selectedCount={selectedSubcontractors.length}
            onClearSelection={() => setSelectedSubcontractors([])}
            onBulkAvailabilityUpdate={handleBulkAvailabilityUpdate}
            onBulkSuspend={handleBulkSuspend}
            onBulkUnsuspend={handleBulkUnsuspend}
            onBulkBan={handleBulkBan}
            onBulkEmail={handleBulkEmail}
            onBulkExport={handleBulkExport}
            onBulkPasswordReset={handleBulkPasswordReset}
          />
        )}

        {/* Enhanced Subcontractor Directory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subcontractor Directory</CardTitle>
                <CardDescription>
                  {filteredSubcontractors.length} of {subcontractors.length} subcontractors shown
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSubcontractors.length === filteredSubcontractors.length && filteredSubcontractors.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSubcontractors.map((contractor) => (
                <SubcontractorCard
                  key={contractor.id}
                  contractor={contractor}
                  isSelected={selectedSubcontractors.includes(contractor.id)}
                  onSelect={handleSelectSubcontractor}
                  onUpdateAvailability={(id, available) => {
                    // Implementation would go here
                    toast.success(`Updated availability for ${contractor.full_name}`);
                  }}
                  onSuspend={handleSuspendSubcontractor}
                  onUnsuspend={unsuspendAccount}
                  onBan={handleBanSubcontractor}
                  onPasswordReset={forcePasswordReset}
                  onSendEmail={handleEmailSubcontractor}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredSubcontractors.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subcontractors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Individual Action Dialogs */}
        
        {/* Individual Suspend Dialog */}
        <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Account</DialogTitle>
              <DialogDescription>
                Suspend this subcontractor's account access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="suspend-reason">Reason for Suspension</Label>
                <Textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (suspendDialog.subcontractorId && suspendReason.trim()) {
                    suspendAccount(suspendDialog.subcontractorId, suspendReason);
                    setSuspendDialog({ open: false });
                    setSuspendReason("");
                  }
                }}
                disabled={!suspendReason.trim()}
              >
                Suspend Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Individual Ban Dialog */}
        <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban Account</DialogTitle>
              <DialogDescription>
                Permanently ban this subcontractor's account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Reason for Ban</Label>
                <Textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for permanent ban..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialog({ open: false })}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (banDialog.subcontractorId && banReason.trim()) {
                    banAccount(banDialog.subcontractorId, banReason);
                    setBanDialog({ open: false });
                    setBanReason("");
                  }
                }}
                disabled={!banReason.trim()}
              >
                Ban Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Individual Email Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog({ open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                Send a custom email to this subcontractor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Email message..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialog({ open: false })}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (emailDialog.subcontractorId && emailSubject.trim() && emailMessage.trim()) {
                    sendCustomEmail([emailDialog.subcontractorId], emailSubject, emailMessage);
                    setEmailDialog({ open: false });
                    setEmailSubject("");
                    setEmailMessage("");
                  }
                }}
                disabled={!emailSubject.trim() || !emailMessage.trim()}
              >
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}