import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Phone,
  Mail,
  Bell,
  Shield,
  HelpCircle,
  Upload,
  Save,
  Camera
} from 'lucide-react';

export default function SubcontractorSettings() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    full_name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    avatar_url: ''
  });

  const [notifications, setNotifications] = useState({
    new_assignments: true,
    day_reminders: true,
    payout_updates: true,
    customer_messages: true,
    promotional: false
  });

  const [loading, setLoading] = useState(false);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Here you would typically save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      // Here you would typically save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, notifications, and account preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Professional Cleaner • Tier 2
              </p>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
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
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">New Job Assignments</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when you receive new job assignments
                </div>
              </div>
              <Switch
                checked={notifications.new_assignments}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, new_assignments: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Day-of Reminders</div>
                <div className="text-sm text-muted-foreground">
                  Receive reminders about upcoming jobs on the day of service
                </div>
              </div>
              <Switch
                checked={notifications.day_reminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, day_reminders: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Payout Updates</div>
                <div className="text-sm text-muted-foreground">
                  Get notified about payout processing and completions
                </div>
              </div>
              <Switch
                checked={notifications.payout_updates}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, payout_updates: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Customer Messages</div>
                <div className="text-sm text-muted-foreground">
                  Receive notifications for customer messages and feedback
                </div>
              </div>
              <Switch
                checked={notifications.customer_messages}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, customer_messages: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Promotional Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates about new features, tips, and company news
                </div>
              </div>
              <Switch
                checked={notifications.promotional}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, promotional: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNotificationSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="font-medium mb-1">Change Password</div>
              <div className="text-sm text-muted-foreground">
                Update your account password
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="font-medium mb-1">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Add extra security to your account
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="font-medium mb-1">Privacy Settings</div>
              <div className="text-sm text-muted-foreground">
                Manage your data and privacy preferences
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="font-medium mb-1">Download My Data</div>
              <div className="text-sm text-muted-foreground">
                Export your personal data and history
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-left">
                <div className="font-medium">Contact Support</div>
                <div className="text-sm text-muted-foreground">
                  support@bayareacleaningpros.com
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-left">
                <div className="font-medium">Call Support</div>
                <div className="text-sm text-muted-foreground">
                  (555) 123-HELP (4357)
                </div>
              </div>
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="text-center text-sm text-muted-foreground">
            <p>Version 2.1.0 • Last updated: December 2024</p>
            <p className="mt-1">
              Need immediate help? Call our 24/7 support line or email us anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}