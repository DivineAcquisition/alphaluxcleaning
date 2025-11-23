import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface WaitlistLead {
  id: string;
  email: string;
  first_name: string | null;
  created_at: string;
}

const EMAIL_TEMPLATES = [
  {
    value: 'waitlist_welcome',
    label: 'Waitlist Welcome (DEEPCLEAN60 Offer)',
    description: 'Welcome email with $60 off deep clean promo'
  },
  {
    value: 'booking_confirmation',
    label: 'Booking Confirmation',
    description: 'Standard booking confirmation email'
  },
  {
    value: 'promo_applied',
    label: 'Promo Applied',
    description: 'Confirmation that promo code was applied'
  }
];

export const WaitlistEmailManager = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch waitlist leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ['waitlist-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist_leads')
        .select('id, email, first_name, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WaitlistLead[];
    }
  });

  // Send emails mutation
  const sendEmailsMutation = useMutation({
    mutationFn: async ({ emails, template }: { emails: string[], template: string }) => {
      const { data, error } = await supabase.functions.invoke('send-waitlist-emails', {
        body: {
          emails,
          template,
          preserveOffer: template === 'waitlist_welcome' // Preserve DEEPCLEAN60 offer
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Emails Queued!",
        description: `Successfully queued ${data.queued} emails. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
      });
      setSelectedLeads(new Set());
      queryClient.invalidateQueries({ queryKey: ['waitlist-leads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Emails",
        description: error.message || 'An error occurred',
        variant: "destructive"
      });
    }
  });

  const toggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAll = () => {
    if (selectedLeads.size === leads?.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads?.map(lead => lead.id) || []));
    }
  };

  const handleSendEmails = () => {
    if (selectedLeads.size === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select an email template",
        variant: "destructive"
      });
      return;
    }

    const selectedEmails = leads
      ?.filter(lead => selectedLeads.has(lead.id))
      .map(lead => lead.email) || [];

    sendEmailsMutation.mutate({
      emails: selectedEmails,
      template: selectedTemplate
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const selectedTemplateData = EMAIL_TEMPLATES.find(t => t.value === selectedTemplate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Waitlist Email Manager
            </CardTitle>
            <CardDescription>
              Send branded emails to waitlist leads with offer preservation
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {leads?.length || 0} total leads
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Template</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select email template" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_TEMPLATES.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{template.label}</span>
                    <span className="text-xs text-muted-foreground">{template.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateData && selectedTemplateData.value === 'waitlist_welcome' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Offer Preservation Enabled:</strong> Links will include <code className="bg-blue-100 px-1 py-0.5 rounded">?promo=DEEPCLEAN60&source=waitlist</code> to track the offer.
              </div>
            </div>
          )}
        </div>

        {/* Recipients Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Recipients ({selectedLeads.size} selected)</label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedLeads.size === leads?.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {leads && leads.length > 0 ? (
              <div className="divide-y">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleLead(lead.id)}
                  >
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLead(lead.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {lead.first_name || 'Unknown Name'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {lead.email}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No waitlist leads found</p>
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendEmails}
          disabled={selectedLeads.size === 0 || !selectedTemplate || sendEmailsMutation.isPending}
          className="w-full"
          size="lg"
        >
          {sendEmailsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send to {selectedLeads.size} {selectedLeads.size === 1 ? 'Recipient' : 'Recipients'}
            </>
          )}
        </Button>

        {/* Info Message */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          Emails will be queued and processed automatically. Check the Email Queue Monitor for status.
        </div>
      </CardContent>
    </Card>
  );
};
