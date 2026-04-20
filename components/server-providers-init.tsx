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
    const init = async () => {
      // 1. Fetch global system settings from PostgreSQL first
      await fetchGlobalSettings();
      // 2. Fetch environment-configured provider metadata and perform validation second
      // This ensures environment overrides are applied to the correct DB-synced base state
      await fetchServerProviders();
    };
    init();
  }, [fetchServerProviders, fetchGlobalSettings]);

  return null;
}
