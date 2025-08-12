import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  action_type: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityAudit = () => {
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_action_type: event.action_type,
        p_resource_type: event.resource_type,
        p_resource_id: event.resource_id || null,
        p_old_values: event.old_values || null,
        p_new_values: event.new_values || null,
        p_risk_level: event.risk_level || 'low'
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const logFailedLogin = async (email: string, reason: string) => {
    try {
      await supabase
        .from('failed_login_attempts')
        .insert({
          email,
          ip_address: '0.0.0.0', // Would be populated by edge function in production
          failure_reason: reason
        });
    } catch (error) {
      console.error('Failed to log failed login:', error);
    }
  };

  const checkSuspiciousActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase.rpc('check_suspicious_activity', {
        p_user_id: user.id
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
      return null;
    }
  };

  return {
    logSecurityEvent,
    logFailedLogin,
    checkSuspiciousActivity
  };
};