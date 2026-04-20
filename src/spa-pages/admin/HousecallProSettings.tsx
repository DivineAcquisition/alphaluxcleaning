import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Eye, EyeOff, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getHCPConfig, updateHCPConfig, redactApiKey, type HCPConfig } from '@/lib/hcp';

export default function HousecallProSettings() {
  const [config, setConfig] = useState<HCPConfig>({
    api_key: '',
    base_url: 'https://api.housecallpro.com/v1',
    enabled: true,
    test_mode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const hcpConfig = await getHCPConfig();
      if (hcpConfig) {
        setConfig(hcpConfig);
      }
    } catch (error) {
      console.error('Failed to load HCP config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Housecall Pro configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateHCPConfig(config);
      toast({
        title: 'Success',
        description: 'Housecall Pro configuration saved successfully'
      });
    } catch (error) {
      console.error('Failed to save HCP config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      // Test the connection by making an API call
      const response = await fetch('/api/hcp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Connection to Housecall Pro API successful'
        });
      } else {
        throw new Error('API test failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to Housecall Pro API',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Housecall Pro Settings" description="Configure Housecall Pro integration">
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Housecall Pro Integration" 
      description="Configure automatic customer and job creation in Housecall Pro"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your Housecall Pro API credentials and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="Enter your Housecall Pro API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {config.api_key && (
                <p className="text-sm text-muted-foreground">
                  Current key: {redactApiKey(config.api_key)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={config.base_url}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                placeholder="https://api.housecallpro.com/v1"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Integration</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, new bookings will automatically sync to Housecall Pro
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, API calls are logged but not sent to Housecall Pro
                </p>
              </div>
              <Switch
                checked={config.test_mode}
                onCheckedChange={(test_mode) => setConfig({ ...config, test_mode })}
              />
            </div>

            {config.test_mode && (
              <Alert>
                <TestTube className="h-4 w-4" />
                <AlertDescription>
                  Test mode is enabled. API calls will be logged but not sent to Housecall Pro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>
              Test your API connection to ensure proper configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTest} 
              disabled={!config.api_key || testing}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Testing Connection...' : 'Test API Connection'}
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={loadConfig} disabled={loading}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving || !config.api_key}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Note:</strong> Your API key is encrypted and stored securely. 
            It will never be displayed in logs or error messages.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}