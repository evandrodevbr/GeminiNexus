import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProxyIdeConfigService,
  SupportedIde,
} from '@/server/modules/proxy/proxy-ide-config.service';

vi.mock('@/ipc/proxy-advanced/service-registry', () => ({
  registerProxyAdvancedService: vi.fn(),
}));

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  const mockedNetworkInterfaces = vi.fn();
  return {
    ...actual,
    default: {
      ...actual,
      networkInterfaces: mockedNetworkInterfaces,
    },
    networkInterfaces: mockedNetworkInterfaces,
  };
});

vi.mock('@/server/server-config', () => ({
  getServerConfig: vi.fn().mockReturnValue({
    port: 3000,
    api_key: 'test-api-key-12345',
  }),
}));

import { networkInterfaces } from 'os';
import { getServerConfig } from '@/server/server-config';

describe('ProxyIdeConfigService', () => {
  let service: ProxyIdeConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProxyIdeConfigService();
  });

  describe('getLocalIp', () => {
    it('should return the first non-internal IPv4 address', () => {
      vi.mocked(networkInterfaces).mockReturnValue({
        eth0: [
          { family: 'IPv4', internal: false, address: '192.168.1.100' } as any,
          { family: 'IPv6', internal: false, address: 'fe80::1' } as any,
        ],
      });

      expect(service.getLocalIp()).toBe('192.168.1.100');
    });

    it('should skip internal interfaces', () => {
      vi.mocked(networkInterfaces).mockReturnValue({
        lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' } as any],
        eth0: [{ family: 'IPv4', internal: false, address: '10.0.0.5' } as any],
      });

      expect(service.getLocalIp()).toBe('10.0.0.5');
    });

    it('should fallback to 127.0.0.1 when no external interface exists', () => {
      vi.mocked(networkInterfaces).mockReturnValue({
        lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' } as any],
      });

      expect(service.getLocalIp()).toBe('127.0.0.1');
    });

    it('should handle empty network interfaces', () => {
      vi.mocked(networkInterfaces).mockReturnValue({});

      expect(service.getLocalIp()).toBe('127.0.0.1');
    });

    it('should handle null interface entries', () => {
      vi.mocked(networkInterfaces).mockReturnValue({
        eth0: undefined as any,
      });

      expect(service.getLocalIp()).toBe('127.0.0.1');
    });
  });

  describe('generateIdeConfig', () => {
    const testCases: Array<{ ide: SupportedIde; expectedFormat: string }> = [
      { ide: 'cursor', expectedFormat: 'json' },
      { ide: 'vscode', expectedFormat: 'json' },
      { ide: 'claude-code', expectedFormat: 'shell' },
      { ide: 'jetbrains', expectedFormat: 'instructions' },
      { ide: 'opencide', expectedFormat: 'env' },
    ];

    testCases.forEach(({ ide, expectedFormat }) => {
      it(`should generate ${ide} config in ${expectedFormat} format`, () => {
        const result = service.generateIdeConfig(ide, 3000, 'test-key', '192.168.1.100');

        expect(result.ide).toBe(ide);
        expect(result.format).toBe(expectedFormat);
        expect(result.content).toBeDefined();
      });
    });

    it('should include correct base URL in all configs', () => {
      const result = service.generateIdeConfig('cursor', 8080, 'key', '10.0.0.1');

      if (typeof result.content === 'object') {
        const values = Object.values(result.content);
        expect(values.some((v) => v.includes('http://10.0.0.1:8080/v1'))).toBe(true);
      } else {
        expect(result.content).toContain('http://10.0.0.1:8080/v1');
      }
    });

    it('should include API key in all configs', () => {
      const result = service.generateIdeConfig('opencide', 3000, 'my-secret-key', '127.0.0.1');
      expect(result.content).toContain('my-secret-key');
    });

    it('should throw for unsupported IDE at runtime', () => {
      const unsupportedIde = 'unknown-ide' as SupportedIde;
      expect(() => service.generateIdeConfig(unsupportedIde, 3000, 'key', '127.0.0.1')).toThrow(
        'Unsupported IDE: unknown-ide',
      );
    });
  });

  describe('generateConfigForCurrentServer', () => {
    it('should generate config using current server settings', () => {
      const result = service.generateConfigForCurrentServer('cursor');

      expect(result).not.toBeNull();
      expect(result?.content).toBeDefined();
    });

    it('should return null when server config is unavailable', () => {
      vi.mocked(getServerConfig).mockReturnValueOnce(null as any);

      const result = service.generateConfigForCurrentServer('cursor');
      expect(result).toBeNull();
    });
  });
});
