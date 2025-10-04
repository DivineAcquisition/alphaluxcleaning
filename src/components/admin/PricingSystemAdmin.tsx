import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { Save, RefreshCw, DollarSign, Home, Sparkles } from 'lucide-react';

export function PricingSystemAdmin() {
  const [discount, setDiscount] = useState(DEFAULT_PRICING_CONFIG.universalDiscount * 100);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Save the universal discount to database
      const configData = {
        universal_discount: discount / 100
      };

      const { error } = await supabase.rpc('save_pricing_config', {
        config_data: configData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing configuration updated successfully"
      });
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
          <h2 className="text-2xl font-bold text-foreground">Universal Hybrid Pricing Model</h2>
          <p className="text-muted-foreground">
            AlphaLuxClean fixed pricing with automatic 15% discount
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Universal Discount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Universal Discount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Automatic Discount (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                max="50"
                step="1"
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                Applied to all services
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Base Pricing by Square Footage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Square Footage</th>
                  <th className="text-right p-3 font-semibold">Regular Clean</th>
                  <th className="text-right p-3 font-semibold">Deep Clean</th>
                  <th className="text-right p-3 font-semibold">Move-In/Out</th>
                </tr>
              </thead>
              <tbody>
                {HOME_SIZE_RANGES.map((range) => (
                  <tr key={range.id} className="border-b">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{range.label}</div>
                        <div className="text-xs text-muted-foreground">{range.bedroomRange}</div>
                      </div>
                    </td>
                    <td className="text-right p-3">
                      {range.requiresEstimate ? (
                        <span className="text-xs text-muted-foreground">Custom Quote</span>
                      ) : (
                        <span className="font-medium">${range.regularPrice}</span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      {range.requiresEstimate ? (
                        <span className="text-xs text-muted-foreground">Custom Quote</span>
                      ) : (
                        <span className="font-medium">${range.deepPrice}</span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      {range.requiresEstimate ? (
                        <span className="text-xs text-muted-foreground">Custom Quote</span>
                      ) : (
                        <span className="font-medium">${range.moveInOutPrice}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recurring Pricing Formula (Regular Clean Only)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="font-medium">Weekly</div>
                <div className="text-sm text-muted-foreground">
                  Base × 0.40 × 4 cleans/month
                </div>
                <div className="text-xs text-green-600">
                  Example: $255 → $408/month
                </div>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <div className="font-medium">Bi-Weekly</div>
                <div className="text-sm text-muted-foreground">
                  Base × 0.55 × 2 cleans/month
                </div>
                <div className="text-xs text-green-600">
                  Example: $255 → $281/month
                </div>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <div className="font-medium">Monthly</div>
                <div className="text-sm text-muted-foreground">
                  Base × 0.75 × 1 clean/month
                </div>
                <div className="text-xs text-green-600">
                  Example: $255 → $191/month
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported States */}
      <Card>
        <CardHeader>
          <CardTitle>Supported States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PRICING_CONFIG.states.map((state) => (
              <div key={state.code} className="p-4 border rounded-lg">
                <div className="font-medium">{state.name}</div>
                <div className="text-sm text-muted-foreground">Code: {state.code}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
