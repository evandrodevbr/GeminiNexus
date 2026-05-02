import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { MODEL_PRICING } from '@/constants/pricing';

export interface ModelPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customPricing: Record<string, { input: number; output: number; source?: string }>;
  onSavePricing: (
    pricing: Record<string, { input: number; output: number; source: string }>,
  ) => void;
  availableModels: string[];
}

export const ModelPricingDialog: React.FC<ModelPricingDialogProps> = ({
  open,
  onOpenChange,
  customPricing,
  onSavePricing,
  availableModels,
}) => {
  const [localPricing, setLocalPricing] = useState<
    Record<string, { input: number; output: number; source: string }>
  >({});
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (open) {
      // Initialize local state with custom pricing or empty if default
      const initial: Record<string, { input: number; output: number; source: string }> = {};
      Object.entries(customPricing || {}).forEach(([model, price]) => {
        initial[model] = {
          input: price.input,
          output: price.output,
          source: price.source || 'Custom',
        };
      });
      setLocalPricing(initial);
    }
  }, [open, customPricing]);

  const handlePriceChange = (model: string, type: 'input' | 'output', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') return;

    setLocalPricing((prev) => {
      const current = prev[model] || {
        input: getBasePrice(model, 'input'),
        output: getBasePrice(model, 'output'),
        source: 'Default',
      };

      return {
        ...prev,
        [model]: {
          ...current,
          [type]: value === '' ? 0 : numValue,
          source: 'Custom',
        },
      };
    });
  };

  const handleReset = (model: string) => {
    setLocalPricing((prev) => {
      const next = { ...prev };
      delete next[model];
      return next;
    });
  };

  const getBasePrice = (model: string, type: 'input' | 'output'): number => {
    const normalizedModel = model.toLowerCase().replace('models/', '');
    let pricing = MODEL_PRICING['default'];

    for (const [key, value] of Object.entries(MODEL_PRICING)) {
      if (normalizedModel.includes(key)) {
        pricing = value;
        break;
      }
    }

    return pricing[type];
  };

  const getDisplayPrice = (model: string, type: 'input' | 'output'): number | string => {
    if (localPricing[model]) {
      return localPricing[model][type];
    }
    return ''; // Show empty to display placeholder
  };

  const getSource = (model: string) => {
    if (localPricing[model]) {
      return localPricing[model].source;
    }
    return 'Default';
  };

  const fetchOpenRouterPricing = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const data = await response.json();

      if (data && data.data) {
        const newPricing = { ...localPricing };

        // Try to match available models with OpenRouter models
        availableModels.forEach((model) => {
          // Simplistic matching - OpenRouter models often have provider prefixes
          const orModel = data.data.find(
            (m: any) =>
              m.id.endsWith(model) || m.id.includes(model) || model.includes(m.id.split('/').pop()),
          );

          if (orModel && orModel.pricing) {
            // OpenRouter pricing is per token, we need per 1M tokens
            const inputPrice = parseFloat(orModel.pricing.prompt) * 1_000_000;
            const outputPrice = parseFloat(orModel.pricing.completion) * 1_000_000;

            if (!isNaN(inputPrice) && !isNaN(outputPrice)) {
              newPricing[model] = {
                input: Number(inputPrice.toFixed(4)),
                output: Number(outputPrice.toFixed(4)),
                source: 'OpenRouter',
              };
            }
          }
        });

        setLocalPricing(newPricing);
      }
    } catch (error) {
      console.error('Failed to fetch OpenRouter pricing:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    onSavePricing(localPricing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Model Pricing Configuration</DialogTitle>
          <DialogDescription>
            Set custom pricing per model (USD per 1M tokens). These values are used to calculate
            cost estimates.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOpenRouterPricing}
            disabled={isFetching}
            className="h-8 text-xs"
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Fetch from OpenRouter
          </Button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto rounded-md border pr-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="w-[120px] px-4 py-3 font-medium">Input Price</th>
                <th className="w-[120px] px-4 py-3 font-medium">Output Price</th>
                <th className="w-[100px] px-4 py-3 font-medium">Source</th>
                <th className="w-[60px] px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {availableModels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                    No models have been used yet.
                  </td>
                </tr>
              ) : (
                availableModels.map((model) => {
                  const source = getSource(model);
                  return (
                    <tr key={model} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{model}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={getBasePrice(model, 'input').toString()}
                          value={getDisplayPrice(model, 'input')}
                          onChange={(e) => handlePriceChange(model, 'input', e.target.value)}
                          className="h-8 font-mono text-xs"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={getBasePrice(model, 'output').toString()}
                          value={getDisplayPrice(model, 'output')}
                          onChange={(e) => handlePriceChange(model, 'output', e.target.value)}
                          className="h-8 font-mono text-xs"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={source === 'Default' ? 'outline' : 'secondary'}
                          className={`text-[10px] ${
                            source === 'Custom'
                              ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                              : source === 'OpenRouter'
                                ? 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                                : ''
                          }`}
                        >
                          {source}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {source !== 'Default' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-6 w-6"
                            onClick={() => handleReset(model)}
                            title="Reset to default"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
