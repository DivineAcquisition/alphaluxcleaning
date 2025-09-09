import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield,
  Loader2,
  Smartphone,
  Monitor,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerPortalSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailBookingReminders: true,
    smsBookingReminders: false,
    emailPaymentReceipts: true,
    emailPromotions: false
  });

  const [sessions] = useState([
    {
      id: '1',
      device: 'iPhone 12 Pro',
      location: 'San Francisco, CA',
      lastActive: '2 minutes ago',
      current: true
    },
    {
      id: '2',
      device: 'MacBook Pro',
      location: 'San Francisco, CA', 
      lastActive: '1 hour ago',
      current: false
    }
  ]);

  useEffect(() => {
    const checkAuth = () => {
      const portalToken = localStorage.getItem('customer_portal_token');
      if (!portalToken) {
        navigate('/portal/login');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      // Mock profile data loading
      setTimeout(() => {
        setProfile({
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102'
        });
        setLoading(false);
      }, 1000);
    }
  }, [navigate]);

  const handleProfileSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };

  const handleSignOutOtherDevices = () => {
    toast({
      title: "Other Sessions Signed Out",
      description: "All other devices have been signed out successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/portal')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and service address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Service Address</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={profile.address}
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profile.city}
                          onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={profile.state}
                          onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={profile.zipCode}
                          onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleProfileSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive updates and reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Booking Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email reminders before your scheduled cleanings
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailBookingReminders}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailBookingReminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Booking Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive text message reminders on your phone
                      </p>
                    </div>
                    <Switch
                      checked={notifications.smsBookingReminders}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, smsBookingReminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Payment Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive payment confirmations and receipts via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailPaymentReceipts}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailPaymentReceipts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Promotional Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive special offers and service updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailPromotions}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailPromotions: checked }))
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationSave}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active login sessions across different devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {session.device.includes('iPhone') || session.device.includes('Android') ? 
                        <Smartphone className="w-5 h-5 text-muted-foreground" /> :
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                      }
                      <div>
                        <p className="font-medium">
                          {session.device}
                          {session.current && <span className="text-green-600 ml-2">(Current)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOutOtherDevices}
                  className="w-full"
                >
                  Sign Out All Other Devices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}