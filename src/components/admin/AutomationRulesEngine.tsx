import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit,
  Target,
  Zap,
  ChevronRight,
  Star
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AutomationRule {
  id: string;
  rule_name: string;
  description?: string;
  is_active: boolean;
  priority: number;
  conditions: any;
  actions: any;
  created_at: string;
}

export function AutomationRulesEngine() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    priority: 1,
    is_active: true,
    conditions: {
      tier_level_min: '',
      tier_level_max: '',
      rating_min: '',
      distance_max: '',
      availability_required: true
    },
    actions: {
      auto_assign: false,
      notification_priority: 'normal',
      escalation_minutes: 15,
      backup_assignment: false
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_assignment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules((data || []).map(rule => ({
        ...rule,
        conditions: rule.conditions || {},
        actions: rule.actions || {}
      })));
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Error",
        description: "Failed to load automation rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    try {
      const ruleData = {
        rule_name: formData.rule_name,
        description: formData.description,
        priority: formData.priority,
        is_active: formData.is_active,
        conditions: formData.conditions,
        actions: formData.actions,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (editingRule) {
        const { error } = await supabase
          .from('automation_assignment_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automation_assignment_rules')
          .insert(ruleData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Rule ${editingRule ? 'updated' : 'created'} successfully`,
      });

      fetchRules();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save rule",
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_assignment_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Rule ${isActive ? 'activated' : 'deactivated'}`,
      });

      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive"
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('automation_assignment_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      description: '',
      priority: 1,
      is_active: true,
      conditions: {
        tier_level_min: '',
        tier_level_max: '',
        rating_min: '',
        distance_max: '',
        availability_required: true
      },
      actions: {
        auto_assign: false,
        notification_priority: 'normal',
        escalation_minutes: 15,
        backup_assignment: false
      }
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      description: rule.description || '',
      priority: rule.priority,
      is_active: rule.is_active,
      conditions: {
        tier_level_min: rule.conditions?.tier_level_min || '',
        tier_level_max: rule.conditions?.tier_level_max || '',
        rating_min: rule.conditions?.rating_min || '',
        distance_max: rule.conditions?.distance_max || '',
        availability_required: rule.conditions?.availability_required || true
      },
      actions: {
        auto_assign: rule.actions?.auto_assign || false,
        notification_priority: rule.actions?.notification_priority || 'normal',
        escalation_minutes: rule.actions?.escalation_minutes || 15,
        backup_assignment: rule.actions?.backup_assignment || false
      }
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Rules Engine</h1>
          <p className="text-muted-foreground">
            Configure intelligent assignment rules and automated workflows
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Automation Rule' : 'Create New Rule'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    placeholder="e.g., Priority Assignment for Tier 3+ Subcontractors"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe when this rule should apply..."
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <h3 className="font-semibold">Assignment Conditions</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Tier Level</Label>
                    <Select
                      value={formData.conditions.tier_level_min}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, tier_level_min: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any tier</SelectItem>
                        <SelectItem value="1">Tier 1+</SelectItem>
                        <SelectItem value="2">Tier 2+</SelectItem>
                        <SelectItem value="3">Tier 3+</SelectItem>
                        <SelectItem value="4">Tier 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Minimum Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.conditions.rating_min}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, rating_min: e.target.value }
                      }))}
                      placeholder="e.g., 4.5"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <h3 className="font-semibold">Automation Actions</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto_assign">Auto-assign to first matching subcontractor</Label>
                    <Switch
                      id="auto_assign"
                      checked={formData.actions.auto_assign}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, auto_assign: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup_assignment">Create backup assignment if declined</Label>
                    <Switch
                      id="backup_assignment"
                      checked={formData.actions.backup_assignment}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, backup_assignment: checked }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Notification Priority</Label>
                    <Select
                      value={formData.actions.notification_priority}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, notification_priority: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Escalation Time (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.actions.escalation_minutes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions, escalation_minutes: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRule}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center p-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Automation Rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation rule to streamline job assignments
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                Create First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-2 py-1">
                      Priority {rule.priority}
                    </Badge>
                    <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {rule.description && (
                  <p className="text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conditions */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Conditions
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {rule.conditions.tier_level_min && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          Minimum Tier: {rule.conditions.tier_level_min}
                        </div>
                      )}
                      {rule.conditions.rating_min && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          Minimum Rating: {rule.conditions.rating_min}
                        </div>
                      )}
                      {!rule.conditions.tier_level_min && !rule.conditions.rating_min && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          No specific conditions
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Actions
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {rule.actions.auto_assign && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          Auto-assign jobs
                        </div>
                      )}
                      {rule.actions.backup_assignment && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          Create backup assignments
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        Priority: {rule.actions.notification_priority}
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        Escalate after: {rule.actions.escalation_minutes}m
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}