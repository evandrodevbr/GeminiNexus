import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initDatabase,
  getDatabaseConnection,
  getCurrentAccountInfo,
  backupAccount,
  restoreAccount,
} from '../../../ipc/database/handler';
import { openDrizzleConnection } from '../../../ipc/database/dbConnection';
import { getGeminiNexusDbPaths } from '../../../utils/paths';
import fs from 'fs';

const mockClose = vi.fn();
const mockRun = vi.fn();

function createMockOrm(rows: Record<string, unknown>[] = []) {
  let callIndex = 0;
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    all: vi.fn().mockImplementation(() => {
      const row = rows[callIndex] ?? null;
      callIndex++;
      return row ? [row] : [];
    }),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    run: mockRun,
  };
  return {
    select: vi.fn().mockReturnValue(chain),
    insert: vi.fn().mockReturnValue(chain),
    transaction: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
      const tx = {
        insert: vi.fn().mockReturnValue(chain),
      };
      return fn(tx);
    }),
  };
}

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../utils/paths', () => ({
  getGeminiNexusDbPaths: vi.fn().mockReturnValue(['/tmp/test.vscdb']),
}));

vi.mock('../../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: vi.fn().mockImplementation(() => ({
    raw: { close: mockClose },
    orm: createMockOrm(),
  })),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

vi.mock('../../../utils/sqlite', () => ({
  parseRow: vi.fn().mockImplementation((_schema, row) => row ?? null),
}));

vi.mock('../../../ipc/database/schema', () => ({
  itemTable: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockReturnValue({}),
}));

describe('Database Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGeminiNexusDbPaths).mockReturnValue(['/tmp/test.vscdb']);
    vi.mocked(openDrizzleConnection).mockImplementation(() => ({
      raw: { close: mockClose },
      orm: createMockOrm() as any,
    }));
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  describe('initDatabase', () => {
    it('should initialize database without error', () => {
      expect(() => initDatabase()).not.toThrow();
    });

    it('should return early when no db paths exist', () => {
      vi.mocked(getGeminiNexusDbPaths).mockReturnValueOnce([]);
      expect(() => initDatabase()).not.toThrow();
    });
  });

  describe('getDatabaseConnection', () => {
    it('should create connection when db exists', () => {
      const conn = getDatabaseConnection();
      expect(conn).toBeDefined();
      expect(conn.raw).toBeDefined();
      expect(conn.orm).toBeDefined();
    });

    it('should close connection when done', () => {
      const conn = getDatabaseConnection();
      conn.raw.close();
      expect(mockClose).toHaveBeenCalled();
    });

    it('should throw when no database path is found', () => {
      vi.mocked(getGeminiNexusDbPaths).mockReturnValueOnce([]);
      expect(() => getDatabaseConnection()).toThrow('No Gemini Nexus database path found');
    });

    it('should throw SQLITE_BUSY error as user-friendly message', () => {
      vi.mocked(openDrizzleConnection).mockImplementationOnce(() => {
        const err = new Error('Database is locked') as Error & { code: string };
        err.code = 'SQLITE_BUSY';
        throw err;
      });
      expect(() => getDatabaseConnection()).toThrow('Database is locked. Please close Gemini Nexus before proceeding.');
    });

    it('should throw SQLITE_LOCKED error as user-friendly message', () => {
      vi.mocked(openDrizzleConnection).mockImplementationOnce(() => {
        const err = new Error('Database is locked') as Error & { code: string };
        err.code = 'SQLITE_LOCKED';
        throw err;
      });
      expect(() => getDatabaseConnection()).toThrow('Database is locked. Please close Gemini Nexus before proceeding.');
    });
  });

  describe('getCurrentAccountInfo', () => {
    it('should return authenticated account info from geminiNexusAuthStatus', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose },
        orm: createMockOrm([
          { value: JSON.stringify({ user: { email: 'auth@test.com', name: 'Auth User' } }) },
        ]) as any,
      });

      const info = getCurrentAccountInfo();
      expect(info.email).toBe('auth@test.com');
      expect(info.name).toBe('Auth User');
      expect(info.isAuthenticated).toBe(true);
      expect(mockClose).toHaveBeenCalled();
    });

    it('should fallback to jetskiStateSync.agentManagerInitState', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose },
        orm: createMockOrm([
          { value: null },
          { value: JSON.stringify({ user: { email: 'init@test.com', name: 'Init User' } }) },
        ]) as any,
      });

      const info = getCurrentAccountInfo();
      expect(info.email).toBe('init@test.com');
      expect(info.name).toBe('Init User');
      expect(info.isAuthenticated).toBe(true);
    });

    it('should return empty info when no keys found', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose },
        orm: createMockOrm([{ value: null }, { value: null }, { value: null }, { value: null }]) as any,
      });

      const info = getCurrentAccountInfo();
      expect(info.email).toBe('');
      expect(info.name).toBe('');
      expect(info.isAuthenticated).toBe(false);
    });
  });

  describe('backupAccount', () => {
    it('should backup account data with metadata', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose },
        orm: createMockOrm([
          { value: JSON.stringify({ status: 'active' }) },
          { value: JSON.stringify({ state: 'ready' }) },
          { value: JSON.stringify({ token: 'abc' }) },
        ]) as any,
      });

      const account = {
        id: 'acc-1',
        name: 'Test',
        email: 'test@test.com',
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };
      const backup = backupAccount(account);

      expect(backup.version).toBe('1.0');
      expect(backup.account).toEqual(account);
      expect(backup.data['geminiNexusAuthStatus']).toEqual({ status: 'active' });
      expect(backup.data['jetskiStateSync.agentManagerInitState']).toEqual({ state: 'ready' });
      expect(backup.data['geminiNexusUnifiedStateSync.oauthToken']).toEqual({ token: 'abc' });
      expect(backup.data['account_email']).toBe('test@test.com');
      expect(backup.data['backup_time']).toBeDefined();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('restoreAccount', () => {
    it('should restore keys to existing database', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose },
        orm: createMockOrm() as any,
      });

      const backup = {
        version: '1.0',
        account: {
          id: 'acc-1',
          name: 'Test',
          email: 'test@test.com',
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        },
        data: {
          geminiNexusAuthStatus: { status: 'restored' },
          'jetskiStateSync.agentManagerInitState': { state: 'restored' },
        },
      };

      expect(() => restoreAccount(backup as any)).not.toThrow();
      expect(mockRun).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it('should throw when no database paths found', () => {
      vi.mocked(getGeminiNexusDbPaths).mockReturnValueOnce([]);
      expect(() =>
        restoreAccount({
          version: '1.0',
          account: {} as any,
          data: {},
        }),
      ).toThrow('No Gemini Nexus database paths found');
    });
  });
});
