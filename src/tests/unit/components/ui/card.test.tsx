import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/tests/unit/test-utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders Card with content', () => {
    renderWithProviders(
      <Card data-testid="card">
        <span>Card content</span>
      </Card>,
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className to Card', () => {
    renderWithProviders(<Card className="my-card">Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('my-card');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    renderWithProviders(<Card ref={ref}>Ref test</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders header with title and description', () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('CardTitle renders as h3', () => {
    renderWithProviders(<CardTitle>Heading</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heading');
  });

  it('CardDescription has correct text styling classes', () => {
    const { container } = renderWithProviders(<CardDescription>Desc</CardDescription>);
    expect(container.querySelector('p')).toHaveClass('text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('renders content area', () => {
    renderWithProviders(
      <Card>
        <CardContent>Main content</CardContent>
      </Card>,
    );
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders footer with actions', () => {
    renderWithProviders(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Full Card composition', () => {
  it('renders complete card with all sections', () => {
    renderWithProviders(
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Account Stats</CardTitle>
          <CardDescription>Overview of usage</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Tokens used: 1,234</p>
        </CardContent>
        <CardFooter>
          <span>Last updated: now</span>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: /account stats/i })).toBeInTheDocument();
    expect(screen.getByText(/overview of usage/i)).toBeInTheDocument();
    expect(screen.getByText(/tokens used/i)).toBeInTheDocument();
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});
