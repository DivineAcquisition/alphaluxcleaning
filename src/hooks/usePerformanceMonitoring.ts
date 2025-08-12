import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceMetrics {
  loadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

interface UsePerformanceOptions {
  enabled?: boolean;
  sessionId?: string;
}

export const usePerformanceMonitoring = (options: UsePerformanceOptions = {}) => {
  const { enabled = true, sessionId } = options;
  const { user } = useAuth();

  const logPerformanceMetric = useCallback(async (metrics: PerformanceMetrics) => {
    if (!enabled) return;

    try {
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent;
      const connection = (navigator as any).connection;
      
      // Detect device type
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';
      
      // Get connection type if available
      const connectionType = connection?.effectiveType || 'unknown';

      await supabase.rpc('log_performance_metric', {
        p_user_id: user?.id || null,
        p_session_id: sessionId || null,
        p_page_url: currentUrl,
        p_load_time_ms: metrics.loadTime || null,
        p_fcp_ms: metrics.firstContentfulPaint || null,
        p_lcp_ms: metrics.largestContentfulPaint || null,
        p_cls: metrics.cumulativeLayoutShift || null,
        p_fid_ms: metrics.firstInputDelay || null,
        p_user_agent: userAgent,
        p_device_type: deviceType,
        p_connection_type: connectionType
      });
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  }, [enabled, user?.id, sessionId]);

  const trackPageLoad = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Use Performance API to get Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          logPerformanceMetric({
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
          });
        }
        
        if (entry.entryType === 'paint') {
          if (entry.name === 'first-contentful-paint') {
            logPerformanceMetric({
              firstContentfulPaint: entry.startTime,
            });
          }
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          logPerformanceMetric({
            largestContentfulPaint: entry.startTime,
          });
        }
        
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            logPerformanceMetric({
              cumulativeLayoutShift: layoutShiftEntry.value,
            });
          }
        }
        
        if (entry.entryType === 'first-input') {
          const firstInputEntry = entry as PerformanceEventTiming;
          logPerformanceMetric({
            firstInputDelay: firstInputEntry.processingStart - firstInputEntry.startTime,
          });
        }
      }
    });

    // Observe different types of performance entries
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }

    return () => observer.disconnect();
  }, [enabled, logPerformanceMetric]);

  const trackInteraction = useCallback(async (
    interactionType: string,
    elementId?: string,
    elementType?: string,
    duration?: number,
    success = true,
    errorMessage?: string,
    metadata = {}
  ) => {
    if (!enabled) return;

    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId || 'anonymous',
          interaction_type: interactionType,
          element_id: elementId,
          element_type: elementType,
          page_url: window.location.href,
          duration_ms: duration,
          success,
          error_message: errorMessage,
          metadata
        });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [enabled, user?.id, sessionId]);

  const trackFeatureUsage = useCallback(async (
    featureName: string,
    timeSpent = 0,
    userRole?: string
  ) => {
    if (!enabled || !user?.id) return;

    try {
      const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
      
      await supabase.rpc('track_feature_usage', {
        p_user_id: user.id,
        p_feature_name: featureName,
        p_time_spent_ms: timeSpent,
        p_user_role: userRole,
        p_device_type: deviceType
      });
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) {
      const cleanup = trackPageLoad();
      return cleanup;
    }
  }, [enabled, trackPageLoad]);

  return {
    logPerformanceMetric,
    trackInteraction,
    trackFeatureUsage,
    trackPageLoad
  };
};