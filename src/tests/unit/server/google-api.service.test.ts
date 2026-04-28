import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAPIService, UserInfoSchema } from '@/services/GoogleAPIService';

vi.mock('@/ipc/config/manager', () => ({
  ConfigManager: {
    loadConfig: vi.fn().mockReturnValue({}),
  },
}));

vi.mock('@/ipc/cloud/authServer', () => ({
  AuthServer: {
    getRedirectUri: vi.fn().mockReturnValue('http://localhost:3000/auth/callback'),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/server/modules/proxy/request-user-agent', () => ({
  buildUserAgent: vi.fn().mockReturnValue('GeminiNexus/1.0'),
  FALLBACK_VERSION: '1.0.0',
  resolveLocalInstalledVersion: vi.fn().mockReturnValue('1.0.0'),
}));

describe('GoogleAPIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTIGRAVITY_OAUTH_CLIENTS;
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_KEY;
  });

  afterEach(() => {
    delete process.env.ANTIGRAVITY_OAUTH_CLIENTS;
    delete process.env.ANTIGRAVITY_OAUTH_CLIENT_KEY;
  });

  describe('OAuth client registry', () => {
    beforeEach(() => {
      vi.resetModules();
      delete process.env.ANTIGRAVITY_OAUTH_CLIENTS;
      delete process.env.ANTIGRAVITY_OAUTH_CLIENT_KEY;
    });

    it('should list built-in OAuth clients', async () => {
      const { GoogleAPIService } = await import('@/services/GoogleAPIService');
      const clients = GoogleAPIService.listOAuthClients();
      expect(clients.length).toBeGreaterThanOrEqual(1);
      expect(clients[0]).toMatchObject({
        key: expect.any(String),
        label: expect.any(String),
        client_id: expect.any(String),
        is_active: expect.any(Boolean),
        is_builtin: true,
      });
    });

    it('should parse extra OAuth clients from environment', async () => {
      process.env.ANTIGRAVITY_OAUTH_CLIENTS = 'custom1|id1|secret1|Custom One;custom2|id2|secret2';
      const { GoogleAPIService } = await import('@/services/GoogleAPIService');
      const clients = GoogleAPIService.listOAuthClients();

      const custom1 = clients.find((c) => c.key === 'custom1');
      expect(custom1).toBeDefined();
      expect(custom1?.label).toBe('Custom One');
      expect(custom1?.is_builtin).toBe(false);
    });

    it('should skip invalid OAuth client entries', async () => {
      process.env.ANTIGRAVITY_OAUTH_CLIENTS = 'invalid|no_secret;valid|id|secret|Label';
      const { GoogleAPIService } = await import('@/services/GoogleAPIService');
      const clients = GoogleAPIService.listOAuthClients();

      expect(clients.some((c) => c.key === 'valid')).toBe(true);
      expect(clients.some((c) => c.key === 'invalid')).toBe(false);
    });

    it('should allow setting active OAuth client key', async () => {
      const { GoogleAPIService } = await import('@/services/GoogleAPIService');
      GoogleAPIService.setActiveOAuthClientKey('gemininexus_enterprise');
      expect(GoogleAPIService.getActiveOAuthClientKey()).toBe('gemininexus_enterprise');
    });

    it('should throw for unknown OAuth client key', async () => {
      const { GoogleAPIService } = await import('@/services/GoogleAPIService');
      expect(() => GoogleAPIService.setActiveOAuthClientKey('nonexistent')).toThrow(
        "Unknown OAuth client key 'nonexistent'",
      );
    });
  });

  describe('getAuthUrl', () => {
    it('should generate an OAuth authorization URL', () => {
      const url = GoogleAPIService.getAuthUrl();
      expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('response_type=code');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });

    it('should include requested scopes', () => {
      const url = GoogleAPIService.getAuthUrl();
      expect(url).toContain(encodeURIComponent('https://www.googleapis.com/auth/cloud-platform'));
      expect(url).toContain(encodeURIComponent('https://www.googleapis.com/auth/userinfo.email'));
    });
  });

  describe('UserInfoSchema', () => {
    it('should validate valid user info', () => {
      const data = {
        id: '123',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test User',
      };
      expect(UserInfoSchema.parse(data)).toEqual(data);
    });

    it('should default verified_email to false', () => {
      const data = { id: '123', email: 'test@example.com' };
      const parsed = UserInfoSchema.parse(data);
      expect(parsed.verified_email).toBe(false);
    });

    it('should reject missing id', () => {
      expect(() => UserInfoSchema.parse({ email: 'test@example.com' })).toThrow();
    });
  });

  describe('normalizeRefreshedOAuthClientKey', () => {
    it('should return normalized key when present', () => {
      const result = GoogleAPIService.normalizeRefreshedOAuthClientKey(
        { oauth_client_key: 'MyKey' },
        'OtherKey',
      );
      expect(result).toBe('otherkey');
    });

    it('should fallback to current token key', () => {
      const result = GoogleAPIService.normalizeRefreshedOAuthClientKey(
        { oauth_client_key: 'MyKey' },
        undefined,
      );
      expect(result).toBe('mykey');
    });

    it('should unset enterprise key for legacy accounts without project_id', () => {
      const result = GoogleAPIService.normalizeRefreshedOAuthClientKey(
        {},
        'gemininexus_enterprise',
      );
      expect(result).toBe('gemininexus_enterprise');
    });
  });
});
