import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders an input element', () => {
    renderWithProviders(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts and displays text value', () => {
    renderWithProviders(<Input />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(input).toHaveValue('Hello world');
  });

  it('supports different input types', () => {
    const { rerender } = renderWithProviders(<Input type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
  });

  it('supports disabled state', () => {
    renderWithProviders(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    renderWithProviders(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    renderWithProviders(<Input className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('handles focus and blur events', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    renderWithProviders(<Input onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('has expected base styling classes', () => {
    const { container } = renderWithProviders(<Input />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('rounded-lg');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('bg-muted/50');
  });
});
