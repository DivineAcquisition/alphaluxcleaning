import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, UserX, Loader2, Shield, Eye, Settings } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AdminUser {
  user_id: string;
  email: string;
  role: 'admin' | 'ops' | 'viewer';
  status: 'active' | 'disabled';
  created_at: string;
}

interface AllowlistEntry {
  id: number;
  email?: string;
  domain?: string;
}

const roleColors = {
  admin: 'destructive',
  ops: 'secondary',
  viewer: 'default'
} as const;

const statusColors = {
  active: 'default',
  disabled: 'outline'
} as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    type: 'email' as 'email' | 'domain'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load admin users
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-auth-guard', {
        body: { action: 'list_users' }
      });

      if (usersError) throw usersError;

      // Load allowlist
      const { data: allowlistData, error: allowlistError } = await supabase.functions.invoke('admin-auth-guard', {
        body: { action: 'list_allowlist' }
      });

      if (allowlistError) throw allowlistError;

      setUsers(usersData?.users || []);
      setAllowlist(allowlistData?.allowlist || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      if (!inviteData.email) {
        toast.error('Please enter an email or domain');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-auth-guard', {
        body: { 
          action: 'add_to_allowlist',
          email: inviteData.type === 'email' ? inviteData.email : undefined,
          domain: inviteData.type === 'domain' ? inviteData.email : undefined
        }
      });

      if (error) throw error;

      toast.success(`${inviteData.type === 'email' ? 'Email' : 'Domain'} added to allowlist`);
      setInviteDialogOpen(false);
      setInviteData({ email: '', type: 'email' });
      loadData();
    } catch (error: any) {
      console.error('Failed to add to allowlist:', error);
      toast.error(error.message || 'Failed to add to allowlist');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-auth-guard', {
        body: { 
          action: 'update_user_role',
          user_id: userId,
          role: newRole
        }
      });

      if (error) throw error;

      toast.success('User role updated successfully');
      loadData();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-auth-guard', {
        body: { 
          action: 'update_user_status',
          user_id: userId,
          status: newStatus
        }
      });

      if (error) throw error;

      toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
      loadData();
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      toast.error(error.message || 'Failed to update user status');
    }
  };

  return (
    <AdminRoute requiredRole="admin">
      <Helmet>
        <title>Admin Users - Admin</title>
      </Helmet>
      
      <AdminLayout title="Admin Users">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Users</h1>
              <p className="text-muted-foreground">
                Manage admin access and permissions
              </p>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Allowlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Admin Allowlist</DialogTitle>
                  <DialogDescription>
                    Allow specific emails or entire domains to access admin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={inviteData.type} onValueChange={(value: 'email' | 'domain') => 
                    setInviteData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Specific Email</SelectItem>
                      <SelectItem value="domain">Entire Domain</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={inviteData.type === 'email' ? 'user@alphaluxclean.com' : 'alphaluxclean.com'}
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite}>
                    Add to Allowlist
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Ops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'ops').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Viewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'viewer').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage user roles and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleColors[user.role]}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[user.status]}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select value={user.role} onValueChange={(value) => handleRoleChange(user.user_id, value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="ops">Ops</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant={user.status === 'active' ? 'destructive' : 'default'}
                              size="sm"
                              onClick={() => handleStatusChange(user.user_id, user.status === 'active' ? 'disabled' : 'active')}
                            >
                              {user.status === 'active' ? <UserX className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowlist</CardTitle>
              <CardDescription>
                Emails and domains authorized for admin access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowlist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.email ? 'Email' : 'Domain'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {entry.email || entry.domain}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}