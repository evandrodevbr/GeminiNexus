/** Premium chart palette — refined for dark mode contrast */
export const COLOR_PROMPT = '#60a5fa';   // blue-400
export const COLOR_COMPLETION = '#34d399'; // emerald-400
export const COLOR_TOTAL = '#fbbf24';      // amber-400

export const PIE_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6',
  '#38bdf8', '#4ade80', '#facc15', '#c084fc',
];

export const MODEL_COLORS: Record<string, string> = {
  'gemini-3-flash': '#60a5fa',
  'gemini-3.1-pro-low': '#818cf8',
  'gemini-3.1-pro-high': '#a78bfa',
  'claude-sonnet-4-6-thinking': '#f472b6',
  'claude-opus-4-6-thinking': '#fb7185',
};

const colorMap: Record<string, string> = {
  Prompt: COLOR_PROMPT,
  Completion: COLOR_COMPLETION,
  Total: COLOR_TOTAL,
};

export function BarTooltip({ indexValue, data }: any) {
  const keys = Object.keys(data).filter((k: string) => k !== 'name' && colorMap[k]);

  return (
    <div className="bg-popover rounded-lg border border-white/[0.06] px-3 py-2 shadow-md">
      <p className="text-foreground mb-1.5 text-xs font-medium">{indexValue}</p>
      <div className="flex flex-col gap-1">
        {keys.map((key: string) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorMap[key] }}
            />
            <span className="text-muted-foreground">{key}:</span>
            <span className="text-foreground font-mono font-medium">
              {typeof data[key] === 'number' ? data[key].toLocaleString() : data[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieTooltip({ datum }: any) {
  return (
    <div className="bg-popover rounded-lg border border-white/[0.06] px-3 py-2 shadow-md">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: datum.color }}
        />
        <span className="text-muted-foreground">{datum.id}:</span>
        <span className="text-foreground font-mono font-medium">
          {typeof datum.value === 'number' ? datum.value.toLocaleString() : datum.value}
        </span>
      </div>
    </div>
  );
}

export function LineTooltip({ point }: any) {
  return (
    <div className="bg-popover rounded-lg border border-white/[0.06] px-3 py-2 shadow-md">
      <p className="text-foreground mb-1 text-xs font-medium">{point.data.xFormatted ?? point.data.x}</p>
      <div className="flex items-center gap-2 text-xs">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: point.serieColor }}
        />
        <span className="text-muted-foreground">{point.serieId}:</span>
        <span className="text-foreground font-mono font-medium">
          {typeof point.data.y === 'number' ? point.data.y.toLocaleString() : point.data.y}
        </span>
      </div>
    </div>
  );
}
