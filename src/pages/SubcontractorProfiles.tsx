import { useState, useEffect } from "react";
import { SubcontractorManagementLayout } from "@/components/admin/SubcontractorManagementLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCog, 
  Users, 
  Edit, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Shield,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";

interface SubcontractorProfile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  tier_level: number;
  hourly_rate: number;
  monthly_fee: number;
  account_status: string;
  is_available: boolean;
  rating: number;
  created_at: string;
  subscription_status?: string;
}

export default function SubcontractorProfiles() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<SubcontractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingProfile, setEditingProfile] = useState<SubcontractorProfile | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    hourly_rate: 0,
    monthly_fee: 0,
    is_available: true,
    account_status: 'active'
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(subcontractors || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load subcontractor profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (profileId: string, updates: Partial<SubcontractorProfile>) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Subcontractor profile updated successfully",
      });

      fetchProfiles();
      setEditingProfile(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update subcontractor profile",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ account_status: newStatus })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Account status updated to ${newStatus}`,
      });

      fetchProfiles();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update account status",
        variant: "destructive",
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || profile.account_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalProfiles = profiles.length;
  const activeProfiles = profiles.filter(p => p.account_status === 'active').length;
  const suspendedProfiles = profiles.filter(p => p.account_status === 'suspended').length;
  const avgRating = profiles.reduce((sum, p) => sum + (p.rating || 0), 0) / profiles.length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Banned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SubcontractorManagementLayout 
      title="Profile Settings" 
      description="Manage subcontractor profiles and account settings"
    >
      <div className="space-y-6">
        {/* Profile Overview */}
        <AdminSection title="Profile Overview" description="Subcontractor profile statistics">
          <AdminGrid columns={4} gap="md">
            <AdminCard variant="metric" title="Total Profiles" icon={<Users className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{totalProfiles}</div>
              <p className="text-xs text-muted-foreground">All subcontractors</p>
            </AdminCard>

            <AdminCard variant="metric" title="Active" icon={<CheckCircle className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-green-600">{activeProfiles}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </AdminCard>

            <AdminCard variant="metric" title="Suspended" icon={<XCircle className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-yellow-600">{suspendedProfiles}</div>
              <p className="text-xs text-muted-foreground">Suspended accounts</p>
            </AdminCard>

            <AdminCard variant="metric" title="Avg Rating" icon={<Star className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-blue-600">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall rating</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Profile Management */}
        <AdminSection title="Profile Management" description="View and edit subcontractor profiles">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchProfiles}>
                Refresh Profiles
              </Button>
            </div>

            {/* Profile Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Subcontractor Profiles ({filteredProfiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <UserCog className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading profiles...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcontractor</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{profile.full_name}</p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {profile.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-sm">{profile.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="text-sm">{profile.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="text-sm">{profile.city}, {profile.state}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Tier {profile.tier_level}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-success">${profile.hourly_rate}/hr</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(profile.account_status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={profile.is_available ? "secondary" : "outline"}>
                              {profile.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{profile.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingProfile(profile);
                                      setProfileData({
                                        full_name: profile.full_name,
                                        email: profile.email,
                                        phone: profile.phone || '',
                                        address: profile.address,
                                        city: profile.city,
                                        state: profile.state,
                                        zip_code: profile.zip_code,
                                        hourly_rate: profile.hourly_rate,
                                        monthly_fee: profile.monthly_fee,
                                        is_available: profile.is_available,
                                        account_status: profile.account_status
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Profile: {profile.full_name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                          id="full_name"
                                          value={profileData.full_name}
                                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                          id="email"
                                          type="email"
                                          value={profileData.email}
                                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                          id="phone"
                                          value={profileData.phone}
                                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="account_status">Account Status</Label>
                                        <Select 
                                          value={profileData.account_status} 
                                          onValueChange={(value) => setProfileData({...profileData, account_status: value})}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="banned">Banned</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="address">Address</Label>
                                      <Input
                                        id="address"
                                        value={profileData.address}
                                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                      />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                          id="city"
                                          value={profileData.city}
                                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                          id="state"  
                                          value={profileData.state}
                                          onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="zip_code">Zip Code</Label>
                                        <Input
                                          id="zip_code"
                                          value={profileData.zip_code}
                                          onChange={(e) => setProfileData({...profileData, zip_code: e.target.value})}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                                        <Input
                                          id="hourly_rate"
                                          type="number"
                                          step="0.01"
                                          value={profileData.hourly_rate}
                                          onChange={(e) => setProfileData({...profileData, hourly_rate: parseFloat(e.target.value)})}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                                        <Input
                                          id="monthly_fee"
                                          type="number"
                                          step="0.01"
                                          value={profileData.monthly_fee}
                                          onChange={(e) => setProfileData({...profileData, monthly_fee: parseFloat(e.target.value)})}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="is_available"
                                        checked={profileData.is_available}
                                        onCheckedChange={(checked) => setProfileData({...profileData, is_available: checked})}
                                      />
                                      <Label htmlFor="is_available">Available for work</Label>
                                    </div>

                                    <Button 
                                      onClick={() => editingProfile && handleProfileUpdate(editingProfile.id, profileData)}
                                      className="w-full"
                                    >
                                      Update Profile
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Select 
                                value={profile.account_status} 
                                onValueChange={(value) => handleStatusChange(profile.id, value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="suspended">Suspend</SelectItem>
                                  <SelectItem value="banned">Ban</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminSection>
      </div>
    </SubcontractorManagementLayout>
  );
}