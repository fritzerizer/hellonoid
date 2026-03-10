'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setAuthTokenProvider } from '@/lib/api-client';

/**
 * Hook that sets up the API client with auth token provider
 * Should be used in components that make API calls
 */
export function useApiClient() {
  const { getAuthToken } = useAuth();

  useEffect(() => {
    // Set the auth token provider for the API client
    setAuthTokenProvider(getAuthToken);
  }, [getAuthToken]);

  return null; // This hook only sets up the provider
}