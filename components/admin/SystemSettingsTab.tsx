'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/lib/store/settings';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsContent } from '@/components/settings';
import { cn } from '@/lib/utils';

/**
 * SystemSettingsTab Component
 *
 * Specifically handles global AI provider and model configuration
 * within the Admin Dashboard.
 */
export function SystemSettingsTab() {
  const [isSaving, setIsSaving] = useState(false);
  const { fetchGlobalSettings, saveGlobalSettings, updatedAt } = useSettingsStore();

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await saveGlobalSettings();
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error('Failed to save system settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      await fetchGlobalSettings();
      toast.success('Synced with latest database settings');
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-border/60">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Global Configuration
          </h3>
          <p className="text-xs text-muted-foreground">
            Last synced: {updatedAt ? new Date(updatedAt).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSaving}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isSaving && "animate-spin")} />
            Sync from DB
          </Button>
          <Button
            size="sm"
            onClick={handleGlobalSave}
            disabled={isSaving}
          >
            <Save className="w-3.5 h-3.5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Global Config'}
          </Button>
        </div>
      </div>

      <div className="h-[70vh] min-h-[500px]">
        <SettingsContent
          showCloseButton={false}
          className="h-full border-none shadow-none rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}
