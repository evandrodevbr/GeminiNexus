import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authCode: string;
  onAuthCodeChange: (code: string) => void;
  selectedOAuthClientKey: string;
  onOAuthClientChange: (key: string) => void;
  oauthClients: Array<{ key: string; label: string; is_active: boolean }>;
  isOAuthClientsLoading: boolean;
  isSetActiveOAuthClientPending: boolean;
  onOpenGoogleAuth: () => void;
  onSubmitAuthCode: () => void;
  isAddPending: boolean;
}

export function AddAccountDialog(props: AddAccountDialogProps) {
  const { t } = useTranslation();
  const {
    open,
    onOpenChange,
    authCode,
    onAuthCodeChange,
    selectedOAuthClientKey,
    onOAuthClientChange,
    oauthClients,
    isOAuthClientsLoading,
    isSetActiveOAuthClientPending,
    onOpenGoogleAuth,
    onSubmitAuthCode,
    isAddPending,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('cloud.authDialog.title')}</DialogTitle>
          <DialogDescription>{t('cloud.authDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="oauth-client-select">{t('cloud.authDialog.oauthClient')}</Label>
            <Select
              value={selectedOAuthClientKey || undefined}
              onValueChange={onOAuthClientChange}
              disabled={isOAuthClientsLoading || isSetActiveOAuthClientPending}
            >
              <SelectTrigger id="oauth-client-select">
                <SelectValue placeholder={t('cloud.authDialog.oauthClientPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {oauthClients.map((client) => (
                  <SelectItem key={client.key} value={client.key}>
                    {client.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Button variant="outline" className="col-span-4" onClick={onOpenGoogleAuth}>
              <Cloud className="mr-2 h-4 w-4" />
              {t('cloud.authDialog.openLogin')}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">{t('cloud.authDialog.authCode')}</Label>
            <Input
              id="code"
              placeholder={t('cloud.authDialog.placeholder')}
              value={authCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onAuthCodeChange(e.target.value)
              }
            />
            <p className="text-muted-foreground text-xs">{t('cloud.authDialog.instruction')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmitAuthCode} disabled={isAddPending || !authCode}>
            {isAddPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cloud.authDialog.verify')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
