import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoSwitchService } from '@/services/AutoSwitchService';
import { CloudAccountRepo } from '@/ipc/database/cloudHandler';
import { switchCloudAccount } from '@/ipc/cloud/handler';

vi.mock('@/ipc/database/cloudHandler', () => ({
  CloudAccountRepo: {
    getAccounts: vi.fn(),
    getSetting: vi.fn(),
  },
}));

vi.mock('@/ipc/cloud/handler', () => ({
  switchCloudAccount: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AutoSwitchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createAccount(
    overrides?: Partial<{
      id: string;
      email: string;
      status: string;
      is_active: boolean;
      quota: { models: Record<string, { percentage: number }> } | null;
    }>,
  ) {
    return {
      id: 'acc-1',
      email: 'test@example.com',
      status: 'active',
      is_active: false,
      quota: {
        models: {
          'gemini-pro': { percentage: 80 },
          'gemini-flash': { percentage: 60 },
        },
      },
      ...overrides,
    };
  }

  describe('findBestAccount', () => {
    it('should return null when no accounts exist', async () => {
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue([]);
      const result = await AutoSwitchService.findBestAccount('current');
      expect(result).toBeNull();
    });

    it('should skip the current account', async () => {
      const accounts = [
        createAccount({ id: 'current', email: 'current@example.com', is_active: true }),
        createAccount({ id: 'other', email: 'other@example.com' }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.findBestAccount('current');
      expect(result?.id).toBe('other');
    });

    it('should skip inactive accounts', async () => {
      const accounts = [
        createAccount({ id: 'current', is_active: true }),
        createAccount({ id: 'inactive', status: 'expired' }),
        createAccount({ id: 'active', status: 'active' }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.findBestAccount('current');
      expect(result?.id).toBe('active');
    });

    it('should skip accounts with depleted quota', async () => {
      const accounts = [
        createAccount({ id: 'current', is_active: true }),
        createAccount({
          id: 'depleted',
          quota: { models: { 'gemini-pro': { percentage: 2 } } },
        }),
        createAccount({
          id: 'healthy',
          quota: { models: { 'gemini-pro': { percentage: 50 } } },
        }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.findBestAccount('current');
      expect(result?.id).toBe('healthy');
    });

    it('should skip accounts without quota data', async () => {
      const accounts = [
        createAccount({ id: 'current', is_active: true }),
        createAccount({ id: 'no-quota', quota: null }),
        createAccount({ id: 'has-quota' }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.findBestAccount('current');
      expect(result?.id).toBe('has-quota');
    });

    it('should select account with highest average quota', async () => {
      const accounts = [
        createAccount({ id: 'current', is_active: true }),
        createAccount({
          id: 'low',
          quota: { models: { a: { percentage: 30 }, b: { percentage: 40 } } },
        }),
        createAccount({
          id: 'high',
          quota: { models: { a: { percentage: 90 }, b: { percentage: 80 } } },
        }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.findBestAccount('current');
      expect(result?.id).toBe('high');
    });
  });

  describe('checkAndSwitchIfNeeded', () => {
    it('should return false when auto-switch is disabled', async () => {
      vi.mocked(CloudAccountRepo.getSetting).mockReturnValue(false);
      const result = await AutoSwitchService.checkAndSwitchIfNeeded();
      expect(result).toBe(false);
    });

    it('should return false when no active account', async () => {
      vi.mocked(CloudAccountRepo.getSetting).mockReturnValue(true);
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue([]);
      const result = await AutoSwitchService.checkAndSwitchIfNeeded();
      expect(result).toBe(false);
    });

    it('should switch when current account is depleted', async () => {
      vi.mocked(CloudAccountRepo.getSetting).mockReturnValue(true);
      const accounts = [
        createAccount({
          id: 'current',
          is_active: true,
          quota: { models: { 'gemini-pro': { percentage: 2 } } },
        }),
        createAccount({ id: 'backup' }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.checkAndSwitchIfNeeded();
      expect(result).toBe(true);
      expect(switchCloudAccount).toHaveBeenCalledWith('backup');
    });

    it('should switch when current account is rate limited', async () => {
      vi.mocked(CloudAccountRepo.getSetting).mockReturnValue(true);
      const accounts = [
        createAccount({ id: 'current', is_active: true, status: 'rate_limited' }),
        createAccount({ id: 'backup' }),
      ];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.checkAndSwitchIfNeeded();
      expect(result).toBe(true);
    });

    it('should not switch when current account is healthy', async () => {
      vi.mocked(CloudAccountRepo.getSetting).mockReturnValue(true);
      const accounts = [createAccount({ id: 'current', is_active: true })];
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValue(accounts as any);

      const result = await AutoSwitchService.checkAndSwitchIfNeeded();
      expect(result).toBe(false);
      expect(switchCloudAccount).not.toHaveBeenCalled();
    });
  });

  describe('isAccountDepleted', () => {
    it('should return false for healthy account', () => {
      const account = createAccount();
      expect(AutoSwitchService.isAccountDepleted(account as any)).toBe(false);
    });

    it('should return true when any model is below 5%', () => {
      const account = createAccount({
        quota: { models: { 'gemini-pro': { percentage: 10 }, 'gemini-flash': { percentage: 3 } } },
      });
      expect(AutoSwitchService.isAccountDepleted(account as any)).toBe(true);
    });

    it('should return false when no quota data', () => {
      const account = createAccount({ quota: null });
      expect(AutoSwitchService.isAccountDepleted(account as any)).toBe(false);
    });
  });
});
