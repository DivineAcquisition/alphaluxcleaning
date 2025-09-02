/**
 * Hook for secure one-time actions using HMAC tokens
 */

import { useState, useCallback } from 'react';
import { generateHMACToken, verifyHMACToken, HMACTokenData, logSecurityEvent } from '@/utils/security';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecureActionOptions {
  action: HMACTokenData['action'];
  resourceId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useSecureActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Generate a secure action token
   */
  const generateActionToken = useCallback(async (
    action: HMACTokenData['action'],
    resourceId: string
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Authentication required');
      return null;
    }

    try {
      const token = await generateHMACToken({
        action,
        userId: user.id,
        resourceId
      });

      // Log token generation
      await logSecurityEvent({
        event: 'hmac_token_generated',
        userId: user.id,
        details: {
          action,
          resourceId,
          tokenLength: token.length
        }
      });

      return token;
    } catch (error) {
      console.error('Failed to generate action token:', error);
      return null;
    }
  }, [user]);

  /**
   * Execute a secure action with token verification
   */
  const executeSecureAction = useCallback(async (
    token: string,
    actionHandler: (data: HMACTokenData) => Promise<any>,
    options: Partial<SecureActionOptions> = {}
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Verify the token
      const verification = await verifyHMACToken(token);
      
      if (!verification.valid || !verification.data) {
        const error = verification.error || 'Invalid token';
        toast.error(error);
        options.onError?.(error);
        
        // Log verification failure
        await logSecurityEvent({
          event: 'hmac_token_verified',
          userId: user?.id,
          details: {
            success: false,
            error,
            tokenPresent: !!token
          }
        });
        
        return false;
      }

      // Check if user matches token
      if (verification.data.userId !== user?.id) {
        const error = 'Token user mismatch';
        toast.error('Unauthorized action');
        options.onError?.(error);
        
        await logSecurityEvent({
          event: 'unauthorized_access',
          userId: user?.id,
          details: {
            tokenUserId: verification.data.userId,
            actualUserId: user?.id,
            action: verification.data.action
          }
        });
        
        return false;
      }

      // Execute the action
      const result = await actionHandler(verification.data);
      
      // Log successful execution
      await logSecurityEvent({
        event: 'hmac_token_verified',
        userId: user?.id,
        details: {
          success: true,
          action: verification.data.action,
          resourceId: verification.data.resourceId
        }
      });

      options.onSuccess?.(result);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      
      await logSecurityEvent({
        event: 'hmac_token_verified',
        userId: user?.id,
        details: {
          success: false,
          error: errorMessage,
          action: options.action
        }
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Create secure action URLs for email/SMS links
   */
  const createSecureActionUrl = useCallback(async (
    baseUrl: string,
    action: HMACTokenData['action'],
    resourceId: string
  ): Promise<string | null> => {
    if (!user) return null;

    const token = await generateActionToken(action, resourceId);
    if (!token) return null;

    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('action', action);
    url.searchParams.set('resource', resourceId);

    return url.toString();
  }, [user, generateActionToken]);

  return {
    generateActionToken,
    executeSecureAction,
    createSecureActionUrl,
    loading
  };
}

/**
 * Hook for handling secure action URLs (for pages that receive tokens)
 */
export function useSecureActionHandler() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [actionData, setActionData] = useState<HMACTokenData | null>(null);

  /**
   * Process a token from URL parameters
   */
  const processTokenFromUrl = useCallback(async (): Promise<HMACTokenData | null> => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) return null;

    setProcessing(true);
    
    try {
      const verification = await verifyHMACToken(token);
      
      if (!verification.valid || !verification.data) {
        toast.error(verification.error || 'Invalid or expired link');
        return null;
      }

      // Verify user matches
      if (verification.data.userId !== user?.id) {
        toast.error('This link is not valid for your account');
        return null;
      }

      setActionData(verification.data);
      return verification.data;
      
    } catch (error) {
      toast.error('Failed to process secure link');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [user]);

  return {
    processTokenFromUrl,
    processing,
    actionData,
    setActionData
  };
}