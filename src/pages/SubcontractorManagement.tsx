import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, UserCheck, UserX, Star, Phone, Mail, Search, Filter, MoreVertical, MessageSquare, Settings, Trash2, Send } from "lucide-react";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SubcontractorManagement() {
  const { teamMembers: subcontractors, loading, updateMemberAvailability, removeMember } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [filterTier, setFilterTier] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [bulkMessage, setBulkMessage] = useState("");
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const navigate = useNavigate();

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm);
    
    const matchesTier = filterTier === "all" || sub.split_tier === filterTier;
    const matchesAvailability = filterAvailability === "all" || 
      (filterAvailability === "available" && sub.is_available) ||
      (filterAvailability === "unavailable" && !sub.is_available);
    const matchesLocation = filterLocation === "all" || sub.state === filterLocation;

    return matchesSearch && matchesTier && matchesAvailability && matchesLocation;
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

  const handleBulkAvailabilityUpdate = async (isAvailable: boolean) => {
    try {
      await Promise.all(
        selectedSubcontractors.map(id => updateMemberAvailability(id, isAvailable))
      );
      setSelectedSubcontractors([]);
      toast.success(`Updated availability for ${selectedSubcontractors.length} subcontractors`);
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleBulkMessage = async () => {
    if (!bulkMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    // Here you would implement the actual messaging functionality
    toast.success(`Message sent to ${selectedSubcontractors.length} subcontractors`);
    setBulkMessage("");
    setShowBulkMessage(false);
    setSelectedSubcontractors([]);
  };

  const handleRemoveSubcontractor = async (id: string) => {
    try {
      await removeMember(id);
      toast.success("Subcontractor removed successfully");
    } catch (error) {
      toast.error("Failed to remove subcontractor");
    }
  };

  const uniqueTiers = [...new Set(subcontractors.map(sub => sub.split_tier).filter(Boolean))];
  const uniqueLocations = [...new Set(subcontractors.map(sub => sub.state).filter(Boolean))];
  const avgRating = subcontractors.length > 0 
    ? (subcontractors.reduce((acc, s) => acc + s.rating, 0) / subcontractors.length).toFixed(1)
    : "0.0";

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
        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Unavailable</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{subcontractors.filter(s => !s.is_available).length}</div>
              <p className="text-xs text-muted-foreground">Currently unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{avgRating}</div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                    <SelectItem key={tier} value={tier}>{tier}</SelectItem>
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
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedSubcontractors.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedSubcontractors.length} selected</Badge>
                  <span className="text-sm text-muted-foreground">subcontractors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAvailabilityUpdate(true)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAvailabilityUpdate(false)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Mark Unavailable
                  </Button>
                  <Dialog open={showBulkMessage} onOpenChange={setShowBulkMessage}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Bulk Message</DialogTitle>
                        <DialogDescription>
                          Send a message to {selectedSubcontractors.length} selected subcontractors
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Type your message here..."
                            value={bulkMessage}
                            onChange={(e) => setBulkMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkMessage(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBulkMessage}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSubcontractors([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <div key={contractor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedSubcontractors.includes(contractor.id)}
                      onCheckedChange={(checked) => handleSelectSubcontractor(contractor.id, checked as boolean)}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{contractor.full_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {contractor.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {contractor.phone}
                      </p>
                      {contractor.city && contractor.state && (
                        <p className="text-xs text-muted-foreground">
                          {contractor.city}, {contractor.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{contractor.rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contractor.jobsCompleted} jobs completed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contractor.split_tier || 'Standard'} tier
                      </p>
                    </div>
                    <Badge variant={contractor.is_available ? "default" : "secondary"}>
                      {contractor.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/subcontractor-detail/${contractor.id}`)}
                      >
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateMemberAvailability(contractor.id, !contractor.is_available)}
                          >
                            {contractor.is_available ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Mark Unavailable
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Mark Available
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/subcontractor-detail/${contractor.id}`)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Subcontractor
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Subcontractor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {contractor.full_name} from your network? 
                                  This action cannot be undone and will affect their access to the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveSubcontractor(contractor.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSubcontractors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No subcontractors found</p>
                  <p className="text-sm">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}