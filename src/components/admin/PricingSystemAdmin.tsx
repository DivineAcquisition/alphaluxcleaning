import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from '@/lib/new-pricing-system';
import { Save, RefreshCw, DollarSign, Settings } from 'lucide-react';

interface PricingSystemAdminProps {
  onConfigUpdate?: (config: PricingConfig) => void;
}

export function PricingSystemAdmin({ onConfigUpdate }: PricingSystemAdminProps) {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        // Map database values to our config structure
        const loadedConfig: PricingConfig = {
          baseHourlyRate: data.base_hourly_rate || DEFAULT_PRICING_CONFIG.baseHourlyRate,
          cleanersPerTeam: data.cleaners_per_team || DEFAULT_PRICING_CONFIG.cleanersPerTeam,
          states: [
            { code: 'CA', name: 'California', multiplier: data.ca_multiplier || 1.5 },
            { code: 'TX', name: 'Texas', multiplier: data.tx_multiplier || 1.43 }
          ],
          serviceTypes: [
            { id: 'standard', name: 'Standard Cleaning', multiplier: 1.0 },
            { id: 'deep', name: 'Deep Cleaning', multiplier: data.deep_cleaning_multiplier || 1.4 },
            { id: 'move_in_out', name: 'Move-In/Out Cleaning', multiplier: data.move_in_out_multiplier || 1.5 }
          ],
          frequencies: [
            { id: 'one_time', name: 'One-time', discount: 0, mrrMultiplier: 0 },
            { id: 'weekly', name: 'Weekly', discount: data.weekly_discount || 0.15, mrrMultiplier: 4.3 },
            { id: 'bi_weekly', name: 'Bi-Weekly', discount: data.biweekly_discount || 0.10, mrrMultiplier: 2.15 },
            { id: 'monthly', name: 'Monthly', discount: data.monthly_discount || 0.05, mrrMultiplier: 1 }
          ]
        };
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading pricing config:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        base_hourly_rate: config.baseHourlyRate,
        cleaners_per_team: config.cleanersPerTeam,
        ca_multiplier: config.states.find(s => s.code === 'CA')?.multiplier || 1.5,
        tx_multiplier: config.states.find(s => s.code === 'TX')?.multiplier || 1.43,
        deep_cleaning_multiplier: config.serviceTypes.find(s => s.id === 'deep')?.multiplier || 1.4,
        move_in_out_multiplier: config.serviceTypes.find(s => s.id === 'move_in_out')?.multiplier || 1.5,
        weekly_discount: config.frequencies.find(f => f.id === 'weekly')?.discount || 0.15,
        biweekly_discount: config.frequencies.find(f => f.id === 'bi_weekly')?.discount || 0.10,
        monthly_discount: config.frequencies.find(f => f.id === 'monthly')?.discount || 0.05
      };

      const { error } = await supabase.rpc('save_pricing_config', {
        config_data: configData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing configuration updated successfully"
      });

      onConfigUpdate?.(config);
    } catch (error) {
      console.error('Error saving pricing config:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<PricingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateStateMultiplier = (stateCode: string, multiplier: number) => {
    setConfig(prev => ({
      ...prev,
      states: prev.states.map(state =>
        state.code === stateCode ? { ...state, multiplier } : state
      )
    }));
  };

  const updateServiceMultiplier = (serviceId: string, multiplier: number) => {
    setConfig(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.map(service =>
        service.id === serviceId ? { ...service, multiplier } : service
      )
    }));
  };

  const updateFrequencyDiscount = (frequencyId: string, discount: number) => {
    setConfig(prev => ({
      ...prev,
      frequencies: prev.frequencies.map(freq =>
        freq.id === frequencyId ? { ...freq, discount } : freq
      )
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pricing System Configuration</h2>
          <p className="text-muted-foreground">
            Configure base rates, multipliers, and discounts for the pricing system
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Base Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Base Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly-rate">Base Hourly Rate ($)</Label>
              <Input
                id="hourly-rate"
                type="number"
                value={config.baseHourlyRate}
                onChange={(e) => updateConfig({ baseHourlyRate: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaners-count">Cleaners per Team</Label>
              <Input
                id="cleaners-count"
                type="number"
                value={config.cleanersPerTeam}
                onChange={(e) => updateConfig({ cleanersPerTeam: Number(e.target.value) })}
                min="1"
                max="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            State Multipliers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.states.map((state) => (
            <div key={state.code} className="flex items-center justify-between">
              <Label className="font-medium">{state.name} ({state.code})</Label>
              <div className="w-32">
                <Input
                  type="number"
                  value={state.multiplier}
                  onChange={(e) => updateStateMultiplier(state.code, Number(e.target.value))}
                  min="0.1"
                  max="5"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Type Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle>Service Type Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.serviceTypes.filter(s => s.id !== 'standard').map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <Label className="font-medium">{service.name}</Label>
              <div className="w-32">
                <Input
                  type="number"
                  value={service.multiplier}
                  onChange={(e) => updateServiceMultiplier(service.id, Number(e.target.value))}
                  min="0.1"
                  max="5"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequency Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>Frequency Discounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.frequencies.filter(f => f.id !== 'one_time').map((frequency) => (
            <div key={frequency.id} className="flex items-center justify-between">
              <Label className="font-medium">{frequency.name}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={Math.round(frequency.discount * 100)}
                  onChange={(e) => updateFrequencyDiscount(frequency.id, Number(e.target.value) / 100)}
                  min="0"
                  max="50"
                  step="1"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}