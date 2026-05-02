import type { PartialTheme } from '@nivo/theming';

/**
 * Nivo chart theme aligned with Gemini Nexus design system.
 * Uses Inter font family and refined dark palette.
 */
export const nivoTheme: PartialTheme = {
  background: 'transparent',
  text: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 11,
    fill: '#6b7280',
  },
  axis: {
    domain: {
      line: {
        stroke: 'rgba(255,255,255,0.06)',
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: 'transparent',
        strokeWidth: 0,
      },
      text: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fill: '#6b7280',
      },
    },
    legend: {
      text: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        fill: '#6b7280',
      },
    },
  },
  grid: {
    line: {
      stroke: 'rgba(255,255,255,0.04)',
      strokeWidth: 1,
    },
  },
  legends: {
    text: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      fill: '#6b7280',
    },
  },
  tooltip: {
    container: {
      background: '#16161e',
      color: '#e8eaed',
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
      padding: '8px 12px',
    },
  },
};
