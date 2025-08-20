import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: (result: any, attempt: number) => void;
  onMaxAttemptsReached?: (lastError: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}

export function useBookingRetry(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onError,
    onSuccess,
    onMaxAttemptsReached
  } = config;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> => {
    setRetryState(prev => ({ ...prev, isRetrying: true, attemptCount: 0 }));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({ ...prev, attemptCount: attempt }));
        
        // Add delay between attempts (except first)
        if (attempt > 1) {
          const waitTime = delayMs * Math.pow(backoffMultiplier, attempt - 2);
          await delay(waitTime);
          
          toast.loading(`Retrying ${operationName}... (${attempt}/${maxAttempts})`, {
            id: `retry-${operationName}`
          });
        }

        const result = await operation();
        
        // Success
        setRetryState(prev => ({ ...prev, isRetrying: false, lastError: null }));
        onSuccess?.(result, attempt);
        
        if (attempt > 1) {
          toast.success(`${operationName} successful after ${attempt} attempts`, {
            id: `retry-${operationName}`
          });
        }
        
        return result;
        
      } catch (error) {
        const err = error as Error;
        setRetryState(prev => ({ ...prev, lastError: err }));
        onError?.(err, attempt);

        // If this was the last attempt
        if (attempt === maxAttempts) {
          setRetryState(prev => ({ ...prev, isRetrying: false }));
          onMaxAttemptsReached?.(err);
          
          toast.error(`${operationName} failed after ${maxAttempts} attempts`, {
            id: `retry-${operationName}`,
            description: err.message
          });
          
          throw err;
        }

        // Show retry notification
        toast.error(`${operationName} failed (attempt ${attempt}/${maxAttempts})`, {
          id: `retry-${operationName}`,
          description: `Retrying in ${Math.round(delayMs * Math.pow(backoffMultiplier, attempt - 1) / 1000)}s...`
        });
      }
    }

    throw new Error('Unexpected end of retry loop');
  }, [maxAttempts, delayMs, backoffMultiplier, onError, onSuccess, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null
    });
  }, []);

  return {
    executeWithRetry,
    reset,
    ...retryState
  };
}

// Specific retry strategies for different booking operations
export const bookingRetryStrategies = {
  // For payment processing - fewer attempts, longer delays
  payment: {
    maxAttempts: 2,
    delayMs: 2000,
    backoffMultiplier: 2
  },
  
  // For availability checking - more attempts, shorter delays
  availability: {
    maxAttempts: 5,
    delayMs: 500,
    backoffMultiplier: 1.5
  },
  
  // For form submission - moderate attempts and delays
  submission: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  
  // For data persistence - quick retries
  persistence: {
    maxAttempts: 2,
    delayMs: 200,
    backoffMultiplier: 1
  }
};