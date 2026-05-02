import React, { useRef } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { StatusBar } from '@/components/StatusBar';
import { LayoutDashboard, Settings, Network, RefreshCw, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from 'react-error-boundary';
import { useToast } from '@/components/ui/use-toast';
import { getLocalizedErrorMessage } from '@/utils/errorMessages';
import iconPng from '@/assets/icon.png';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const hasShownRouteErrorToastRef = useRef(false);

  const navItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: t('nav.accounts'),
    },
    {
      to: '/usage',
      icon: BarChart3,
      label: t('nav.usage'),
    },
    {
      to: '/proxy',
      icon: Network,
      label: t('nav.proxy'),
    },
    {
      to: '/settings',
      icon: Settings,
      label: t('nav.settings'),
    },
  ];

  return (
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center border-b border-white/[0.06] px-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent">
            <img src={iconPng} alt="Gemini Nexus Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-[15px] font-semibold tracking-tight whitespace-nowrap">
            Gemini Nexus
          </h1>
        </div>

        <nav className="mx-6 flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-foreground bg-white/[0.08]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
                )}
              >
                <item.icon className="h-[16px] w-[16px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0">
          <StatusBar />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <ErrorBoundary
          resetKeys={[location.pathname]}
          onReset={() => {
            hasShownRouteErrorToastRef.current = false;
          }}
          onError={(error) => {
            if (hasShownRouteErrorToastRef.current) {
              return;
            }

            toast({
              title: t('error.generic'),
              description: getLocalizedErrorMessage(error, t),
              variant: 'destructive',
            });
            hasShownRouteErrorToastRef.current = true;
          }}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="mx-auto max-w-3xl p-6">
              <div className="rounded-xl border border-dashed border-white/[0.06] p-8 text-center">
                <div className="text-sm font-semibold">{t('error.generic')}</div>
                <div className="text-muted-foreground mt-2 text-xs">{t('action.retry')}</div>
                <Button className="mt-4" variant="outline" onClick={resetErrorBoundary}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('action.retry')}
                </Button>
              </div>
            </div>
          )}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
