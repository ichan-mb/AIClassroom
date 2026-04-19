'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  CheckCircle2,
  FileText,
  Film,
  Image as ImageIcon,
  Mic,
  Search,
  Settings,
  Volume2,
  X,
  XCircle,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useSettingsStore } from '@/lib/store/settings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Component imports
import { GeneralSettings } from './general-settings';
import { ProviderList } from './provider-list';
import { ProviderConfigPanel } from './provider-config-panel';
import { PDFSettings } from './pdf-settings';
import { WebSearchSettings } from './web-search-settings';
import { ImageSettings } from './image-settings';
import { VideoSettings } from './video-settings';
import { TTSSettings } from './tts-settings';
import { ASRSettings } from './asr-settings';
import { ModelEditDialog } from './model-edit-dialog';
import { AddProviderDialog } from './add-provider-dialog';
import { AddAudioProviderDialog } from './add-audio-provider-dialog';

import { IMAGE_PROVIDERS } from '@/lib/media/image-providers';
import { VIDEO_PROVIDERS } from '@/lib/media/video-providers';
import { PDF_PROVIDERS } from '@/lib/pdf/constants';
import { WEB_SEARCH_PROVIDERS } from '@/lib/web-search/constants';
import { TTS_PROVIDERS, ASR_PROVIDERS } from '@/lib/audio/constants';
import { isCustomTTSProvider, isCustomASRProvider } from '@/lib/audio/types';

import type {
  ProviderId,
  PDFProviderId,
  WebSearchProviderId,
  ImageProviderId,
  VideoProviderId,
  TTSProviderId,
  ASRProviderId,
  SettingsSection,
  EditingModel,
  NewAudioProviderData,
} from '@/lib/types/settings';

import {
  ProviderListColumn,
  getTTSProviderName,
  getASRProviderName,
  IMAGE_PROVIDER_NAMES,
  IMAGE_PROVIDER_ICONS,
  VIDEO_PROVIDER_NAMES,
  VIDEO_PROVIDER_ICONS,
} from './utils';

interface SettingsContentProps {
  initialSection?: SettingsSection;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function SettingsContent({
  initialSection,
  onClose,
  showCloseButton = true,
  className,
}: SettingsContentProps) {
  const { t } = useI18n();

  // Get settings from store
  const providerId = useSettingsStore((state) => state.providerId);
  const providersConfig = useSettingsStore((state) => state.providersConfig);
  const pdfProviderId = useSettingsStore((state) => state.pdfProviderId);
  const pdfProvidersConfig = useSettingsStore((state) => state.pdfProvidersConfig);
  const webSearchProviderId = useSettingsStore((state) => state.webSearchProviderId);
  const webSearchProvidersConfig = useSettingsStore((state) => state.webSearchProvidersConfig);
  const imageProviderId = useSettingsStore((state) => state.imageProviderId);
  const imageProvidersConfig = useSettingsStore((state) => state.imageProvidersConfig);
  const videoProviderId = useSettingsStore((state) => state.videoProviderId);
  const videoProvidersConfig = useSettingsStore((state) => state.videoProvidersConfig);
  const ttsProviderId = useSettingsStore((state) => state.ttsProviderId);
  const ttsProvidersConfig = useSettingsStore((state) => state.ttsProvidersConfig);
  const asrProviderId = useSettingsStore((state) => state.asrProviderId);
  const asrProvidersConfig = useSettingsStore((state) => state.asrProvidersConfig);

  // Store actions
  const setProviderConfig = useSettingsStore((state) => state.setProviderConfig);
  const setTTSProvider = useSettingsStore((state) => state.setTTSProvider);
  const setASRProvider = useSettingsStore((state) => state.setASRProvider);
  const saveGlobalSettings = useSettingsStore((state) => state.saveGlobalSettings);
  const setProvidersConfig = useSettingsStore((state) => state.setProvidersConfig);
  const setPDFProvider = useSettingsStore((state) => state.setPDFProvider);
  const setWebSearchProvider = useSettingsStore((state) => state.setWebSearchProvider);
  const setImageProvider = useSettingsStore((state) => state.setImageProvider);
  const setVideoProvider = useSettingsStore((state) => state.setVideoProvider);

  // Navigation
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    initialSection || 'providers',
  );
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>(providerId);
  const [selectedPdfProviderId, setSelectedPdfProviderId] = useState<PDFProviderId>(pdfProviderId);
  const [selectedWebSearchProviderId, setSelectedWebSearchProviderId] =
    useState<WebSearchProviderId>(webSearchProviderId);
  const [selectedImageProviderId, setSelectedImageProviderId] =
    useState<ImageProviderId>(imageProviderId);
  const [selectedVideoProviderId, setSelectedVideoProviderId] =
    useState<VideoProviderId>(videoProviderId);

  // Sync local selection with store when store updates (e.g. after fetchGlobalSettings)
  useEffect(() => {
    setSelectedProviderId(providerId);
    setSelectedPdfProviderId(pdfProviderId);
    setSelectedWebSearchProviderId(webSearchProviderId);
    setSelectedImageProviderId(imageProviderId);
    setSelectedVideoProviderId(videoProviderId);
  }, [providerId, pdfProviderId, webSearchProviderId, imageProviderId, videoProviderId]);

  // Model editing state
  const [editingModel, setEditingModel] = useState<EditingModel | null>(null);
  const [showModelDialog, setShowModelDialog] = useState(false);

  // Provider deletion confirmation
  const [providerToDelete, setProviderToDelete] = useState<ProviderId | null>(null);

  // Add provider dialog
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [showAddTTSProviderDialog, setShowAddTTSProviderDialog] = useState(false);
  const [showAddASRProviderDialog, setShowAddASRProviderDialog] = useState(false);
  const addCustomTTSProvider = useSettingsStore((state) => state.addCustomTTSProvider);
  const addCustomASRProvider = useSettingsStore((state) => state.addCustomASRProvider);

  const handleAddTTSProvider = (data: NewAudioProviderData) => {
    const id = `custom-tts-${Date.now()}` as TTSProviderId;
    addCustomTTSProvider(id, data.name, data.baseUrl, data.requiresApiKey, data.defaultModel);
  };

  const handleAddASRProvider = (data: NewAudioProviderData) => {
    const id = `custom-asr-${Date.now()}` as ASRProviderId;
    addCustomASRProvider(id, data.name, data.baseUrl, data.requiresApiKey);
  };

  // Save status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Resizable column widths
  const [sidebarWidth, setSidebarWidth] = useState(192);
  const [providerListWidth, setProviderListWidth] = useState(192);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    target: 'sidebar' | 'providerList';
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, target: 'sidebar' | 'providerList') => {
      e.preventDefault();
      const startWidth = target === 'sidebar' ? sidebarWidth : providerListWidth;
      resizeRef.current = { target, startX: e.clientX, startWidth };
      setIsResizing(true);
    },
    [sidebarWidth, providerListWidth],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { target, startX, startWidth } = resizeRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(140, Math.min(400, startWidth + delta));
      if (target === 'sidebar') setSidebarWidth(newWidth);
      else setProviderListWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleSave = async () => {
    // In current context (Admin Overview), always attempt global sync
    try {
      await saveGlobalSettings();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleProviderSelect = (id: ProviderId) => {
    setSelectedProviderId(id);
  };

  const handleProviderConfigChange = (
    pid: ProviderId,
    apiKey: string,
    baseUrl: string,
    requiresApiKey: boolean,
  ) => {
    setProviderConfig(pid, { apiKey, baseUrl, requiresApiKey });
  };

  const handleProviderConfigSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const selectedProvider = providersConfig[selectedProviderId]
    ? {
        ...providersConfig[selectedProviderId],
        id: selectedProviderId,
      }
    : undefined;

  const handleEditModel = (pid: ProviderId, index: number) => {
    const allModels = providersConfig[pid]?.models || [];
    setEditingModel({
      providerId: pid,
      modelIndex: index,
      model: allModels[index],
    });
    setShowModelDialog(true);
  };

  const handleAddModel = (pid: ProviderId) => {
    const modelIndex = providersConfig[pid]?.models?.length || 0;
    const model = {
      id: '',
      name: '',
      capabilities: {
        streaming: true,
        tools: true,
        vision: false,
      },
    };
    setEditingModel({ providerId: pid, modelIndex, model });
    setShowModelDialog(true);
  };

  const handleDeleteModel = (pid: ProviderId, index: number) => {
    const currentModels = providersConfig[pid]?.models || [];
    const newModels = [...currentModels];
    newModels.splice(index, 1);
    setProviderConfig(pid, { models: newModels });
  };

  const handleAutoSaveModel = (pid: ProviderId, modelIndex: number, model: any) => {
    // Used for quick capability toggles without closing dialog
    const currentModels = providersConfig[pid]?.models || [];
    let newModels = [...currentModels];
    let newModelIndex = modelIndex;

    // Handle adding new model if it doesn't exist yet
    const existingIndex = currentModels.findIndex((m) => m.id === model.id);
    if (existingIndex === -1 && modelIndex >= currentModels.length) {
      newModels.push(model);
      newModelIndex = newModels.length - 1;
    } else {
      newModels[modelIndex] = model;
    }

    setProviderConfig(pid, { models: newModels });
    setEditingModel({ providerId: pid, modelIndex: newModelIndex, model });
  };

  const handleSaveModel = (pid: ProviderId, modelIndex: number, model: any) => {
    const currentModels = providersConfig[pid]?.models || [];
    let newModels = [...currentModels];
    if (modelIndex < currentModels.length) {
      newModels[modelIndex] = model;
    } else {
      newModels.push(model);
    }
    setProviderConfig(pid, { models: newModels });
    setShowModelDialog(false);
    setEditingModel(null);
  };

  const handleAddProvider = (data: any) => {
    const newProviderId = `custom-${Date.now()}` as ProviderId;
    const updatedConfig = {
      ...providersConfig,
      [newProviderId]: {
        id: newProviderId,
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        apiKey: '',
        models: [],
        requiresApiKey: data.requiresApiKey,
        isBuiltIn: false,
      },
    };
    setProvidersConfig(updatedConfig);
    setSelectedProviderId(newProviderId);
    setShowAddProviderDialog(false);
  };

  const handleDeleteProvider = (pid: ProviderId) => {
    setProviderToDelete(pid);
  };

  const confirmDeleteProvider = () => {
    if (!providerToDelete) return;
    const pid = providerToDelete;
    const updatedConfig = { ...providersConfig };
    delete updatedConfig[pid];
    setProvidersConfig(updatedConfig);

    if (selectedProviderId === pid) {
      const firstRemainingPid = Object.keys(updatedConfig)[0] as ProviderId;
      setSelectedProviderId(firstRemainingPid);
    }
    setProviderToDelete(null);
  };

  const handleResetProvider = (pid: ProviderId) => {
    const provider = Object.values(providersConfig).find((p) => p.id === pid);
    if (!provider) return;
    // Implementation would need default config access, currently store handles it
  };

  const allProviders = Object.entries(providersConfig).map(([id, p]) => ({
    id: id as ProviderId,
    name: p.name,
    type: p.type,
    defaultBaseUrl: p.defaultBaseUrl,
    icon: p.icon,
    requiresApiKey: p.requiresApiKey,
    models: p.models,
    isServerConfigured: p.isServerConfigured,
  }));

  const getHeaderContent = () => {
    switch (activeSection) {
      case 'providers':
        return (
          <>
            <Box className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.providers')}</h2>
          </>
        );
      case 'general':
        return (
          <>
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.generalSettings')}</h2>
          </>
        );
      case 'pdf':
        return (
          <>
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.pdfSettings')}</h2>
          </>
        );
      case 'web-search':
        return (
          <>
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.webSearchSettings')}</h2>
          </>
        );
      case 'image':
        return (
          <>
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.imageSettings')}</h2>
          </>
        );
      case 'video':
        return (
          <>
            <Film className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings.videoSettings')}</h2>
          </>
        );
      case 'tts':
        return (
          <>
            <Volume2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{getTTSProviderName(ttsProviderId, t)}</h2>
          </>
        );
      case 'asr':
        return (
          <>
            <Mic className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{getASRProviderName(asrProviderId, t)}</h2>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex h-full overflow-hidden bg-background border rounded-xl shadow-sm',
        className,
      )}
    >
      {/* Left Sidebar - Navigation */}
      <div className="flex-shrink-0 bg-muted/30 p-3 space-y-1" style={{ width: sidebarWidth }}>
        <button
          onClick={() => setActiveSection('providers')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'providers'
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted',
          )}
        >
          <Box className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.providers')}</span>
        </button>

        <button
          onClick={() => setActiveSection('image')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'image' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
          )}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.imageSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('video')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'video' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
          )}
        >
          <Film className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.videoSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('tts')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'tts' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
          )}
        >
          <Volume2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.ttsSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('asr')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'asr' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
          )}
        >
          <Mic className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.asrSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('pdf')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'pdf' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.pdfSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('web-search')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'web-search'
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted',
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.webSearchSettings')}</span>
        </button>

        <button
          onClick={() => setActiveSection('general')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left min-w-0',
            activeSection === 'general'
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('settings.systemSettings')}</span>
        </button>
      </div>

      {/* Sidebar resize handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, 'sidebar')}
        className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
      >
        <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
      </div>

      {/* Middle - Provider List (only shown for provider-based sections) */}
      {activeSection === 'providers' && (
        <>
          <ProviderList
            providers={allProviders}
            selectedProviderId={selectedProviderId}
            onSelect={handleProviderSelect}
            onAddProvider={() => setShowAddProviderDialog(true)}
            width={providerListWidth}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'pdf' && (
        <>
          <ProviderListColumn
            providers={Object.values(PDF_PROVIDERS)}
            configs={pdfProvidersConfig}
            selectedId={selectedPdfProviderId}
            onSelect={setSelectedPdfProviderId}
            width={providerListWidth}
            t={t}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'web-search' && (
        <>
          <ProviderListColumn
            providers={Object.values(WEB_SEARCH_PROVIDERS)}
            configs={webSearchProvidersConfig}
            selectedId={selectedWebSearchProviderId}
            onSelect={setSelectedWebSearchProviderId}
            width={providerListWidth}
            t={t}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'image' && (
        <>
          <ProviderListColumn
            providers={Object.values(IMAGE_PROVIDERS).map((p) => ({
              id: p.id,
              name: t(`settings.${IMAGE_PROVIDER_NAMES[p.id]}`) || p.name,
              icon: IMAGE_PROVIDER_ICONS[p.id],
            }))}
            configs={imageProvidersConfig}
            selectedId={selectedImageProviderId}
            onSelect={setSelectedImageProviderId}
            width={providerListWidth}
            t={t}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'video' && (
        <>
          <ProviderListColumn
            providers={Object.values(VIDEO_PROVIDERS).map((p) => ({
              id: p.id,
              name: t(`settings.${VIDEO_PROVIDER_NAMES[p.id]}`) || p.name,
              icon: VIDEO_PROVIDER_ICONS[p.id],
            }))}
            configs={videoProvidersConfig}
            selectedId={selectedVideoProviderId}
            onSelect={setSelectedVideoProviderId}
            width={providerListWidth}
            t={t}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'tts' && (
        <>
          <ProviderListColumn
            providers={[
              ...Object.values(TTS_PROVIDERS).map((p) => ({
                id: p.id,
                name: getTTSProviderName(p.id, t),
                icon: p.icon,
              })),
              ...Object.entries(ttsProvidersConfig)
                .filter(([id]) => isCustomTTSProvider(id))
                .map(([id, cfg]) => ({
                  id: id as TTSProviderId,
                  name: cfg.customName || id,
                  icon: undefined,
                })),
            ]}
            configs={ttsProvidersConfig}
            selectedId={ttsProviderId}
            onSelect={setTTSProvider}
            width={providerListWidth}
            t={t}
            onAdd={() => setShowAddTTSProviderDialog(true)}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {activeSection === 'asr' && (
        <>
          <ProviderListColumn
            providers={[
              ...Object.values(ASR_PROVIDERS).map((p) => ({
                id: p.id,
                name: getASRProviderName(p.id, t),
                icon: p.icon,
              })),
              ...Object.entries(asrProvidersConfig)
                .filter(([id]) => isCustomASRProvider(id))
                .map(([id, cfg]) => ({
                  id: id as ASRProviderId,
                  name: cfg.customName || id,
                  icon: undefined,
                })),
            ]}
            configs={asrProvidersConfig}
            selectedId={asrProviderId}
            onSelect={setASRProvider}
            width={providerListWidth}
            t={t}
            onAdd={() => setShowAddASRProviderDialog(true)}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'providerList')}
            className="flex-shrink-0 w-[5px] cursor-col-resize group flex justify-center"
          >
            <div className="w-px h-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </>
      )}

      {/* Right - Configuration Panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-card">
          <div className="flex items-center gap-3">{getHeaderContent()}</div>
          <div className="flex items-center gap-2">
            {activeSection === 'providers' && !providersConfig[selectedProviderId]?.isBuiltIn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => handleDeleteProvider(selectedProviderId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {showCloseButton && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-card/50">
          {activeSection === 'general' && <GeneralSettings />}

          {activeSection === 'providers' && selectedProvider && (
            <ProviderConfigPanel
              provider={selectedProvider}
              initialApiKey={providersConfig[selectedProviderId]?.apiKey || ''}
              initialBaseUrl={providersConfig[selectedProviderId]?.baseUrl || ''}
              initialRequiresApiKey={providersConfig[selectedProviderId]?.requiresApiKey ?? true}
              providersConfig={providersConfig}
              onConfigChange={(apiKey, baseUrl, requiresApiKey) =>
                handleProviderConfigChange(selectedProviderId, apiKey, baseUrl, requiresApiKey)
              }
              onSave={handleProviderConfigSave}
              onEditModel={(index) => handleEditModel(selectedProviderId, index)}
              onDeleteModel={(index) => handleDeleteModel(selectedProviderId, index)}
              onAddModel={handleAddModel}
              onResetToDefault={() => handleResetProvider(selectedProviderId)}
              isBuiltIn={providersConfig[selectedProviderId]?.isBuiltIn ?? true}
            />
          )}

          {activeSection === 'pdf' && <PDFSettings selectedProviderId={selectedPdfProviderId} />}
          {activeSection === 'web-search' && (
            <WebSearchSettings selectedProviderId={selectedWebSearchProviderId} />
          )}
          {activeSection === 'image' && (
            <ImageSettings selectedProviderId={selectedImageProviderId} />
          )}
          {activeSection === 'video' && (
            <VideoSettings selectedProviderId={selectedVideoProviderId} />
          )}
          {activeSection === 'tts' && <TTSSettings selectedProviderId={ttsProviderId} />}
          {activeSection === 'asr' && <ASRSettings selectedProviderId={asrProviderId} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t bg-muted/30">
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t('settings.saveSuccess')}</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{t('settings.saveFailed')}</span>
            </div>
          )}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('settings.close')}
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            {t('settings.save')}
          </Button>
        </div>
      </div>

      {/* Dialogs extracted from parent for autonomy */}
      <ModelEditDialog
        open={showModelDialog}
        onOpenChange={setShowModelDialog}
        editingModel={editingModel}
        setEditingModel={setEditingModel}
        onSave={handleSaveModel}
        onAutoSave={handleAutoSaveModel}
        providerId={selectedProviderId}
        apiKey={providersConfig[selectedProviderId]?.apiKey || ''}
        baseUrl={providersConfig[selectedProviderId]?.baseUrl}
        providerType={providersConfig[selectedProviderId]?.type}
        requiresApiKey={providersConfig[selectedProviderId]?.requiresApiKey}
        isServerConfigured={providersConfig[selectedProviderId]?.isServerConfigured}
      />

      <AddProviderDialog
        open={showAddProviderDialog}
        onOpenChange={setShowAddProviderDialog}
        onAdd={handleAddProvider}
      />

      <AddAudioProviderDialog
        open={showAddTTSProviderDialog}
        onOpenChange={setShowAddTTSProviderDialog}
        onAdd={handleAddTTSProvider}
        type="tts"
      />

      <AddAudioProviderDialog
        open={showAddASRProviderDialog}
        onOpenChange={setShowAddASRProviderDialog}
        onAdd={handleAddASRProvider}
        type="asr"
      />

      <AlertDialog
        open={providerToDelete !== null}
        onOpenChange={(open) => !open && setProviderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteProvider')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.deleteProviderConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('settings.cancelEdit')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProvider}>
              {t('settings.deleteProvider')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
