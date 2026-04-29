import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/tests/unit/test-utils';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default variant and size', () => {
    renderWithProviders(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('renders all variant styles', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
    variants.forEach((variant) => {
      const { container } = renderWithProviders(
        <Button variant={variant}>{variant}</Button>,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  it('renders all size styles', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;
    sizes.forEach((size) => {
      const { container } = renderWithProviders(
        <Button size={size}>{size}</Button>,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders as child element when asChild is true', () => {
    renderWithProviders(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies custom className', () => {
    renderWithProviders(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('buttonVariants function returns expected classes for default variant', () => {
    const classes = buttonVariants({ variant: 'default', size: 'default' });
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
  });

  it('buttonVariants function returns expected classes for destructive variant', () => {
    const classes = buttonVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-destructive');
  });
});
