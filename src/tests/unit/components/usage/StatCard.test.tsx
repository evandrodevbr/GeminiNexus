import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { StatCard } from '@/components/usage/StatCard';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';
import { vi, beforeAll, afterAll } from 'vitest';

describe('StatCard', () => {
  beforeAll(() => {
    vi.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (this: number) {
      return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });
  it('renders label and value', () => {
    renderWithProviders(
      <StatCard label="Total Tokens" value={12345} icon={Activity} />,
    );
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  it('renders string values correctly', () => {
    renderWithProviders(
      <StatCard label="Status" value="Active" icon={Zap} />,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('formats number values with locale string', () => {
    renderWithProviders(
      <StatCard label="Requests" value={1000000} icon={TrendingUp} />,
    );
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('shows skeleton when isLoading is true', () => {
    renderWithProviders(
      <StatCard label="Loading" value={0} icon={Users} isLoading />,
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not show skeleton when isLoading is false', () => {
    renderWithProviders(
      <StatCard label="Loaded" value={42} icon={Activity} isLoading={false} />,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('renders icon element', () => {
    renderWithProviders(
      <StatCard label="With Icon" value={100} icon={Zap} />,
    );
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithProviders(
      <StatCard label="Styled" value={1} icon={Activity} className="my-stat" />,
    );
    expect(screen.getByText('Styled').closest('[class*="border-border"]')).toHaveClass('my-stat');
  });

  it('applies default slate accent when accent prop is not provided', () => {
    const { container } = renderWithProviders(
      <StatCard label="Default Accent" value={1} icon={Activity} />,
    );
    const iconContainer = container.querySelector('.rounded-md');
    expect(iconContainer).toHaveClass('bg-slate-500/5');
  });

  it('applies blue accent', () => {
    const { container } = renderWithProviders(
      <StatCard label="Blue" value={1} icon={Activity} accent="blue" />,
    );
    const iconContainer = container.querySelector('.rounded-md');
    expect(iconContainer).toHaveClass('bg-blue-500/5');
  });

  it('applies green accent', () => {
    const { container } = renderWithProviders(
      <StatCard label="Green" value={1} icon={Activity} accent="green" />,
    );
    const iconContainer = container.querySelector('.rounded-md');
    expect(iconContainer).toHaveClass('bg-emerald-500/5');
  });

  it('applies amber accent', () => {
    const { container } = renderWithProviders(
      <StatCard label="Amber" value={1} icon={Activity} accent="amber" />,
    );
    const iconContainer = container.querySelector('.rounded-md');
    expect(iconContainer).toHaveClass('bg-amber-500/5');
  });

  it('applies purple accent', () => {
    const { container } = renderWithProviders(
      <StatCard label="Purple" value={1} icon={Activity} accent="purple" />,
    );
    const iconContainer = container.querySelector('.rounded-md');
    expect(iconContainer).toHaveClass('bg-purple-500/5');
  });

  it('has uppercase label styling', () => {
    renderWithProviders(
      <StatCard label="Uppercase Test" value={1} icon={Activity} />,
    );
    const label = screen.getByText('Uppercase Test');
    expect(label).toHaveClass('uppercase');
  });

  it('has mono font for value', () => {
    renderWithProviders(
      <StatCard label="Mono" value={999} icon={Activity} />,
    );
    const value = screen.getByText('999');
    expect(value).toHaveClass('font-mono');
  });
});
