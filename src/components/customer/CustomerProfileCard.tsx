import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  CreditCard,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerData } from '@/hooks/useCustomerData';
import { format } from 'date-fns';

export function CustomerProfileCard() {
  const { user } = useAuth();
  const { profile, stats, updateProfile } = useCustomerData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip_code: profile?.zip_code || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(editForm);
    if (success) {
      setIsEditing(false);
    }
  };

  const getMembershipBadge = () => {
    if (stats && stats.totalSpent > 500) {
      return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Premium Member</Badge>;
    } else if (stats && stats.totalSpent > 200) {
      return <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">Silver Member</Badge>;
    } else {
      return <Badge variant="secondary">Member</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Profile
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={editForm.zip_code}
                    onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                    placeholder="94105"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-foreground">
                {profile?.full_name || user?.email?.split('@')[0] || 'Valued Customer'}
              </h3>
              {getMembershipBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Contact Information</h4>
          <div className="space-y-2">
            {profile?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.phone}</span>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {profile.address}
                  {profile.city && `, ${profile.city}`}
                  {profile.state && `, ${profile.state}`}
                  {profile.zip_code && ` ${profile.zip_code}`}
                </span>
              </div>
            )}
            {(!profile?.phone && !profile?.address) && (
              <div className="text-sm text-muted-foreground">
                <p>Complete your profile to help us serve you better!</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Add contact information →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Account Stats */}
        {stats && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Account Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-primary">{stats.completedServices}</div>
                <div className="text-xs text-muted-foreground">Services</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-green-600">${stats.totalSpent.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Member since {format(new Date(stats.memberSince), 'MMM yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Account Settings</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/payment-portal">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Methods
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/membership">
                <Star className="h-4 w-4 mr-2" />
                Membership Benefits
              </a>
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Notification Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}