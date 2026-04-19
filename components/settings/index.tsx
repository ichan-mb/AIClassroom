'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/hooks/use-i18n';
import { SettingsContent } from './settings-content';
import type { SettingsSection } from '@/lib/types/settings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: SettingsSection;
}

/**
 * SettingsDialog component
 * A dialog wrapper around the SettingsContent component.
 * Used for both standard users and admin configuration in a modal context.
 */
export function SettingsDialog({ open, onOpenChange, initialSection }: SettingsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl h-[85vh] p-0 gap-0 block overflow-hidden border-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t('settings.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('settings.description')}</DialogDescription>

        <SettingsContent
          initialSection={initialSection}
          onClose={() => onOpenChange(false)}
          className="rounded-none border-none shadow-none h-full"
        />
      </DialogContent>
    </Dialog>
  );
}

export { SettingsContent } from './settings-content';
