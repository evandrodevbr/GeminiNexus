import { vi } from 'vitest';

/**
 * Creates a mock Electron IPC main handle function.
 */
export function createIpcMock() {
  const handlers = new Map<string, (...args: any[]) => any>();

  return {
    handle: vi.fn((channel: string, handler: (...args: any[]) => any) => {
      handlers.set(channel, handler);
    }),
    handleOnce: vi.fn((channel: string, handler: (...args: any[]) => any) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => {
      handlers.delete(channel);
    }),
    invoke: vi.fn(async (channel: string, ...args: any[]) => {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for channel: ${channel}`);
      }
      return handler(...args);
    }),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    _handlers: handlers,
  };
}

/**
 * Mock Electron BrowserWindow.
 */
export function createWindowMock() {
  return {
    id: 1,
    webContents: {
      send: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
    },
    isDestroyed: vi.fn().mockReturnValue(false),
    isVisible: vi.fn().mockReturnValue(true),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    restore: vi.fn(),
    setSize: vi.fn(),
    getSize: vi.fn().mockReturnValue([1200, 800]),
    setPosition: vi.fn(),
    getPosition: vi.fn().mockReturnValue([0, 0]),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Mock app module.
 */
export function createAppMock() {
  return {
    getPath: vi.fn((name: string) => {
      const paths: Record<string, string> = {
        userData: '/tmp/test-user-data',
        appData: '/tmp/test-app-data',
        home: '/tmp/test-home',
        temp: '/tmp',
        logs: '/tmp/logs',
      };
      return paths[name] || `/tmp/${name}`;
    }),
    getVersion: vi.fn().mockReturnValue('1.0.0-test'),
    getName: vi.fn().mockReturnValue('GeminiNexusTest'),
    isPackaged: false,
    on: vi.fn(),
    once: vi.fn(),
    quit: vi.fn(),
    exit: vi.fn(),
    whenReady: vi.fn().mockResolvedValue(undefined),
  };
}
