/**
 * API Proxy Service Page
 * Provides service control, model mapping, and usage examples
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';
import { useEffect, useState, useMemo } from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { ProxyConfig } from '@/types/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Copy,
  Code,
  Terminal,
  Eye,
  EyeOff,
  ServerOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useCloudAccounts } from '@/hooks/useCloudAccounts';
import { ToolsTab } from '@/components/proxy/advanced/ToolsTab';
import { flatMap, sortBy, uniq } from 'lodash-es';

type ProxyProtocol = 'openai' | 'anthropic';

const DEFAULT_MODELS = [
  'gemini-3-flash',
  'gemini-3.1-pro-low',
  'gemini-3.1-pro-high',
  'claude-sonnet-4-6-thinking',
  'claude-opus-4-6-thinking',
];

const ANTHROPIC_ROUTE_OPTIONS = [
  'claude-sonnet-4-6-thinking',
  'claude-opus-4-6-thinking',
  'gemini-3-flash',
  'gemini-3.1-pro-low',
  'gemini-3.1-pro-high',
] as const;

const DEFAULT_ANTHROPIC_MAPPING: Record<string, string> = {
  'claude-sonnet-4-6-20260219': 'claude-sonnet-4-6-thinking',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4-6-thinking',
  'claude-opus-4-6-20260201': 'claude-opus-4-6-thinking',
  opus: 'claude-opus-4-6-thinking',
};

function resolveAnthropicMappingValue(
  anthropicMapping: Record<string, string>,
  keys: string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = anthropicMapping[key];
    if (value) {
      return value;
    }
  }
  return fallback;
}

function ProxyPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, isLoading, saveConfig } = useAppConfig();

  // Query all available local IPs
  const { data: localIps } = useQuery({
    queryKey: ['system', 'localIps'],
    queryFn: async () => {
      try {
        const ips = await ipc.client.system.get_local_ips();
        return ips as { address: string; name: string; isRecommended: boolean }[];
      } catch (e) {
        console.error('Failed to get local IPs:', e);
        return [{ address: '127.0.0.1', name: 'localhost', isRecommended: false }];
      }
    },
    staleTime: Infinity,
    retry: 3,
  });

  // Selected IP for display (defaults to first recommended or first available)
  const [selectedIp, setSelectedIp] = useState<string>('');

  // Set default selected IP when IPs are loaded
  useEffect(() => {
    if (localIps && localIps.length > 0 && !selectedIp) {
      const recommended = localIps.find((ip) => ip.isRecommended);
      setTimeout(() => setSelectedIp(recommended?.address || localIps[0].address), 0);
    }
  }, [localIps, selectedIp]);

  // Local state for proxyConfig editing
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig | undefined>(undefined);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Sync config.proxy to local state when loaded, and check actual server status
  useEffect(() => {
    if (config) {
      // Check actual server status and sync with config
      const syncServerStatus = async () => {
        try {
          const status = await ipc.client.gateway.status();
          const actualEnabled = status.running;

          // If config says enabled but server not running, or vice versa, sync
          if (config.proxy.enabled !== actualEnabled) {
            const syncedConfig = { ...config.proxy, enabled: actualEnabled };
            setProxyConfig(syncedConfig);
            // Also save the corrected state
            await saveConfig({ ...config, proxy: syncedConfig });
          } else {
            setProxyConfig(config.proxy);
          }
        } catch {
          // If status check fails, just use config value
          setProxyConfig(config.proxy);
        }
      };
      syncServerStatus();
    }
  }, [config, saveConfig]);

  // Helper to update proxyConfig and auto-save
  const updateProxyConfig = async (newProxyConfig: ProxyConfig) => {
    setProxyConfig(newProxyConfig);
    if (config) {
      await saveConfig({ ...config, proxy: newProxyConfig });
    }
  };

  // ===== Usage Examples State =====
  const { data: accounts } = useCloudAccounts();
  const [selectedProtocol, setSelectedProtocol] = useState<ProxyProtocol>('openai');
  const [activeModelTab, setActiveModelTab] = useState('gemini-3.1-pro-high');
  const [showCurl, setShowCurl] = useState(true);
  const [showPython, setShowPython] = useState(true);

  const { data: metricsData } = useQuery({
    queryKey: ['proxyAdvanced', 'metrics'],
    queryFn: () => ipc.client.proxyAdvanced.getProxyMetrics(),
    refetchInterval: 30000,
    enabled: proxyConfig?.enabled ?? false,
  });

  const availableModelIds: string[] = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return DEFAULT_MODELS;
    }
    const modelNames = flatMap(accounts, (account) => {
      if (!account.quota?.models) return [];
      return Object.keys(account.quota.models);
    });
    const uniqueModels = sortBy(uniq(modelNames));
    return uniqueModels.length > 0 ? uniqueModels : DEFAULT_MODELS;
  }, [accounts]);

  const groupedModels = useMemo(() => {
    const groups: Record<string, string[]> = {
      Anthropic: [],
      Google: [],
      OpenAI: [],
      Other: [],
    };

    availableModelIds.forEach((id) => {
      const lower = id.toLowerCase();
      if (lower.includes('gemini') || lower.includes('learnlm') || lower.includes('gemma')) {
        groups['Google'].push(id);
      } else if (lower.includes('claude')) {
        groups['Anthropic'].push(id);
      } else if (
        lower.includes('gpt') ||
        lower.includes('o1') ||
        lower.includes('o3') ||
        lower.includes('dall-e')
      ) {
        groups['OpenAI'].push(id);
      } else {
        groups['Other'].push(id);
      }
    });

    return groups;
  }, [availableModelIds]);

  useEffect(() => {
    if (!availableModelIds.includes(activeModelTab) && availableModelIds.length > 0) {
      setTimeout(() => setActiveModelTab(availableModelIds[0]), 0);
    }
  }, [availableModelIds, activeModelTab]);

  // Computed values for examples
  const apiKey = proxyConfig?.api_key || 'YOUR_API_KEY';
  const baseUrl = `http://localhost:${proxyConfig?.port || 8045}`;

  const updateAnthropicMapping = (mappingPatch: Record<string, string>) => {
    if (!proxyConfig) {
      return;
    }
    updateProxyConfig({
      ...proxyConfig,
      anthropic_mapping: {
        ...proxyConfig.anthropic_mapping,
        ...mappingPatch,
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('proxy.copied') });
  };

  const getCurlExample = (modelId: string) => {
    if (selectedProtocol === 'anthropic') {
      return `curl ${baseUrl}/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${modelId}",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;
    }
    return `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${modelId}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;
  };

  const getPythonExample = (modelId: string) => {
    if (selectedProtocol === 'anthropic') {
      return `from anthropic import Anthropic

client = Anthropic(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

response = client.messages.create(
    model="${modelId}",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.content[0].text)`;
    }
    return `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}/v1",
    api_key="${apiKey}"
)

response = client.chat.completions.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)`;
  };

  if (isLoading || !proxyConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-5 overflow-auto p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t('proxy.title')}</h2>
        <p className="text-muted-foreground mt-1 text-[13px]">{t('proxy.description')}</p>
      </div>

      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-5">
          {/* Service Control Card */}
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('proxy.service.title')}</CardTitle>
                  <CardDescription>{t('proxy.service.description')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${proxyConfig.enabled ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground/30'}`}
                  ></div>
                  <span className="text-[13px] font-medium">
                    {proxyConfig.enabled ? t('proxy.service.running') : t('proxy.service.stopped')}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Start/Stop Button */}
              <div className="flex items-center gap-4">
                <Button
                  variant={proxyConfig.enabled ? 'destructive' : 'default'}
                  onClick={async () => {
                    const { ipc } = await import('@/ipc/manager');
                    if (proxyConfig.enabled) {
                      await ipc.client.gateway.stop();
                      updateProxyConfig({ ...proxyConfig, enabled: false });
                    } else {
                      await ipc.client.gateway.start({ port: proxyConfig.port });
                      updateProxyConfig({ ...proxyConfig, enabled: true });
                    }
                  }}
                >
                  {proxyConfig.enabled ? t('proxy.service.stop') : t('proxy.service.start')}
                </Button>
              </div>

              {/* Port & Timeout Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gateway-port">{t('proxy.config.port')}</Label>
                  <Input
                    id="gateway-port"
                    type="number"
                    value={proxyConfig.port}
                    onChange={(e) =>
                      updateProxyConfig({ ...proxyConfig, port: parseInt(e.target.value) || 8045 })
                    }
                    disabled={proxyConfig.enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gateway-timeout">{t('proxy.config.timeout')}</Label>
                  <Input
                    id="gateway-timeout"
                    type="number"
                    value={proxyConfig.request_timeout}
                    onChange={(e) =>
                      updateProxyConfig({
                        ...proxyConfig,
                        request_timeout: parseInt(e.target.value) || 120,
                      })
                    }
                  />
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label>{t('proxy.config.api_key')}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={proxyConfig.api_key || ''}
                      readOnly
                      type={showKey ? 'text' : 'password'}
                      className="pr-10 font-mono text-[13px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowKey(!showKey)}
                      title={showKey ? t('proxy.config.hide_key') : t('proxy.config.show_key')}
                    >
                      {showKey ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(proxyConfig.api_key || '')}
                  >
                    <Copy size={14} className="mr-1" />
                    {t('proxy.copy')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRegenerateDialogOpen(true)}
                  >
                    {t('proxy.regenerate')}
                  </Button>
                </div>
                {(!proxyConfig.api_key || proxyConfig.api_key.length < 10) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {proxyConfig.api_key ? 'Weak key' : 'No API key'}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {proxyConfig.api_key
                        ? 'API key is too short for secure operation'
                        : 'Generate or set an API key to secure the proxy'}
                    </span>
                  </div>
                )}
                <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('proxy.regenerateConfirm.title')}</DialogTitle>
                      <DialogDescription>
                        {t('proxy.regenerateConfirm.description')}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)}>
                        {t('proxy.regenerateConfirm.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          const { ipc } = await import('@/ipc/manager');
                          const result = await ipc.client.gateway.generateKey();
                          updateProxyConfig({ ...proxyConfig, api_key: result.api_key });
                          setIsRegenerateDialogOpen(false);
                        }}
                      >
                        {t('proxy.regenerateConfirm.confirm')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Auto Start Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] p-4">
                <div className="space-y-1">
                  <Label>{t('proxy.config.auto_start')}</Label>
                  <p className="text-muted-foreground text-xs">
                    {t('proxy.config.auto_start_desc')}
                  </p>
                </div>
                <Switch
                  checked={proxyConfig.auto_start}
                  onCheckedChange={(checked) =>
                    updateProxyConfig({ ...proxyConfig, auto_start: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Quota Context */}
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <CardTitle>Account Pool</CardTitle>
              <CardDescription>Quota and routing context</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts && accounts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Primary Account</p>
                      <p className="text-muted-foreground font-mono text-[13px]">
                        {accounts[0].email}
                      </p>
                    </div>
                    {accounts.length > 1 && (
                      <Badge variant="outline">
                        Pool Mode: Active ({accounts.length} accounts)
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <Link to={'/accounts' as any}>Manage Accounts</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <p className="text-muted-foreground text-[13px]">No accounts configured</p>
                  <Button size="sm" className="text-xs" asChild>
                    <Link to={'/accounts' as any}>Add Account</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {proxyConfig.enabled ? (
            <>
              {/* Local Access Info Banner */}
              <div className="flex flex-col gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[13px] text-blue-200">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{t('proxy.config.local_access')}</div>
                  <code className="rounded-md bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs select-all">
                    http://{selectedIp || 'localhost'}:{proxyConfig.port}/v1
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-300 hover:bg-blue-500/10"
                    onClick={() =>
                      copyToClipboard(`http://${selectedIp || 'localhost'}:${proxyConfig.port}/v1`)
                    }
                  >
                    <Copy size={14} />
                  </Button>
                  {localIps && localIps.length > 1 && (
                    <Select value={selectedIp} onValueChange={setSelectedIp}>
                      <SelectTrigger className="ml-2 h-7 w-auto min-w-[180px] text-xs">
                        <SelectValue placeholder={t('proxy.config.select_ip')} />
                      </SelectTrigger>
                      <SelectContent>
                        {localIps.map((ip) => (
                          <SelectItem key={ip.address} value={ip.address} className="text-xs">
                            {ip.address} ({ip.name}){ip.isRecommended && ' ★'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {!proxyConfig.api_key && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                    {t('proxy.config.no_token_warning')}
                  </div>
                )}
              </div>

              {/* Health Metrics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {(() => {
                  const metrics = metricsData?.success ? metricsData.data : undefined;
                  const items = [
                    {
                      label: t('proxy.advanced.metrics.requestsPerMinute'),
                      value: metrics?.requestsPerMinute ?? 0,
                      suffix: '',
                    },
                    {
                      label: t('proxy.advanced.metrics.avgLatency'),
                      value: metrics?.avgLatency ?? 0,
                      suffix: 'ms',
                    },
                    {
                      label: t('proxy.advanced.metrics.errorRate'),
                      value: metrics?.errorRate ?? 0,
                      suffix: '%',
                    },
                    {
                      label: t('proxy.advanced.metrics.activeConnections'),
                      value: metrics?.activeConnections ?? 0,
                      suffix: '',
                    },
                  ];
                  return items.map((metric) => (
                    <Card
                      key={metric.label}
                      className="bg-card border border-white/[0.06] shadow-none"
                    >
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                          {metric.label}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xl font-semibold tabular-nums">
                            {metric.value}
                            {metric.suffix}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/[0.1] p-12 text-center">
              <ServerOff className="text-muted-foreground/50 h-10 w-10" />
              <div className="space-y-1">
                <p className="text-base font-semibold">Proxy is not running</p>
                <p className="text-muted-foreground text-[13px]">
                  Start the proxy to enable local API access
                </p>
              </div>
              <Button
                onClick={async () => {
                  const { ipc } = await import('@/ipc/manager');
                  await ipc.client.gateway.start({ port: proxyConfig.port });
                  updateProxyConfig({ ...proxyConfig, enabled: true });
                }}
              >
                Start Proxy
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Routing Tab */}
        <TabsContent value="routing" className="space-y-5">
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <CardTitle>{t('proxy.mapping.title')}</CardTitle>
              <CardDescription>{t('proxy.mapping.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                <div className="text-muted-foreground grid grid-cols-3 gap-4 border-b border-white/[0.06] bg-white/[0.02] p-3 text-[11px] font-medium tracking-wider uppercase">
                  <div>Requested Model</div>
                  <div>Resolved Model</div>
                  <div>Provider</div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4 p-3 text-[13px]">
                  <div className="font-medium">Claude Sonnet 4.6 (Thinking)</div>
                  <Select
                    value={resolveAnthropicMappingValue(
                      proxyConfig.anthropic_mapping,
                      ['claude-sonnet-4-6-20260219', 'claude-sonnet-4-5-20250929'],
                      'claude-sonnet-4-6-thinking',
                    )}
                    onValueChange={(value) =>
                      updateAnthropicMapping({
                        'claude-sonnet-4-6-20260219': value,
                        'claude-sonnet-4-5-20250929': value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTHROPIC_ROUTE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">Anthropic</Badge>
                </div>
                <div className="grid grid-cols-3 items-center gap-4 border-t border-white/[0.06] p-3 text-[13px]">
                  <div className="font-medium">Claude Opus 4.6 (Thinking)</div>
                  <Select
                    value={resolveAnthropicMappingValue(
                      proxyConfig.anthropic_mapping,
                      ['claude-opus-4-6-20260201', 'opus'],
                      'claude-opus-4-6-thinking',
                    )}
                    onValueChange={(value) =>
                      updateAnthropicMapping({
                        'claude-opus-4-6-20260201': value,
                        opus: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTHROPIC_ROUTE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">Anthropic</Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateProxyConfig({
                      ...proxyConfig,
                      anthropic_mapping: { ...DEFAULT_ANTHROPIC_MAPPING },
                    })
                  }
                >
                  {t('proxy.mapping.restore')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Mappings */}
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <CardTitle>{t('proxy.routing.currentMappings')}</CardTitle>
              <CardDescription>{t('proxy.routing.modelMapping')}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const mappingEntries = Object.entries(proxyConfig.anthropic_mapping || {});
                const customEntries = Object.entries(proxyConfig.custom_mapping || {});
                return mappingEntries.length === 0 && customEntries.length === 0 ? (
                  <p className="text-muted-foreground text-[13px]">
                    {t('proxy.routing.noMapping')}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                    <div className="text-muted-foreground grid grid-cols-3 gap-4 border-b border-white/[0.06] bg-white/[0.02] p-3 text-[11px] font-medium tracking-wider uppercase">
                      <div>{t('proxy.mapping.maps_to')}</div>
                      <div>{t('settings.modelMapping.targetGemini')}</div>
                      <div>Provider</div>
                    </div>
                    {mappingEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="grid grid-cols-3 items-center gap-4 border-b border-white/[0.06] p-3 last:border-0"
                      >
                        <div className="font-mono text-xs">{key}</div>
                        <div className="font-mono text-xs">{value}</div>
                        <Badge variant="secondary">Anthropic</Badge>
                      </div>
                    ))}
                    {customEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="grid grid-cols-3 items-center gap-4 border-b border-white/[0.06] p-3 last:border-0"
                      >
                        <div className="font-mono text-xs">{key}</div>
                        <div className="font-mono text-xs">{value}</div>
                        <Badge variant="outline">Custom</Badge>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Upstream Proxy Status */}
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <CardTitle>{t('proxy.routing.upstreamProxy')}</CardTitle>
              <CardDescription>{t('proxy.routing.upstreamProxy')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] p-3">
                <span className="text-muted-foreground text-[13px]">
                  {t('proxy.routing.status')}
                </span>
                <Badge variant={proxyConfig.upstream_proxy?.enabled ? 'default' : 'secondary'}>
                  {proxyConfig.upstream_proxy?.enabled
                    ? t('proxy.routing.enabled')
                    : t('proxy.routing.disabled')}
                </Badge>
              </div>
              {proxyConfig.upstream_proxy?.enabled && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] p-3">
                  <span className="text-muted-foreground text-[13px]">
                    {t('proxy.routing.url')}
                  </span>
                  <span className="font-mono text-xs">
                    {proxyConfig.upstream_proxy?.url || '—'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Docs Tab */}
        <TabsContent value="api-docs" className="space-y-5">
          <Card className="bg-card border border-white/[0.06] shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code size={20} />
                {t('proxy.examples.title')}
              </CardTitle>
              <CardDescription>{t('proxy.examples.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compact Protocol Selector */}
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedProtocol === 'openai' ? 'default' : 'outline'}
                  onClick={() => setSelectedProtocol('openai')}
                >
                  {t('settings.examples.openai_protocol')}
                </Button>
                <Button
                  variant={selectedProtocol === 'anthropic' ? 'default' : 'outline'}
                  onClick={() => setSelectedProtocol('anthropic')}
                >
                  {t('settings.examples.anthropic_protocol')}
                </Button>
              </div>

              {/* Model Selector & Copy API ID */}
              <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Label className="text-[13px] font-medium">
                    Model{' '}
                    <span className="text-muted-foreground ml-1 font-normal">
                      ({availableModelIds.length} available)
                    </span>
                  </Label>
                  <Select value={activeModelTab} onValueChange={setActiveModelTab}>
                    <SelectTrigger className="h-9 w-[280px] font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedModels).map(([provider, models]) => {
                        if (models.length === 0) return null;
                        return (
                          <SelectGroup key={provider}>
                            <SelectLabel className="text-muted-foreground text-xs font-bold">
                              {provider}
                            </SelectLabel>
                            {models.map((modelId) => (
                              <SelectItem
                                key={modelId}
                                value={modelId}
                                className="font-mono text-xs"
                              >
                                {modelId}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(activeModelTab)}
                  className="h-9 text-xs"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy API Name
                </Button>
              </div>

              {/* Collapsible Code Examples */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium">Code Examples</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allOpen = showCurl && showPython;
                      setShowCurl(!allOpen);
                      setShowPython(!allOpen);
                    }}
                  >
                    {showCurl && showPython ? 'Collapse All' : 'Expand All'}
                  </Button>
                </div>

                {/* cURL */}
                <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                  <div
                    className="flex w-full cursor-pointer items-center justify-between p-3 text-[13px] font-medium transition-colors hover:bg-white/[0.02]"
                    onClick={() => setShowCurl(!showCurl)}
                  >
                    <span className="flex items-center gap-2">
                      <Terminal size={16} />
                      cURL
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getCurlExample(activeModelTab));
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      {showCurl ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {showCurl && (
                    <pre className="bg-card text-foreground/90 overflow-x-auto border-t border-white/[0.06] p-3 font-mono text-xs whitespace-pre-wrap">
                      {getCurlExample(activeModelTab)}
                    </pre>
                  )}
                </div>

                {/* Python */}
                <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                  <div
                    className="flex w-full cursor-pointer items-center justify-between p-3 text-[13px] font-medium transition-colors hover:bg-white/[0.02]"
                    onClick={() => setShowPython(!showPython)}
                  >
                    <span className="flex items-center gap-2">
                      <Code size={16} />
                      Python
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getPythonExample(activeModelTab));
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      {showPython ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {showPython && (
                    <pre className="bg-card text-foreground/90 overflow-x-auto border-t border-white/[0.06] p-3 font-mono text-xs whitespace-pre-wrap">
                      {getPythonExample(activeModelTab)}
                    </pre>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools">
          <ToolsTab availableModelIds={availableModelIds} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute('/proxy')({
  component: ProxyPage,
});
