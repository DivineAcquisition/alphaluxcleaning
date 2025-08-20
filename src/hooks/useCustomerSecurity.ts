import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  action_type: string;
  resource_type: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface SessionInfo {
  isValid: boolean;
  expiresAt: string | null;
  lastActivity: string;
  deviceInfo: string;
  location?: string;
}

export const useCustomerSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [suspiciousActivityDetected, setSuspiciousActivityDetected] = useState(false);

  // Log security event
  const logSecurityEvent = useCallback(async (
    actionType: string,
    resourceType: string,
    resourceId?: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    if (!user) return;

    try {
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();

      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_user_agent: userAgent,
        p_risk_level: riskLevel
      });

      // If high or critical risk, show toast
      if (riskLevel === 'high' || riskLevel === 'critical') {
        toast({
          title: "Security Alert",
          description: `Unusual activity detected: ${actionType}`,
          variant: "destructive"
        });
        setSuspiciousActivityDetected(true);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user, toast]);

  // Check for suspicious activity
  const checkSuspiciousActivity = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_suspicious_activity', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking suspicious activity:', error);
        return;
      }

      if (data && typeof data === 'object' && 'is_suspicious' in data) {
        const suspiciousData = data as { is_suspicious: boolean; risk_level?: string };
        if (suspiciousData.is_suspicious) {
          setSuspiciousActivityDetected(true);
          
          if (suspiciousData.risk_level === 'critical') {
            toast({
              title: "Critical Security Alert",
              description: "Unusual activity detected on your account. Please verify your recent actions.",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in checkSuspiciousActivity:', error);
    }
  }, [user, toast]);

  // Get recent security events
  const fetchSecurityEvents = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('id, action_type, resource_type, timestamp, ip_address, user_agent, risk_level')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching security events:', error);
        return;
      }

      const formattedData = (data || []).map(event => ({
        ...event,
        ip_address: event.ip_address ? String(event.ip_address) : undefined,
        risk_level: (event.risk_level as 'low' | 'medium' | 'high' | 'critical') || 'low'
      }));

      setSecurityEvents(formattedData);
    } catch (error) {
      console.error('Error in fetchSecurityEvents:', error);
    }
  }, [user]);

  // Validate session
  const validateSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (session.session) {
        const expiresAt = new Date(session.session.expires_at! * 1000).toISOString();
        const deviceInfo = navigator.userAgent;
        
        setSessionInfo({
          isValid: true,
          expiresAt,
          lastActivity: new Date().toISOString(),
          deviceInfo
        });

        // Log session validation
        await logSecurityEvent('session_validated', 'authentication', user.id, 'low');
      } else {
        setSessionInfo({
          isValid: false,
          expiresAt: null,
          lastActivity: new Date().toISOString(),
          deviceInfo: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Error validating session:', error);
    }
  }, [user, logSecurityEvent]);

  // Track payment-related security events
  const trackPaymentSecurityEvent = useCallback(async (
    eventType: 'payment_attempt' | 'payment_success' | 'payment_failure' | 'payment_method_added' | 'payment_method_removed',
    paymentMethodId?: string,
    amount?: number
  ) => {
    const riskLevel = eventType === 'payment_failure' ? 'medium' : 'low';
    await logSecurityEvent(eventType, 'payment', paymentMethodId, riskLevel);
    
    // Additional security for payment failures
    if (eventType === 'payment_failure') {
      await checkSuspiciousActivity();
    }
  }, [logSecurityEvent, checkSuspiciousActivity]);

  // Track data access events
  const trackDataAccess = useCallback(async (
    dataType: 'profile' | 'orders' | 'payments' | 'notifications'
  ) => {
    await logSecurityEvent('data_access', dataType, undefined, 'low');
  }, [logSecurityEvent]);

  // Initialize security monitoring
  useEffect(() => {
    if (user) {
      validateSession();
      fetchSecurityEvents();
      checkSuspiciousActivity();

      // Periodic session validation
      const sessionInterval = setInterval(validateSession, 5 * 60 * 1000); // Every 5 minutes
      
      // Periodic suspicious activity check
      const securityInterval = setInterval(checkSuspiciousActivity, 10 * 60 * 1000); // Every 10 minutes

      return () => {
        clearInterval(sessionInterval);
        clearInterval(securityInterval);
      };
    }
  }, [user, validateSession, fetchSecurityEvents, checkSuspiciousActivity]);

  // Clear security alerts
  const clearSecurityAlerts = useCallback(() => {
    setSuspiciousActivityDetected(false);
  }, []);

  return {
    securityEvents,
    sessionInfo,
    suspiciousActivityDetected,
    logSecurityEvent,
    trackPaymentSecurityEvent,
    trackDataAccess,
    checkSuspiciousActivity,
    validateSession,
    clearSecurityAlerts
  };
};