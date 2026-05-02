import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'lodash-es';
import { ipc } from '@/ipc/manager';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Zap, Code, Brain, Star, Layers } from 'lucide-react';

interface ModelCapability {
  id: string;
  object: string;
  displayName?: string;
  capabilities: {
    vision: boolean;
    thinking: boolean;
    streaming: boolean;
    jsonMode: boolean;
    recommended: boolean;
  };
  limits: {
    maxTokens?: number;
    maxOutputTokens?: number;
    thinkingBudget?: number;
  };
}

const CAPABILITY_ICONS = {
  vision: Eye,
  thinking: Brain,
  streaming: Zap,
  jsonMode: Code,
  recommended: Star,
} as const;

const CAPABILITY_LABELS = {
  vision: 'Vision',
  thinking: 'Thinking',
  streaming: 'Streaming',
  jsonMode: 'JSON Mode',
  recommended: 'Recommended',
} as const;

function getProvider(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.startsWith('gemini')) return 'Google';
  if (id.startsWith('claude')) return 'Anthropic';
  if (id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('text-'))
    return 'OpenAI';
  if (id.startsWith('deepseek')) return 'DeepSeek';
  if (id.startsWith('meta-llama') || id.startsWith('llama')) return 'Meta';
  if (id.startsWith('mistral') || id.startsWith('mixtral')) return 'Mistral';
  if (id.startsWith('qwen')) return 'Alibaba';
  if (id.startsWith('x-ai') || id.startsWith('grok')) return 'xAI';
  if (id.startsWith('sonar')) return 'Perplexity';
  if (id.startsWith('command')) return 'Cohere';
  return 'Other';
}

/** Format large token counts with K/M suffixes */
function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

export const CapabilitiesTab: React.FC = () => {
  const { t } = useTranslation();

  const { data: capabilitiesData, isLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'modelCapabilities'],
    queryFn: () => ipc.client.proxyAdvanced.getModelCapabilities(),
    refetchInterval: 60000,
  });

  const models: ModelCapability[] = capabilitiesData?.success
    ? (capabilitiesData.data as ModelCapability[])
    : [];

  const groupedModels = useMemo(() => {
    return groupBy(models, (m) => getProvider(m.id));
  }, [models]);

  const sortedProviders = Object.keys(groupedModels).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {t('proxy.advanced.capabilities.title', 'Model Capabilities')}
          </h3>
          <p className="text-muted-foreground text-[13px]">
            {t('proxy.advanced.capabilities.description', 'Discover what each model can do')}
          </p>
        </div>
        {models.length > 0 && (
          <Badge variant="outline" className="text-xs tabular-nums">
            <Layers className="mr-1.5 h-3 w-3" />
            {models.length} models
          </Badge>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {sortedProviders.map((provider) => (
            <div key={provider} className="space-y-3">
              {/* Provider header */}
              <div className="flex items-center gap-3">
                <h4 className="text-muted-foreground text-[13px] font-semibold tracking-wide uppercase">
                  {provider}
                </h4>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-muted-foreground/60 text-[11px] tabular-nums">
                  {groupedModels[provider].length}
                </span>
              </div>

              {/* Model cards */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {groupedModels[provider].map((model) => {
                  const enabledCount = Object.values(model.capabilities).filter(Boolean).length;
                  const totalCount = Object.values(model.capabilities).length;
                  const hasLimits = Object.values(model.limits).some((v) => v != null);

                  return (
                    <div
                      key={model.id}
                      className="group bg-card flex flex-col rounded-xl border border-white/[0.06] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                    >
                      {/* Model header */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h5
                            className="truncate text-[13px] leading-tight font-semibold"
                            title={model.displayName || model.id}
                          >
                            {model.displayName || model.id}
                          </h5>
                          <span className="text-muted-foreground/60 shrink-0 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium">
                            {enabledCount}/{totalCount}
                          </span>
                        </div>
                        <p
                          className="text-muted-foreground truncate font-mono text-[11px]"
                          title={model.id}
                        >
                          {model.id}
                        </p>
                      </div>

                      {/* Capability pills */}
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {Object.entries(model.capabilities).map(([key, supported]) => {
                          const iconKey = key as keyof typeof CAPABILITY_ICONS;
                          const Icon = CAPABILITY_ICONS[iconKey];
                          const label = CAPABILITY_LABELS[iconKey];
                          return (
                            <div
                              key={key}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                                supported
                                  ? 'border border-emerald-500/15 bg-emerald-500/10 text-emerald-400'
                                  : 'text-muted-foreground/50 border border-white/[0.04] bg-white/[0.02]'
                              }`}
                              title={label}
                            >
                              <Icon className="h-3 w-3 shrink-0" />
                              {label}
                            </div>
                          );
                        })}
                      </div>

                      {/* Limits section */}
                      {hasLimits && (
                        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-white/[0.04] pt-3">
                          {model.limits.maxTokens != null && (
                            <span className="text-muted-foreground inline-flex items-center rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
                              CTX {formatTokenCount(model.limits.maxTokens)}
                            </span>
                          )}
                          {model.limits.maxOutputTokens != null && (
                            <span className="text-muted-foreground inline-flex items-center rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
                              OUT {formatTokenCount(model.limits.maxOutputTokens)}
                            </span>
                          )}
                          {model.limits.thinkingBudget != null && (
                            <span className="inline-flex items-center rounded-md border border-blue-500/15 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
                              THINK {formatTokenCount(model.limits.thinkingBudget)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.1] py-16 text-center">
              <Layers className="text-muted-foreground/30 h-8 w-8" />
              <div className="space-y-1">
                <p className="text-[13px] font-medium">No models found</p>
                <p className="text-muted-foreground text-xs">Check your provider configurations</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
