import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudAccountRepo } from '../../../ipc/database/cloudHandler';

const mockRun = vi.fn();
const mockAll = vi.fn();
const mockGet = vi.fn();
const mockClose = vi.fn();
const mockPrepare = vi.fn(() => ({ run: mockRun, all: mockAll, get: mockGet }));

const mockFrom = vi.fn(() => ({
  where: vi.fn(() => ({ all: mockAll })),
  orderBy: vi.fn(() => ({ all: mockAll })),
  all: mockAll,
}));

const mockSet = vi.fn(() => ({
  where: vi.fn(() => ({ run: mockRun })),
  run: mockRun,
}));

const mockValues = vi.fn(() => ({
  onConflictDoUpdate: vi.fn(() => ({ run: mockRun })),
  run: mockRun,
}));

const mockOrm = {
  select: vi.fn(() => ({ from: mockFrom })),
  update: vi.fn(() => ({ set: mockSet })),
  delete: vi.fn(() => ({ where: vi.fn(() => ({ run: mockRun })) })),
  insert: vi.fn(() => ({ values: mockValues })),
  transaction: vi.fn((fn) =>
    fn({
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({ run: mockRun })),
          run: mockRun,
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => ({ run: mockRun })),
          run: mockRun,
        })),
      })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ run: mockRun })) })),
    }),
  ),
};

vi.mock('better-sqlite3', () => ({
  default: class MockDatabase {
    exec = vi.fn();
    prepare = vi.fn(() => ({ run: vi.fn(), get: vi.fn(), all: vi.fn() }));
    close = vi.fn();
    pragma = vi.fn(() => []);
  },
}));

vi.mock('../../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: vi.fn(() => ({
    raw: { prepare: mockPrepare, close: mockClose },
    orm: mockOrm,
  })),
  configureDatabase: vi.fn(),
}));

vi.mock('../../../utils/paths', () => ({
  getCloudAccountsDbPath: vi.fn(() => '/mock/db/path.sqlite'),
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../utils/security', () => ({
  encrypt: vi.fn(async (text: string) => text),
  decryptWithMigration: vi.fn(async (text: string) => ({ value: text })),
}));

function createMockAccountRow(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'acc-1',
    provider: 'google',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    tokenJson: JSON.stringify({
      access_token: 'tok1',
      refresh_token: 'ref1',
      expires_in: 3600,
      expiry_timestamp: 1234567890,
      token_type: 'Bearer',
    }),
    quotaJson: null,
    deviceProfileJson: null,
    deviceHistoryJson: null,
    createdAt: 1234567890,
    lastUsed: 1234567890,
    status: 'active',
    statusReason: null,
    isActive: 1,
    proxyUrl: null,
    ...overrides,
  };
}

describe('CloudAccountRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addAccount (create)', () => {
    it('should insert a new account into the database', async () => {
      const account = {
        id: 'acc-1',
        provider: 'google' as const,
        email: 'test@example.com',
        token: {
          access_token: 'tok1',
          refresh_token: 'ref1',
          expires_in: 3600,
          expiry_timestamp: 1234567890,
          token_type: 'Bearer',
        },
        created_at: 1234567890,
        last_used: 1234567890,
        is_active: false,
      };

      await CloudAccountRepo.addAccount(account);

      expect(mockOrm.transaction).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAccountByEmail (findByEmail)', () => {
    it('should return the matching account by email', async () => {
      mockAll.mockReturnValue([createMockAccountRow()]);

      const result = await CloudAccountRepo.getAccountByEmail('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when no account matches the email', async () => {
      mockAll.mockReturnValue([]);

      const result = await CloudAccountRepo.getAccountByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getAccounts (findAll)', () => {
    it('should return all accounts from the database', async () => {
      mockAll.mockReturnValue([
        createMockAccountRow({ id: 'acc-1', email: 'a@example.com' }),
        createMockAccountRow({ id: 'acc-2', email: 'b@example.com' }),
      ]);

      const result = await CloudAccountRepo.getAccounts();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('a@example.com');
      expect(result[1].email).toBe('b@example.com');
    });

    it('should auto-activate the first account when none are active', async () => {
      mockAll.mockReturnValue([createMockAccountRow({ isActive: 0 })]);

      const result = await CloudAccountRepo.getAccounts();

      expect(mockOrm.update).toHaveBeenCalled();
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('updateToken (update)', () => {
    it('should modify token fields for an existing account', async () => {
      mockRun.mockReturnValue({ changes: 1 });

      await CloudAccountRepo.updateToken('acc-1', {
        access_token: 'new-tok',
        refresh_token: 'ref1',
        expires_in: 3600,
        expiry_timestamp: 1234567890,
        token_type: 'Bearer',
      });

      expect(mockOrm.update).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('removeAccount (delete)', () => {
    it('should remove the account by id', async () => {
      await CloudAccountRepo.removeAccount('acc-1');

      expect(mockOrm.delete).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('updateQuota', () => {
    it('should update quota fields for an existing account', async () => {
      mockRun.mockReturnValue({ changes: 1 });

      await CloudAccountRepo.updateQuota('acc-1', { models: {} });

      expect(mockOrm.update).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('updateLastUsed', () => {
    it('should update the last_used timestamp for an account', () => {
      CloudAccountRepo.updateLastUsed('acc-1');

      expect(mockOrm.update).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
