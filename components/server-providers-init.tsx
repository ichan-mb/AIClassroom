'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings';

/**
 * Fetches server-configured providers on mount and merges into settings store.
 * Renders nothing — purely a side-effect component.
 */
export function ServerProvidersInit() {
  const fetchServerProviders = useSettingsStore((state) => state.fetchServerProviders);
  const fetchGlobalSettings = useSettingsStore((state) => state.fetchGlobalSettings);

  useEffect(() => {
    fetchGlobalSettings();
    fetchServerProviders();
  }, [fetchServerProviders, fetchGlobalSettings]);

  return null;
}
