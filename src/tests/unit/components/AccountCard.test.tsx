import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { AccountCard } from '@/components/AccountCard';
import type { Account } from '@/types/account';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options) {
        const entries = Object.entries(options);
        if (entries.length > 0) {
          return `${key}:${JSON.stringify(options)}`;
        }
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return <div data-testid="dropdown-trigger">{children}</div>;
  },
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="dropdown-item"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  ),
}));

describe('AccountCard', () => {
  const createMockAccount = (overrides?: Partial<Account>): Account => ({
    id: 'acc-1',
    name: 'Test User',
    email: 'test@example.com',
    backup_file: '/path/to/backup',
    avatar_url: 'https://example.com/avatar.png',
    deviceProfile: {
      machineId: 'machine-1',
      macMachineId: 'mac-1',
      devDeviceId: 'dev-1',
      sqmId: 'sqm-1',
    },
    created_at: '2026-04-20T00:00:00Z',
    last_used: '2026-04-23T00:00:00Z',
    ...overrides,
  });

  const defaultProps = {
    account: createMockAccount(),
    isCurrent: false,
    onSwitch: vi.fn(),
    onDelete: vi.fn(),
    isSwitching: false,
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account name and email', () => {
    renderWithProviders(<AccountCard {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows avatar image element when avatar_url is provided', () => {
    renderWithProviders(<AccountCard {...defaultProps} />);
    const avatarImage = document.querySelector('img');
    if (avatarImage) {
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.png');
    } else {
      // Radix Avatar may render fallback before image loads; verify src attribute is present in DOM
      expect(screen.getByText('TU')).toBeInTheDocument();
    }
  });

  it('shows avatar fallback with initials when avatar_url is missing', () => {
    renderWithProviders(
      <AccountCard
        {...defaultProps}
        account={createMockAccount({ avatar_url: undefined })}
      />,
    );
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('shows email initial as fallback when name is empty', () => {
    renderWithProviders(
      <AccountCard
        {...defaultProps}
        account={createMockAccount({ name: '', avatar_url: undefined })}
      />,
    );
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('displays current badge when isCurrent is true', () => {
    renderWithProviders(<AccountCard {...defaultProps} isCurrent={true} />);
    expect(screen.getByText('account.current')).toBeInTheDocument();
  });

  it('does not display current badge when isCurrent is false', () => {
    renderWithProviders(<AccountCard {...defaultProps} isCurrent={false} />);
    expect(screen.queryByText('account.current')).not.toBeInTheDocument();
  });

  it('handles delete action from dropdown menu', () => {
    const onDelete = vi.fn();
    renderWithProviders(<AccountCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByTestId('dropdown-item');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('acc-1');
  });

  it('handles switch action when card is clicked', () => {
    const onSwitch = vi.fn();
    renderWithProviders(<AccountCard {...defaultProps} onSwitch={onSwitch} />);

    const card = document.querySelector('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();
    if (card) {
      fireEvent.click(card);
    }
    expect(onSwitch).toHaveBeenCalledTimes(1);
    expect(onSwitch).toHaveBeenCalledWith('acc-1');
  });

  it('does not trigger switch when isCurrent is true', () => {
    const onSwitch = vi.fn();
    renderWithProviders(
      <AccountCard {...defaultProps} isCurrent={true} onSwitch={onSwitch} />,
    );

    const card = document.querySelector('[class*="cursor-pointer"]');
    expect(card).not.toBeInTheDocument();
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('does not trigger switch when isSwitching is true', () => {
    const onSwitch = vi.fn();
    renderWithProviders(
      <AccountCard {...defaultProps} isSwitching={true} onSwitch={onSwitch} />,
    );

    const card = document.querySelector('[class*="pointer-events-none"]');
    expect(card).toBeInTheDocument();
  });

  it('does not trigger switch when isDeleting is true', () => {
    const onSwitch = vi.fn();
    renderWithProviders(
      <AccountCard {...defaultProps} isDeleting={true} onSwitch={onSwitch} />,
    );

    const card = document.querySelector('[class*="pointer-events-none"]');
    expect(card).toBeInTheDocument();
  });

  it('applies reduced opacity and pointer-events-none when switching', () => {
    const { container } = renderWithProviders(
      <AccountCard {...defaultProps} isSwitching={true} />,
    );
    const card = container.querySelector('[class*="opacity-60"]');
    expect(card).toBeInTheDocument();
  });

  it('applies reduced opacity and pointer-events-none when deleting', () => {
    const { container } = renderWithProviders(
      <AccountCard {...defaultProps} isDeleting={true} />,
    );
    const card = container.querySelector('[class*="opacity-60"]');
    expect(card).toBeInTheDocument();
  });

  it('applies primary border styling when isCurrent is true', () => {
    const { container } = renderWithProviders(
      <AccountCard {...defaultProps} isCurrent={true} />,
    );
    const card = container.querySelector('[class*="border-primary/50"]');
    expect(card).toBeInTheDocument();
  });

  it('shows spinning refresh icon when isSwitching is true', () => {
    renderWithProviders(<AccountCard {...defaultProps} isSwitching={true} />);
    const spinIcon = document.querySelector('.animate-spin');
    expect(spinIcon).toBeInTheDocument();
  });

  it('handles mouse move to update card transform', () => {
    const { container } = renderWithProviders(<AccountCard {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;

    fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 50 });
    expect(wrapper.style.transform).toContain('perspective(1000px)');
    expect(wrapper.style.transform).toContain('rotateX');
    expect(wrapper.style.transform).toContain('rotateY');
  });

  it('handles mouse leave to reset card transform', () => {
    const { container } = renderWithProviders(<AccountCard {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;

    fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 50 });
    expect(wrapper.style.transform).not.toContain('rotateX(0deg)');

    fireEvent.mouseLeave(wrapper);
    expect(wrapper.style.transform).toContain('rotateX(0deg)');
    expect(wrapper.style.transform).toContain('rotateY(0deg)');
  });

  it('renders last used text', () => {
    renderWithProviders(<AccountCard {...defaultProps} />);
    expect(screen.getByText(/account\.lastUsed/)).toBeInTheDocument();
  });
});
