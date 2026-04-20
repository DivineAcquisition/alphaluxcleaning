import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  id?: string;
  customer_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  booking_confirmations: boolean;
  service_reminders: boolean;
  service_updates: boolean;
  payment_notifications: boolean;
  promotional_notifications: boolean;
  reminder_hours_before: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  phone_number?: string;
  preferred_language: string;
}

const NotificationPreferences: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    customer_id: '',
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    booking_confirmations: true,
    service_reminders: true,
    service_updates: true,
    payment_notifications: true,
    promotional_notifications: false,
    reminder_hours_before: 24,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: 'America/Los_Angeles',
    preferred_language: 'en',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_notification_preferences')
        .select('*')
        .eq('customer_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setPreferences({
          ...data,
          quiet_hours_start: data.quiet_hours_start?.slice(0, 5) || '22:00',
          quiet_hours_end: data.quiet_hours_end?.slice(0, 5) || '08:00',
        });
      } else {
        // Create default preferences
        setPreferences(prev => ({ ...prev, customer_id: user.id }));
      }

    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataToSave = {
        ...preferences,
        customer_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('customer_notification_preferences')
        .upsert(dataToSave, {
          onConflict: 'customer_id',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });

    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const timezones = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'UTC', label: 'UTC' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize how and when you receive notifications from AlphaLux Cleaning
        </p>
      </div>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <div>
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4" />
              <div>
                <Label htmlFor="sms-enabled">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
              </div>
            </div>
            <Switch
              id="sms-enabled"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
            />
          </div>

          {preferences.sms_enabled && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+1 (857) 754-4557"
                value={preferences.phone_number || ''}
                onChange={(e) => updatePreference('phone_number', e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4" />
              <div>
                <Label htmlFor="push-enabled">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
            </div>
            <Switch
              id="push-enabled"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="booking-confirmations">Booking Confirmations</Label>
              <p className="text-sm text-muted-foreground">Get notified when bookings are confirmed</p>
            </div>
            <Switch
              id="booking-confirmations"
              checked={preferences.booking_confirmations}
              onCheckedChange={(checked) => updatePreference('booking_confirmations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="service-reminders">Service Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded before your scheduled services</p>
            </div>
            <Switch
              id="service-reminders"
              checked={preferences.service_reminders}
              onCheckedChange={(checked) => updatePreference('service_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="service-updates">Service Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about changes to your services</p>
            </div>
            <Switch
              id="service-updates"
              checked={preferences.service_updates}
              onCheckedChange={(checked) => updatePreference('service_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="payment-notifications">Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about payment confirmations</p>
            </div>
            <Switch
              id="payment-notifications"
              checked={preferences.payment_notifications}
              onCheckedChange={(checked) => updatePreference('payment_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="promotional-notifications">Promotional Offers</Label>
              <p className="text-sm text-muted-foreground">Receive special offers and promotions</p>
            </div>
            <Switch
              id="promotional-notifications"
              checked={preferences.promotional_notifications}
              onCheckedChange={(checked) => updatePreference('promotional_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Preferences
          </CardTitle>
          <CardDescription>
            Customize when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reminder-hours">Service Reminder Time</Label>
              <Select
                value={preferences.reminder_hours_before.toString()}
                onValueChange={(value) => updatePreference('reminder_hours_before', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours before</SelectItem>
                  <SelectItem value="4">4 hours before</SelectItem>
                  <SelectItem value="12">12 hours before</SelectItem>
                  <SelectItem value="24">24 hours before</SelectItem>
                  <SelectItem value="48">48 hours before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => updatePreference('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Quiet Hours (No notifications during these times)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Choose your preferred language for notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences.preferred_language}
            onValueChange={(value) => updatePreference('preferred_language', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={savePreferences}
          disabled={saving}
          size="lg"
          className="w-full max-w-md"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;