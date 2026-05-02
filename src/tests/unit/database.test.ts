import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDatabaseConnection,
  getCurrentAccountInfo,
  backupAccount,
  restoreAccount,
} from '../../ipc/database/handler';
import { openDrizzleConnection } from '../../ipc/database/dbConnection';
import { getGeminiNexusDbPaths } from '../../utils/paths';
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

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../utils/paths', () => ({
  IS_DEV_ENVIRONMENT: false,
  getGeminiNexusDbPaths: vi.fn().mockReturnValue(['/tmp/test.vscdb']),
}));

vi.mock('../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: vi.fn().mockImplementation(() => ({
    raw: { close: mockClose } as any,
    orm: createMockOrm() as any,
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

vi.mock('../../utils/sqlite', () => ({
  parseRow: vi.fn().mockImplementation((_schema, row) => row ?? null),
}));

vi.mock('../../ipc/database/schema', () => ({
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
      raw: { close: mockClose } as any,
      orm: createMockOrm() as any,
    }));
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  describe('getDatabaseConnection', () => {
    it('should connect to database', () => {
      const conn = getDatabaseConnection();
      expect(conn).toBeDefined();
      expect(conn.raw).toBeDefined();
      expect(conn.orm).toBeDefined();
      conn.raw.close();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('getCurrentAccountInfo', () => {
    it('should get current account info', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose } as any,
        orm: createMockOrm([
          { value: JSON.stringify({ user: { email: 'test@example.com', name: 'Test User' } }) },
        ]) as any,
      });

      const info = getCurrentAccountInfo();
      expect(info.email).toBe('test@example.com');
      expect(info.name).toBe('Test User');
      expect(info.isAuthenticated).toBe(true);
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('backupAccount', () => {
    it('should backup account', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose } as any,
        orm: createMockOrm([
          { value: JSON.stringify({ user: { email: 'test@example.com', name: 'Test User' } }) },
          { value: JSON.stringify({ state: 'ready' }) },
          { value: JSON.stringify({ token: 'abc' }) },
        ]) as any,
      });

      const account = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };
      const backup = backupAccount(account);
      expect(backup.account).toEqual(account);
      expect(backup.data['geminiNexusAuthStatus']).toEqual({
        user: { email: 'test@example.com', name: 'Test User' },
      });
      expect(backup.data['account_email']).toBe('test@example.com');
      expect(backup.data['backup_time']).toBeDefined();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('restoreAccount', () => {
    it('should restore account', () => {
      vi.mocked(openDrizzleConnection).mockReturnValueOnce({
        raw: { close: mockClose } as any,
        orm: createMockOrm() as any,
      });

      const backup = {
        version: '1.0',
        account: {
          id: '123',
          name: 'Restored User',
          email: 'restored@example.com',
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        },
        data: {
          geminiNexusAuthStatus: JSON.stringify({
            user: { email: 'restored@example.com' },
          }),
          newKey: 'newValue',
        },
      };

      expect(() => restoreAccount(backup as any)).not.toThrow();
      expect(mockRun).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
