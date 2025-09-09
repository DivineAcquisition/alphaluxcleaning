import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailSettings {
  id?: string;
  company_id: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  brand: {
    logo_url?: string;
    color_hex: string;
  };
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  react_component_key: string;
}

export interface EmailEvent {
  id: string;
  template_key: string;
  to_email: string;
  status: string;
  created_at: string;
  message_id?: string;
}

export const useEmailSettings = (companyId: string) => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email settings:', error);
        return;
      }

      setSettings(data ? {
        ...data,
        brand: (typeof data.brand === 'object' && data.brand !== null) 
          ? data.brand as { logo_url?: string; color_hex: string }
          : { logo_url: '', color_hex: '#A58FFF' }
      } : null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('template_key');

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: EmailSettings) => {
    try {
      const { error } = await supabase
        .from('email_settings')
        .upsert(newSettings);

      if (error) {
        console.error('Error saving settings:', error);
        toast.error("Failed to save email settings");
        return false;
      }

      setSettings(newSettings);
      toast.success("Email settings saved successfully!");
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to save email settings");
      return false;
    }
  };

  useEffect(() => {
    if (companyId) {
      Promise.all([
        loadSettings(),
        loadTemplates(),
        loadEvents()
      ]);
    }
  }, [companyId]);

  return {
    settings,
    templates,
    events,
    loading,
    saveSettings,
    refreshEvents: loadEvents,
    refreshTemplates: loadTemplates
  };
};