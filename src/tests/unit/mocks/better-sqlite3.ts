import { vi } from 'vitest';

/**
 * Mock Database class for better-sqlite3.
 * Use this to create in-memory-like database behavior for tests.
 */
export class MockDatabase {
  data: Map<string, any[]> = new Map();

  prepare = vi.fn().mockImplementation((sql: string) => {
    const table = this._extractTable(sql);
    return {
      run: vi.fn().mockImplementation((...params: any[]) => {
        const values = params.length === 1 && typeof params[0] === 'object' ? params[0] : params;
        const rows = this.data.get(table) || [];
        if (sql.toLowerCase().includes('insert')) {
          rows.push(values);
          this.data.set(table, rows);
          return { lastInsertRowid: rows.length, changes: 1 };
        }
        if (sql.toLowerCase().includes('update')) {
          return { changes: 1 };
        }
        if (sql.toLowerCase().includes('delete')) {
          return { changes: 1 };
        }
        return { changes: 0 };
      }),
      get: vi.fn().mockImplementation((...params: any[]) => {
        const values = params.length === 1 && typeof params[0] === 'object' ? params[0] : params;
        const rows = this.data.get(table) || [];
        if (!values || (Array.isArray(values) && values.length === 0)) return rows[0] ?? null;
        return rows.find((row) =>
          Object.keys(values).every((key) => row[key] === values[key]),
        );
      }),
      all: vi.fn().mockImplementation((...params: any[]) => {
        const values = params.length === 1 && typeof params[0] === 'object' ? params[0] : params;
        const rows = this.data.get(table) || [];
        if (!values || (Array.isArray(values) && values.length === 0)) return rows;
        return rows.filter((row) =>
          Object.keys(values).every((key) => row[key] === values[key]),
        );
      }),
    };
  });

  exec = vi.fn().mockImplementation((sql: string) => {
    // Mock schema creation / raw execution
  });

  transaction = vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
    return (...args: any[]) => fn(...args);
  });

  close = vi.fn();

  private _extractTable(sql: string): string {
    const lower = sql.toLowerCase();
    const match =
      lower.match(/from\s+(\w+)/) ||
      lower.match(/into\s+(\w+)/) ||
      lower.match(/update\s+(\w+)/) ||
      lower.match(/table\s+(\w+)/);
    return match ? match[1] : 'default';
  }
}

/**
 * Factory for creating a fresh mock DB instance.
 */
export function createMockDb() {
  return new MockDatabase();
}

export default MockDatabase;
