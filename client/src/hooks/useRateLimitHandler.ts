import { useState, useCallback } from 'react';

interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number | null;
  message: string;
}

export const useRateLimitHandler = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: null,
    message: ''
  });

  const handleRateLimitError = useCallback((error: any) => {
    if (error.response?.status === 429 || error.isRateLimit) {
      const retryAfter = error.retryAfter || error.response?.headers['retry-after'];
      const message = error.message || 'Too many requests. Please slow down and try again.';
      
      setRateLimitState({
        isRateLimited: true,
        retryAfter: retryAfter ? parseInt(retryAfter) : null,
        message
      });

      // Auto-clear the rate limit state after the retry period
      if (retryAfter) {
        setTimeout(() => {
          setRateLimitState({
            isRateLimited: false,
            retryAfter: null,
            message: ''
          });
        }, parseInt(retryAfter) * 1000);
      }

      return true; // Indicates the error was handled
    }
    
    return false; // Indicates the error was not a rate limit error
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      retryAfter: null,
      message: ''
    });
  }, []);

  return {
    rateLimitState,
    handleRateLimitError,
    clearRateLimit
  };
};