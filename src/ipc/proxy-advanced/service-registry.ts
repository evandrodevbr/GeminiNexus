/**
 * Service registry for proxy-advanced IPC handlers to access
 * NestJS service instances without DI coupling.
 *
 * Services auto-register on construction.
 */
import type { TokenManagerService } from '../../server/modules/proxy/token-manager.service';
import type { ProxyMetricsService } from '../../server/modules/proxy/proxy-metrics.service';
import type { ProxyReplayService } from '../../server/modules/proxy/proxy-replay.service';
import type { ProxyIdeConfigService } from '../../server/modules/proxy/proxy-ide-config.service';

interface ProxyAdvancedRegistry {
  tokenManager: TokenManagerService | null;
  proxyMetrics: ProxyMetricsService | null;
  proxyReplay: ProxyReplayService | null;
  proxyIdeConfig: ProxyIdeConfigService | null;
}

export const proxyAdvancedRegistry: ProxyAdvancedRegistry = {
  tokenManager: null,
  proxyMetrics: null,
  proxyReplay: null,
  proxyIdeConfig: null,
};

export function registerProxyAdvancedService<K extends keyof ProxyAdvancedRegistry>(
  key: K,
  instance: ProxyAdvancedRegistry[K],
): void {
  proxyAdvancedRegistry[key] = instance;
}

export function getServiceOrThrow<K extends keyof ProxyAdvancedRegistry>(
  key: K,
): NonNullable<ProxyAdvancedRegistry[K]> {
  const svc = proxyAdvancedRegistry[key];
  if (!svc) throw new Error(`ProxyAdvanced service '${key}' is not registered`);
  return svc;
}

export function getServiceOptional<K extends keyof ProxyAdvancedRegistry>(
  key: K,
): ProxyAdvancedRegistry[K] {
  return proxyAdvancedRegistry[key];
}
