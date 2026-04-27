import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'lodash-es';
import { ipc } from '@/ipc/manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Zap, Code, Brain, Star } from 'lucide-react';

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
  if (id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('text-')) return 'OpenAI';
  if (id.startsWith('deepseek')) return 'DeepSeek';
  if (id.startsWith('meta-llama') || id.startsWith('llama')) return 'Meta';
  if (id.startsWith('mistral') || id.startsWith('mixtral')) return 'Mistral';
  if (id.startsWith('qwen')) return 'Alibaba';
  if (id.startsWith('x-ai') || id.startsWith('grok')) return 'xAI';
  if (id.startsWith('sonar')) return 'Perplexity';
  if (id.startsWith('command')) return 'Cohere';
  return 'Other';
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

  // Sort providers alphabetically, but keep 'Other' at the bottom
  const sortedProviders = Object.keys(groupedModels).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">{t('proxy.advanced.capabilities.title', 'Model Capabilities')}</h3>
        <p className="text-sm text-muted-foreground">{t('proxy.advanced.capabilities.description', 'Discover what each model can do')}</p>
      </div>

      {/* Capabilities Grid */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {sortedProviders.map((provider) => (
            <div key={provider} className="space-y-4">
              <h4 className="text-md font-semibold text-foreground border-b pb-2">
                {provider}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedModels[provider].map((model) => (
                  <Card key={model.id} className="flex flex-col transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate pr-2" title={model.displayName || model.id}>
                          {model.displayName || model.id}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0">{model.object}</Badge>
                      </div>
                      <CardDescription className="text-xs font-mono text-muted-foreground truncate" title={model.id}>
                        {model.id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(model.capabilities).map(([key, supported]) => {
                          const iconKey = key as keyof typeof CAPABILITY_ICONS;
                          const Icon = CAPABILITY_ICONS[iconKey];
                          const label = CAPABILITY_LABELS[iconKey];
                          return (
                            <div
                              key={key}
                              className={`flex items-center gap-2 rounded-md border p-2 ${
                                supported
                                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50'
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  supported ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                                }`}
                              />
                              <span
                                className={`text-[11px] font-medium truncate ${
                                  supported
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                                title={label}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {Object.values(model.limits).some((v) => v != null) && (
                        <div className="space-y-2 pt-2 border-t mt-auto">
                          <p className="text-xs font-medium text-muted-foreground">Limits</p>
                          <div className="flex flex-wrap gap-1.5">
                            {model.limits.maxTokens != null && (
                              <Badge variant="secondary" className="text-[10px] font-normal px-1.5">
                                Context: {model.limits.maxTokens.toLocaleString()}
                              </Badge>
                            )}
                            {model.limits.maxOutputTokens != null && (
                              <Badge variant="secondary" className="text-[10px] font-normal px-1.5">
                                Output: {model.limits.maxOutputTokens.toLocaleString()}
                              </Badge>
                            )}
                            {model.limits.thinkingBudget != null && (
                              <Badge variant="secondary" className="text-[10px] font-normal px-1.5 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                                Think: {model.limits.thinkingBudget.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {models.length === 0 && (
             <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
               No models found. Check your provider configurations.
             </div>
          )}
        </div>
      )}
    </div>
  );
};
