import React from 'react';
import { Box, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MONO_LOGO_PROVIDERS } from '@/lib/ai/providers';
import { useSettingsStore } from '@/lib/store/settings';
import { isCustomTTSProvider, isCustomASRProvider } from '@/lib/audio/types';
import type { ProviderId, ProviderType } from '@/lib/types/provider';
import type {
  ProviderSettings,
  TTSProviderId,
  ASRProviderId,
  ImageProviderId,
  VideoProviderId,
} from '@/lib/types/settings';

// ─── Provider Metadata Constants ───

export const IMAGE_PROVIDER_NAMES: Record<ImageProviderId, string> = {
  seedream: 'providerSeedream',
  'qwen-image': 'providerQwenImage',
  'nano-banana': 'providerNanoBanana',
  'minimax-image': 'providerMiniMaxImage',
  'grok-image': 'providerGrokImage',
};

export const IMAGE_PROVIDER_ICONS: Record<ImageProviderId, string> = {
  seedream: '/logos/doubao.svg',
  'qwen-image': '/logos/bailian.svg',
  'nano-banana': '/logos/gemini.svg',
  'minimax-image': '/logos/minimax.svg',
  'grok-image': '/logos/grok.svg',
};

export const VIDEO_PROVIDER_NAMES: Record<VideoProviderId, string> = {
  seedance: 'providerSeedance',
  kling: 'providerKling',
  veo: 'providerVeo',
  sora: 'providerSora',
  'minimax-video': 'providerMiniMaxVideo',
  'grok-video': 'providerGrokVideo',
};

export const VIDEO_PROVIDER_ICONS: Record<VideoProviderId, string> = {
  seedance: '/logos/doubao.svg',
  kling: '/logos/kling.svg',
  veo: '/logos/gemini.svg',
  sora: '/logos/openai.svg',
  'minimax-video': '/logos/minimax.svg',
  'grok-video': '/logos/grok.svg',
};

// ─── Formatting Helpers ───

export function formatContextWindow(size?: number): string {
  if (!size) return '-';
  if (size >= 1000000) {
    if (size % 1000000 === 0) {
      return `${size / 1000000}M`;
    }
    return `${(size / 1000000).toFixed(1)}M`;
  }
  if (size >= 1000) {
    if (size % 1000 === 0) {
      return `${size / 1000}K`;
    }
    return `${Math.floor(size / 1024)}K`;
  }
  return size.toString();
}

export function getProviderTypeLabel(type: string, t: (key: string) => string): string {
  const translationKey = `settings.providerTypes.${type}`;
  const translated = t(translationKey);
  return translated !== translationKey ? translated : type;
}

// ─── Display Name Helpers ───

export function getTTSProviderName(providerId: TTSProviderId, t: (key: string) => string): string {
  if (isCustomTTSProvider(providerId)) {
    const cfg = useSettingsStore.getState().ttsProvidersConfig[providerId];
    return cfg?.customName || providerId;
  }
  const names: Record<string, string> = {
    'openai-tts': t('settings.providerOpenAITTS'),
    'azure-tts': t('settings.providerAzureTTS'),
    'glm-tts': t('settings.providerGLMTTS'),
    'qwen-tts': t('settings.providerQwenTTS'),
    'doubao-tts': t('settings.providerDoubaoTTS'),
    'elevenlabs-tts': t('settings.providerElevenLabsTTS'),
    'minimax-tts': t('settings.providerMiniMaxTTS'),
    'browser-native-tts': t('settings.providerBrowserNativeTTS'),
  };
  return names[providerId as keyof typeof names] || providerId;
}

export function getASRProviderName(providerId: ASRProviderId, t: (key: string) => string): string {
  if (isCustomASRProvider(providerId)) {
    const cfg = useSettingsStore.getState().asrProvidersConfig[providerId];
    return cfg?.customName || providerId;
  }
  const names: Record<string, string> = {
    'openai-whisper': t('settings.providerOpenAIWhisper'),
    'browser-native': t('settings.providerBrowserNative'),
    'qwen-asr': t('settings.providerQwenASR'),
  };
  return names[providerId as keyof typeof names] || providerId;
}

// ─── Component: Provider List Column ───

export function ProviderListColumn<T extends string>({
  providers,
  configs,
  selectedId,
  onSelect,
  width,
  t,
  onAdd,
}: {
  providers: Array<{ id: T; name: string; icon?: string }>;
  configs: Record<string, { isServerConfigured?: boolean }>;
  selectedId: T;
  onSelect: (id: T) => void;
  width: number;
  t: (key: string) => string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex-shrink-0 bg-background flex flex-col" style={{ width }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all border text-left',
              selectedId === provider.id
                ? 'bg-primary/5 border-primary/50 shadow-sm'
                : 'border-transparent hover:bg-muted/50',
            )}
          >
            {provider.icon ? (
              <img
                src={provider.icon}
                alt={provider.name}
                className={cn(
                  'w-5 h-5 rounded',
                  MONO_LOGO_PROVIDERS.has(provider.id as any) && 'dark:invert',
                )}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Box className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium text-sm flex-1 truncate">{provider.name}</span>
            {configs[provider.id]?.isServerConfigured && (
              <span className="text-[10px] px-1 py-0 h-4 leading-4 rounded shrink-0 bg-muted text-muted-foreground">
                {t('settings.serverConfigured')}
              </span>
            )}
          </button>
        ))}
      </div>
      {onAdd && (
        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            {t('settings.addProviderButton')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Data Management Helpers ───

interface NewCustomProviderConfig {
  name: string;
  type: ProviderType;
  baseUrl: string;
  icon: string;
  requiresApiKey: boolean;
}

export function createCustomProviderSettings(
  providerData: NewCustomProviderConfig,
): ProviderSettings {
  return {
    apiKey: '',
    baseUrl: providerData.baseUrl || '',
    models: [],
    name: providerData.name,
    type: providerData.type,
    defaultBaseUrl: providerData.baseUrl || undefined,
    icon: providerData.icon || undefined,
    requiresApiKey: providerData.requiresApiKey,
    isBuiltIn: false,
  };
}

interface VerifyModelRequestConfig {
  providerId: ProviderId;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  providerType?: ProviderType | string;
  requiresApiKey?: boolean;
}

export function createVerifyModelRequest(config: VerifyModelRequestConfig) {
  return {
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl || '',
    model: `${config.providerId}:${config.modelId}`,
    providerType: config.providerType,
    requiresApiKey: config.requiresApiKey,
  };
}
