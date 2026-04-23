import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueries } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { StatCard } from '@/components/usage/StatCard';
import { Loader2, Copy, CheckCircle, ShieldAlert, XCircle, Terminal, Code2, Braces } from 'lucide-react';

const IDE_CONFIGS = [
  { key: 'vscode', label: 'VS Code', icon: Code2 },
  { key: 'cursor', label: 'Cursor', icon: Terminal },
  { key: 'claude-code', label: 'Claude Code', icon: Braces },
] as const;

export const ToolsTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: parityData, isLoading: parityLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'parityCounters'],
    queryFn: () => ipc.client.proxyAdvanced.getParityCounters(),
    refetchInterval: 30000,
  });

  const ideQueries = useQueries({
    queries: [
      {
        queryKey: ['proxyAdvanced', 'ideConfig', 'vscode'],
        queryFn: () => ipc.client.proxyAdvanced.generateIdeConfig({ ide: 'vscode' }),
      },
      {
        queryKey: ['proxyAdvanced', 'ideConfig', 'cursor'],
        queryFn: () => ipc.client.proxyAdvanced.generateIdeConfig({ ide: 'cursor' }),
      },
    ],
  });

  const parity = parityData?.success ? parityData.data : undefined;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('proxy.advanced.tools.copyConfig') });
  };

  const getIdeInstructions = (key: string): string => {
    if (key === 'claude-code') {
      return 'export ANTHROPIC_BASE_URL=http://localhost:8045/v1\nexport ANTHROPIC_API_KEY=YOUR_API_KEY';
    }
    const index = key === 'vscode' ? 0 : 1;
    const result = ideQueries[index].data;
    if (result?.success && result.data) {
      const d = result.data;
      return `${d.instructions}\n${d.proxySetting}: http://localhost:8045\n${d.apiKeySetting}: YOUR_API_KEY`;
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
      <Card>
        <CardHeader>
          <CardTitle>{t('proxy.advanced.tools.ideSetup')}</CardTitle>
          <CardDescription>Quick configuration for popular IDEs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIdeLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            IDE_CONFIGS.map(({ key, label, icon: Icon }) => {
              const instructions = getIdeInstructions(key);
              return (
                <div key={key} className="rounded-lg border">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => copyToClipboard(instructions)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {t('proxy.advanced.tools.copyConfig')}
                    </Button>
                  </div>
                  {instructions && (
                    <pre className="overflow-x-auto border-t bg-gray-900 p-3 font-mono text-xs whitespace-pre-wrap text-gray-100">
                      {instructions}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

    </div>
  );
};
