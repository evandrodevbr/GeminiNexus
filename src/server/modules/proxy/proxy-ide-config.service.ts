import { Injectable, Logger } from '@nestjs/common';
import { networkInterfaces } from 'os';
import { getServerConfig } from '../../server-config';
import { registerProxyAdvancedService } from '../../../ipc/proxy-advanced/service-registry';

export type SupportedIde = 'cursor' | 'vscode' | 'claude-code' | 'jetbrains' | 'opencide';

export interface IdeConfigResult {
  ide: SupportedIde;
  format: 'json' | 'shell' | 'env' | 'instructions';
  content: Record<string, string> | string;
}

@Injectable()
export class ProxyIdeConfigService {
  private readonly logger = new Logger(ProxyIdeConfigService.name);

  constructor() {
    registerProxyAdvancedService('proxyIdeConfig', this);
  }

  /**
   * Return the first non-internal IPv4 address found on the machine.
   * Falls back to '127.0.0.1' if no external interface is available.
   */
  getLocalIp(): string {
    const interfaces = networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      if (!iface) {
        continue;
      }
      for (const entry of iface) {
        if (entry.family === 'IPv4' && !entry.internal) {
          return entry.address;
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * Generate a ready-to-paste IDE configuration for the given IDE.
   */
  generateIdeConfig(
    ide: SupportedIde,
    port: number,
    apiKey: string,
    localIp: string,
  ): IdeConfigResult {
    const baseUrl = `http://${localIp}:${port}/v1`;

    switch (ide) {
      case 'cursor': {
        return {
          ide,
          format: 'json',
          content: {
            OPENAI_API_KEY: apiKey,
            OPENAI_BASE_URL: baseUrl,
          },
        };
      }
      case 'vscode': {
        return {
          ide,
          format: 'json',
          content: {
            'openai.url': baseUrl,
            'openai.apiKey': apiKey,
          },
        };
      }
      case 'claude-code': {
        return {
          ide,
          format: 'shell',
          content: `export OPENAI_API_KEY=${apiKey} && export OPENAI_BASE_URL=${baseUrl}`,
        };
      }
      case 'jetbrains': {
        return {
          ide,
          format: 'instructions',
          content: [
            'JetBrains AI Assistant Setup:',
            '1. Open Settings (File > Settings or Ctrl+Alt+S).',
            '2. Navigate to Languages & Frameworks > AI Assistant.',
            '3. Under "Custom OpenAI Endpoint", set:',
            `   - Base URL: ${baseUrl}`,
            `   - API Key: ${apiKey}`,
            '4. Click "Apply" and restart the IDE if prompted.',
          ].join('\n'),
        };
      }
      case 'opencide': {
        return {
          ide,
          format: 'env',
          content: `OPENAI_API_KEY=${apiKey}\nOPENAI_BASE_URL=${baseUrl}`,
        };
      }
      default: {
        // Exhaustive fallback to satisfy TypeScript
        const exhaustiveCheck: never = ide;
        this.logger.warn(`Unsupported IDE requested: ${String(exhaustiveCheck)}`);
        throw new Error(`Unsupported IDE: ${String(exhaustiveCheck)}`);
      }
    }
  }

  /**
   * Convenience helper that reads the current server config and local IP,
   * then delegates to generateIdeConfig.
   */
  generateConfigForCurrentServer(ide: SupportedIde): IdeConfigResult | null {
    const config = getServerConfig();
    if (!config) {
      this.logger.warn('Server config not available; cannot generate IDE config');
      return null;
    }
    const port = config.port;
    const apiKey = config.api_key;
    const localIp = this.getLocalIp();
    return this.generateIdeConfig(ide, port, apiKey, localIp);
  }
}
