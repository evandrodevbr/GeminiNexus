import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { ChartCard } from '@/components/usage/ChartCard';

describe('ChartCard', () => {
  const defaultProps = {
    isLoading: false,
    error: null,
    isEmpty: false,
    onRetry: vi.fn(),
    title: 'Test Chart',
    emptyTitle: 'No Data',
    emptyDescription: 'There is no data to display.',
    errorMessage: 'Failed to load chart.',
    retryLabel: 'Retry',
    children: <div data-testid="chart-content">Chart Content</div>,
  };

  it('renders loading state with skeleton', () => {
    renderWithProviders(
      <ChartCard {...defaultProps} isLoading={true} />,
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
  });

  it('renders error state with retry button and calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ChartCard
        {...defaultProps}
        error={new Error('Network error')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Failed to load chart.')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state with title and description', () => {
    renderWithProviders(
      <ChartCard {...defaultProps} isEmpty={true} />,
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(
      screen.getByText('There is no data to display.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
  });

  it('renders children when not loading, error, or empty', () => {
    renderWithProviders(<ChartCard {...defaultProps} />);

    expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    expect(screen.getByText('Chart Content')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('prioritizes loading over error state', () => {
    renderWithProviders(
      <ChartCard
        {...defaultProps}
        isLoading={true}
        error={new Error('Some error')}
      />,
    );

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load chart.')).not.toBeInTheDocument();
  });

  it('prioritizes error over empty state', () => {
    renderWithProviders(
      <ChartCard
        {...defaultProps}
        error={new Error('Some error')}
        isEmpty={true}
      />,
    );

    expect(screen.getByText('Failed to load chart.')).toBeInTheDocument();
    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
  });
});
