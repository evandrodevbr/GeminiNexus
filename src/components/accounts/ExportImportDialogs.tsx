import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExportImportDialogsProps {
  isExportDialogOpen: boolean;
  onExportDialogChange: (open: boolean) => void;
  onExport: (stripTokens: boolean) => void;
  isExportPending: boolean;
  isImportDialogOpen: boolean;
  onImportDialogChange: (open: boolean) => void;
  importStrategy: 'merge' | 'overwrite' | 'skip-existing';
  onImportStrategyChange: (strategy: 'merge' | 'overwrite' | 'skip-existing') => void;
  importFileName: string;
  onImportFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importFileContent: string | null;
  onImport: () => void;
  isImportPending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ExportImportDialogs(props: ExportImportDialogsProps) {
  const { t } = useTranslation();
  const {
    isExportDialogOpen,
    onExportDialogChange,
    onExport,
    isExportPending,
    isImportDialogOpen,
    onImportDialogChange,
    importStrategy,
    onImportStrategyChange,
    importFileName,
    onImportFileSelect,
    importFileContent,
    onImport,
    isImportPending,
    fileInputRef,
  } = props;

  return (
    <>
      <Dialog open={isExportDialogOpen} onOpenChange={onExportDialogChange}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('cloud.exportImport.exportTitle')}</DialogTitle>
            <DialogDescription>{t('cloud.exportImport.exportDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => onExport(false)}
              disabled={isExportPending}
              className="w-full cursor-pointer sm:flex-1"
            >
              {isExportPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('cloud.exportImport.includeTokens')}
            </Button>
            <Button
              onClick={() => onExport(true)}
              disabled={isExportPending}
              className="w-full cursor-pointer sm:flex-1"
            >
              {isExportPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('cloud.exportImport.stripTokens')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isImportDialogOpen} onOpenChange={onImportDialogChange}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('cloud.exportImport.importTitle')}</DialogTitle>
            <DialogDescription>{t('cloud.exportImport.importDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('cloud.exportImport.selectFile')}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                {importFileName || t('cloud.exportImport.selectFile')}
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>{t('cloud.exportImport.importStrategy')}</Label>
              <Select value={importStrategy} onValueChange={onImportStrategyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">{t('cloud.exportImport.strategyMerge')}</SelectItem>
                  <SelectItem value="overwrite">
                    {t('cloud.exportImport.strategyOverwrite')}
                  </SelectItem>
                  <SelectItem value="skip-existing">
                    {t('cloud.exportImport.strategySkip')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onImport} disabled={!importFileContent || isImportPending}>
              {isImportPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isImportPending ? t('cloud.exportImport.importing') : t('cloud.exportImport.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
