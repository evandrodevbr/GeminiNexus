import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCost } from '@/constants/pricing';

export interface ModelCostEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface CostReportCardProps {
  models: ModelCostEntry[];
  totalInputCost: number;
  totalOutputCost: number;
  totalCost: number;
  isLoading: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export const CostReportCard: React.FC<CostReportCardProps> = ({
  models,
  totalInputCost,
  totalOutputCost,
  totalCost,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cost Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
            Loading cost data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!models.length) {
    return (
      <Card className="bg-card/50 border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cost Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
            No usage data for cost calculation
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Cost Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-white/[0.06]">
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 text-right font-medium">Input Tokens</th>
                <th className="py-2 pr-4 text-right font-medium">Input Cost</th>
                <th className="py-2 pr-4 text-right font-medium">Output Tokens</th>
                <th className="py-2 pr-4 text-right font-medium">Output Cost</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {models.map((m) => (
                <tr key={m.model} className="hover:bg-white/[0.02]">
                  <td className="text-foreground py-2 pr-4">{m.model}</td>
                  <td className="text-muted-foreground py-2 pr-4 text-right font-mono">
                    {formatNumber(m.inputTokens)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-emerald-400">
                    ${m.inputCost.toFixed(2)}
                  </td>
                  <td className="text-muted-foreground py-2 pr-4 text-right font-mono">
                    {formatNumber(m.outputTokens)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-emerald-400">
                    ${m.outputCost.toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-mono font-medium text-emerald-500">
                    ${m.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.08] font-medium">
                <td className="text-foreground py-3 pr-4">Total</td>
                <td className="text-muted-foreground py-3 pr-4 text-right font-mono">
                  {formatNumber(models.reduce((sum, m) => sum + m.inputTokens, 0))}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-emerald-400">
                  ${totalInputCost.toFixed(2)}
                </td>
                <td className="text-muted-foreground py-3 pr-4 text-right font-mono">
                  {formatNumber(models.reduce((sum, m) => sum + m.outputTokens, 0))}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-emerald-400">
                  ${totalOutputCost.toFixed(2)}
                </td>
                <td className="py-3 text-right font-mono font-bold text-emerald-500">
                  ${totalCost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
