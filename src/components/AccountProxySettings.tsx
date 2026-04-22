import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudAccounts, useSetAccountProxy } from '@/hooks/useCloudAccounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isValidProxyUrl } from '@/utils/url';
import { Loader2 } from 'lucide-react';
import { CloudAccount } from '@/types/cloudAccount';

function AccountProxyItem({ account }: { account: CloudAccount }) {
  const { t } = useTranslation();
  const setAccountProxy = useSetAccountProxy();
  const [proxyUrl, setProxyUrl] = useState(account.proxy_url || '');
  const [proxySaved, setProxySaved] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
      <div className="flex items-center gap-3 overflow-hidden">
        {account.avatar_url ? (
          <img
            src={account.avatar_url}
            alt={account.name || ''}
            className="bg-muted h-8 w-8 rounded-full border shrink-0"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full border shrink-0">
            {account.name?.[0]?.toUpperCase() || 'A'}
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold">
            {account.name || t('cloud.card.unknown')}
          </span>
          <span className="truncate text-xs text-muted-foreground">{account.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={proxyUrl}
          onChange={(e) => {
            setProxyUrl(e.target.value);
            setProxySaved(false);
          }}
          onBlur={() => {
            const trimmed = proxyUrl.trim();
            if (trimmed && !isValidProxyUrl(trimmed)) {
              setProxyUrl(account.proxy_url || '');
              return;
            }
            if (trimmed !== (account.proxy_url || '')) {
              setAccountProxy.mutate({
                accountId: account.id,
                proxyUrl: trimmed || null,
              });
              setProxySaved(true);
              setTimeout(() => setProxySaved(false), 2000);
            }
          }}
          placeholder={t('cloud.card.proxyPlaceholder') || 'e.g. http://127.0.0.1:7890'}
          className="h-8 w-48 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <div className="w-16">
          {proxySaved && (
            <span className="text-[10px] text-green-500 whitespace-nowrap">{t('cloud.card.proxySaved')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountProxySettings() {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useCloudAccounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.proxy.accountProxies.title')}</CardTitle>
          <CardDescription>{t('settings.proxy.accountProxies.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.proxy.accountProxies.title')}</CardTitle>
        <CardDescription>{t('settings.proxy.accountProxies.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {accounts.map((account) => (
          <AccountProxyItem key={account.id} account={account} />
        ))}
      </CardContent>
    </Card>
  );
}
