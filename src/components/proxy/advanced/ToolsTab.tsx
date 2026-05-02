import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueries } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { StatCard } from '@/components/usage/StatCard';
import {
  Loader2,
  Copy,
  CheckCircle,
  ShieldAlert,
  XCircle,
  Terminal,
  Code2,
  Braces,
  Sparkles,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const IDE_CONFIGS = [
  { key: 'opencode', label: 'OpenCode', icon: Sparkles },
  { key: 'vscode', label: 'VS Code', icon: Code2 },
  { key: 'cursor', label: 'Cursor', icon: Terminal },
  { key: 'claude-code', label: 'Claude Code', icon: Braces },
] as const;

interface ToolsTabProps {
  availableModelIds?: string[];
}

export const ToolsTab: React.FC<ToolsTabProps> = ({
  availableModelIds = ['gemini-3.1-pro-high'],
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>(availableModelIds[0]);

  const { data: parityData, isLoading: parityLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'parityCounters'],
    queryFn: () => ipc.client.proxyAdvanced.getParityCounters(),
    refetchInterval: 30000,
  });

  const ideQueries = useQueries({
    queries: IDE_CONFIGS.map(({ key }) => ({
      queryKey: ['proxyAdvanced', 'ideConfig', key, selectedModel],
      queryFn: () =>
        ipc.client.proxyAdvanced.generateIdeConfig({ ide: key, defaultModel: selectedModel }),
    })),
  });

  const parity = parityData?.success ? parityData.data : undefined;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('proxy.advanced.tools.copyConfig') });
  };

  const getIdeInstructions = (key: string, index: number): string => {
    if (key === 'claude-code') {
      return 'export ANTHROPIC_BASE_URL=http://localhost:8045/v1\nexport ANTHROPIC_API_KEY=YOUR_API_KEY';
    }
    const result = ideQueries[index]?.data;
    if (result?.success && result.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = result.data as any;
      if (d.format === 'json') {
        return JSON.stringify(d.content, null, 2);
      }
      if (d.format === 'env' || d.format === 'shell') {
        return typeof d.content === 'string' ? d.content : JSON.stringify(d.content, null, 2);
      }
      return `${d.instructions || ''}\n${d.proxySetting || 'URL'}: http://localhost:8045\n${d.apiKeySetting || 'Key'}: YOUR_API_KEY`;
    }
    return '';
  };

  const isIdeLoading = ideQueries.some((q) => q.isLoading);

  return (
    <div className="space-y-5">
      {/* Parity Counters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('proxy.advanced.tools.totalRequests')}
          value={parity?.totalRequests ?? 0}
          icon={CheckCircle}
          isLoading={parityLoading}
          accent="blue"
        />
        <StatCard
          label={t('proxy.advanced.tools.matchedRequests')}
          value={parity?.matchedRequests ?? 0}
          icon={ShieldAlert}
          isLoading={parityLoading}
          accent="green"
        />
        <StatCard
          label={t('proxy.advanced.tools.parityViolations')}
          value={parity?.parityViolations ?? 0}
          icon={XCircle}
          isLoading={parityLoading}
          accent="amber"
        />
      </div>

      {/* IDE Quick Setup */}
      <div className="bg-card overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="space-y-1">
            <h4 className="text-[13px] font-semibold">{t('proxy.advanced.tools.ideSetup')}</h4>
            <p className="text-muted-foreground text-xs">Quick configuration for popular IDEs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Default Model:</span>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModelIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {isIdeLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            IDE_CONFIGS.map(({ key, label, icon: Icon }, index) => {
              const instructions = getIdeInstructions(key, index);
              const resultData = ideQueries[index]?.data;
              const hasError = resultData && !resultData.success;
              const errorMsg = resultData?.error || '';

              return (
                <div key={key} className="overflow-hidden rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="text-muted-foreground h-4 w-4" />
                      <span className="text-[13px] font-medium">{label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => copyToClipboard(instructions)}
                      disabled={!instructions || hasError}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {t('proxy.advanced.tools.copyConfig')}
                    </Button>
                  </div>
                  {hasError && (
                    <div className="bg-card border-t border-white/[0.06] p-3 font-mono text-xs text-amber-500/80">
                      {errorMsg}
                    </div>
                  )}
                  {instructions && !hasError && (
                    <pre className="bg-card text-foreground/90 overflow-x-auto border-t border-white/[0.06] p-3 font-mono text-xs whitespace-pre-wrap">
                      {instructions}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
