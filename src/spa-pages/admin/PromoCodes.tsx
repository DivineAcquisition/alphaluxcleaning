import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Upload, Copy, Ban } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  type: string;
  amount_cents: number;
  max_redemptions: number;
  redemptions: number;
  applies_to: string;
  expires_at: string | null;
  active: boolean;
  metadata: any;
  created_at: string;
}

export default function PromoCodes() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkCodes, setBulkCodes] = useState('');
  const queryClient = useQueryClient();

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PromoCode[];
    }
  });

  const createPromoMutation = useMutation({
    mutationFn: async (promo: any) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert([promo])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code created successfully');
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast.error('Failed to create promo code: ' + error.message);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (codes: string[]) => {
      const promos = codes.map(code => ({
        code: code.trim().toUpperCase(),
        type: 'FIXED',
        amount_cents: 3000,
        max_redemptions: 1,
        applies_to: 'ONE_TIME',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { campaign: 'BULK_IMPORT' }
      }));

      const { data, error } = await supabase
        .from('promo_codes')
        .insert(promos)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success(`${data.length} promo codes created successfully`);
      setShowBulkImport(false);
      setBulkCodes('');
    },
    onError: (error) => {
      toast.error('Failed to create promo codes: ' + error.message);
    }
  });

  const disablePromoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code disabled');
    }
  });

  const handleBulkImport = () => {
    const codes = bulkCodes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (codes.length === 0) {
      toast.error('Please enter at least one promo code');
      return;
    }

    bulkCreateMutation.mutate(codes);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const getStatusColor = (promo: PromoCode) => {
    if (!promo.active) return 'bg-gray-500';
    if (promo.redemptions >= promo.max_redemptions) return 'bg-red-500';
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = (promo: PromoCode) => {
    if (!promo.active) return 'Disabled';
    if (promo.redemptions >= promo.max_redemptions) return 'Fully Used';
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return 'Expired';
    return 'Active';
  };

  return (
    <AdminLayout
      title="Promo Codes"
      description="Create and manage promotional discount codes"
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Single Code
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Promo Code</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createPromoMutation.mutate({
                code: formData.get('code')?.toString().trim().toUpperCase(),
                type: 'FIXED',
                amount_cents: parseInt(formData.get('amount_cents')?.toString() || '3000'),
                max_redemptions: parseInt(formData.get('max_redemptions')?.toString() || '1'),
                applies_to: formData.get('applies_to') || 'ONE_TIME',
                expires_at: formData.get('expires_at') || null,
                metadata: {
                  notes: formData.get('notes')
                }
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="ALC-30-1X-XXXX"
                    required
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="amount_cents">Amount (cents) *</Label>
                  <Input
                    id="amount_cents"
                    name="amount_cents"
                    type="number"
                    defaultValue="3000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_redemptions">Max Uses *</Label>
                  <Input
                    id="max_redemptions"
                    name="max_redemptions"
                    type="number"
                    defaultValue="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expires At</Label>
                  <Input
                    id="expires_at"
                    name="expires_at"
                    type="datetime-local"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Internal notes about this code"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createPromoMutation.isPending}>
                  {createPromoMutation.isPending ? 'Creating...' : 'Create Code'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Bulk Import */}
        {showBulkImport && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Import Codes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter one code per line. All codes will be created with $30 off, single-use, expires in 30 days.
            </p>
            <Textarea
              value={bulkCodes}
              onChange={(e) => setBulkCodes(e.target.value)}
              placeholder="ALC-30-1X-XXXX&#10;ALC-30-1X-YYYY&#10;ALC-30-1X-ZZZZ"
              className="font-mono mb-4"
              rows={10}
            />
            <div className="flex gap-2">
              <Button onClick={handleBulkImport} disabled={bulkCreateMutation.isPending}>
                {bulkCreateMutation.isPending ? 'Importing...' : 'Import Codes'}
              </Button>
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Codes List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Existing Codes</h3>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : promoCodes && promoCodes.length > 0 ? (
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(promo)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold">{promo.code}</code>
                        <Badge variant="secondary">
                          ${(promo.amount_cents / 100).toFixed(2)} off
                        </Badge>
                        <Badge variant="outline">
                          {promo.redemptions}/{promo.max_redemptions} used
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {promo.expires_at && (
                          <span>Expires: {format(new Date(promo.expires_at), 'MMM d, yyyy')}</span>
                        )}
                        {promo.metadata?.notes && (
                          <span className="ml-3">• {promo.metadata.notes}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(promo)}>
                      {getStatusText(promo)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(promo.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {promo.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disablePromoMutation.mutate(promo.id)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No promo codes yet</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
