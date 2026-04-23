import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Zap, Code, Mic, Image } from 'lucide-react';

interface ModelCapability {
  id: string;
  object: string;
  capabilities: {
    vision: boolean;
    streaming: boolean;
    jsonMode: boolean;
    audio: boolean;
    imageGeneration: boolean;
  };
}

const CAPABILITY_ICONS = {
  vision: Eye,
  streaming: Zap,
  jsonMode: Code,
  audio: Mic,
  imageGeneration: Image,
} as const;

const CAPABILITY_LABELS = {
  vision: 'Vision',
  streaming: 'Streaming',
  jsonMode: 'JSON Mode',
  audio: 'Audio',
  imageGeneration: 'Image Generation',
} as const;

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">{t('proxy.advanced.capabilities.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('proxy.advanced.capabilities.description')}</p>
      </div>

      {/* Capabilities Grid */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{model.id}</CardTitle>
                  <Badge variant="outline">{model.object}</Badge>
                </div>
                <CardDescription>Model capabilities and features</CardDescription>
              </CardHeader>
              <CardContent>
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
                            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            supported ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            supported
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {label}
                        </span>
                        {supported && (
                          <Badge variant="default" className="ml-auto h-5 bg-green-600 text-[10px]">
                            ✓
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
