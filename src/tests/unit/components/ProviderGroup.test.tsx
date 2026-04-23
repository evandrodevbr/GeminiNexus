import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { ProviderGroup } from '@/components/ProviderGroup';
import type { ProviderStats } from '@/utils/provider-grouping';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && 'count' in options) {
        return `${key} (${options.count})`;
      }
      return key;
    },
  }),
}));

describe('ProviderGroup', () => {
  const createMockStats = (overrides?: Partial<ProviderStats>): ProviderStats => ({
    providerKey: 'gemini-',
    providerInfo: {
      name: 'Gemini',
      company: 'Google',
      color: '#4285F4',
    },
    models: [
      { id: 'models/gemini-pro', percentage: 75, resetTime: '2026-04-24T00:00:00Z' },
      { id: 'models/gemini-ultra', percentage: 50, resetTime: '2026-04-24T00:00:00Z' },
    ],
    visibleModels: [
      { id: 'models/gemini-pro', percentage: 75, resetTime: '2026-04-24T00:00:00Z' },
      { id: 'models/gemini-ultra', percentage: 50, resetTime: '2026-04-24T00:00:00Z' },
    ],
    avgPercentage: 62.5,
    earliestReset: '2026-04-24T00:00:00Z',
    ...overrides,
  });

  const defaultProps = {
    stats: createMockStats(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    getQuotaTextColorClass: (percentage: number) =>
      percentage > 50 ? 'text-green-500' : 'text-yellow-500',
    getQuotaBarColorClass: (percentage: number) =>
      percentage > 50 ? 'bg-green-500' : 'bg-yellow-500',
    formatQuotaLabel: (percentage: number) => `${percentage}%`,
    formatResetTimeLabel: (resetTime?: string) => (resetTime ? '24h' : '—'),
    formatResetTimeTitle: (resetTime?: string) =>
      resetTime ? new Date(resetTime).toLocaleString() : undefined,
    leftLabel: 'left',
  };

  it('renders provider name', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} />);
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  it('displays model count', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} />);
    expect(
      screen.getByText(/settings\.providerGroupings\.models/),
    ).toBeInTheDocument();
  });

  it('shows quota bars and average percentage', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} />);
    expect(screen.getByText('62.5%')).toBeInTheDocument();
    expect(screen.getByText('settings.providerGroupings.avgLabel')).toBeInTheDocument();
  });

  it('shows reset time label', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} />);
    expect(screen.getAllByText('24h').length).toBeGreaterThanOrEqual(1);
  });

  it('shows individual model rows when expanded', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={false} />);
    expect(screen.getByText('gemini-pro')).toBeInTheDocument();
    expect(screen.getByText('gemini-ultra')).toBeInTheDocument();
  });

  it('hides individual model rows when collapsed', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText('gemini-pro')).not.toBeInTheDocument();
    expect(screen.queryByText('gemini-ultra')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when header button is clicked', () => {
    const onToggleCollapse = vi.fn();
    renderWithProviders(
      <ProviderGroup {...defaultProps} onToggleCollapse={onToggleCollapse} />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders color dot with provider color', () => {
    const { container } = renderWithProviders(
      <ProviderGroup {...defaultProps} />,
    );
    const dot = container.querySelector('span[style*="background-color"]');
    expect(dot).toHaveAttribute('style', expect.stringContaining('#4285F4'));
  });

  it('shows chevron right when collapsed', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={true} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows chevron down when expanded', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={false} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing when visibleModels is empty', () => {
    const { container } = renderWithProviders(
      <ProviderGroup
        {...defaultProps}
        stats={createMockStats({ visibleModels: [] })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays model-specific percentages in expanded rows', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={false} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows leftLabel next to model percentages when percentage > 0', () => {
    renderWithProviders(<ProviderGroup {...defaultProps} isCollapsed={false} />);
    const leftLabels = screen.getAllByText('left');
    expect(leftLabels.length).toBe(2);
  });
});
