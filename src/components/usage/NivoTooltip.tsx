export const COLOR_PROMPT = '#5b9bd5';
export const COLOR_COMPLETION = '#70ad47';
export const COLOR_TOTAL = '#a5a5a5';
export const PIE_COLORS = [
  '#5b9bd5',
  '#ed7d31',
  '#70ad47',
  '#a5a5a5',
  '#ffc000',
  '#4472c4',
  '#91d1c2',
  '#c55a5a',
];

const colorMap: Record<string, string> = {
  Prompt: COLOR_PROMPT,
  Completion: COLOR_COMPLETION,
  Total: COLOR_TOTAL,
};

export function BarTooltip({ indexValue, data }: any) {
  const keys = Object.keys(data).filter((k: string) => k !== 'name' && colorMap[k]);

  return (
    <div className="bg-popover border-border rounded-md border px-3 py-2 shadow-md">
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
    <div className="bg-popover border-border rounded-md border px-3 py-2 shadow-md">
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
