import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonitorTab } from './advanced/MonitorTab';
import { ToolsTab } from './advanced/ToolsTab';
import type { ProxyConfig } from '@/types/config';

interface ProxyAdvancedTabProps {
  proxyConfig: ProxyConfig;
}

export const ProxyAdvancedTab: React.FC<ProxyAdvancedTabProps> = () => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="monitor" className="space-y-5">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="monitor">{t('proxy.advanced.monitor')}</TabsTrigger>
        <TabsTrigger value="tools">{t('proxy.advanced.tabs.tools')}</TabsTrigger>
      </TabsList>
      <TabsContent value="monitor">
        <MonitorTab />
      </TabsContent>
      <TabsContent value="tools">
        <ToolsTab />
      </TabsContent>
    </Tabs>
  );
};
