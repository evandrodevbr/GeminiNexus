// Costs in USD per 1M tokens
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.1-pro': { input: 1.25, output: 5.0 },
  'gemini-3.1-pro-preview': { input: 1.25, output: 5.0 },
  'gemini-3-flash': { input: 0.075, output: 0.3 },
  'claude-3-5-sonnet': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  // fallback for unknowns
  default: { input: 1.0, output: 4.0 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  customPricing?: Record<string, { input: number; output: number }>,
): number {
  // Check custom pricing first
  if (customPricing && customPricing[model]) {
    const cp = customPricing[model];
    return (inputTokens / 1_000_000) * cp.input + (outputTokens / 1_000_000) * cp.output;
  }

  // Normalize model name roughly for default matching
  const normalizedModel = model.toLowerCase().replace('models/', '');
  let pricing = MODEL_PRICING['default'];

  for (const [key, value] of Object.entries(MODEL_PRICING)) {
    if (normalizedModel.includes(key)) {
      pricing = value;
      break;
    }
  }

  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}
