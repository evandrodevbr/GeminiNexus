import type { PartialTheme } from '@nivo/theming';

export const nivoTheme: PartialTheme = {
  background: 'transparent',
  text: {
    fontFamily: "Geist, 'Microsoft YaHei', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif",
    fontSize: 11,
    fill: '#b8b8b8',
  },
  axis: {
    domain: {
      line: {
        stroke: 'rgba(255,255,255,0.1)',
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: 'transparent',
        strokeWidth: 0,
      },
      text: {
        fontFamily: "Geist, 'Microsoft YaHei', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif",
        fontSize: 11,
        fill: '#b8b8b8',
      },
    },
    legend: {
      text: {
        fontFamily: "Geist, 'Microsoft YaHei', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif",
        fontSize: 12,
        fill: '#b8b8b8',
      },
    },
  },
  grid: {
    line: {
      stroke: 'rgba(255,255,255,0.06)',
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
  },
  legends: {
    text: {
      fontFamily: "Geist, 'Microsoft YaHei', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif",
      fontSize: 12,
      fill: '#b8b8b8',
    },
  },
  tooltip: {
    container: {
      background: '#2e2e2e',
      color: '#fff',
      fontFamily: "Geist, 'Microsoft YaHei', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif",
      fontSize: 12,
      borderRadius: 6,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '8px 12px',
    },
  },
};
