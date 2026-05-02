import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { isUndefined } from 'lodash-es';
import { expect, vi } from 'vitest';

expect.extend(matchers);

// Mock window and localStorage for Node environment
if (isUndefined((globalThis as { window?: unknown }).window)) {
  global.window = {
    matchMedia: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    scrollTo: vi.fn(),
  } as any;

  (global as any).localStorage = (global as any).window.localStorage;
}

// Ensure HOME is defined for path utils
if (!process.env.HOME) {
  process.env.HOME = '/tmp/test-home';
}
if (!process.env.APPDATA) {
  process.env.APPDATA = '/tmp/test-appdata';
}

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).IntersectionObserver = MockIntersectionObserver;

// Universal Electron mock for testing environments
vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn((name) => `/mock/path/${name}`),
      getName: vi.fn(() => 'Gemini Nexus Test'),
      getVersion: vi.fn(() => '1.0.0'),
      isPackaged: false,
      getLocale: vi.fn(() => 'en-US'),
      getPreferredSystemLanguages: vi.fn(() => ['en-US']),
      requestSingleInstanceLock: vi.fn(() => true),
      quit: vi.fn(),
      disableHardwareAcceleration: vi.fn(),
      setName: vi.fn(),
      commandLine: {
        appendSwitch: vi.fn(),
      },
    },
    ipcMain: {
      on: vi.fn(),
      handle: vi.fn(),
      removeHandler: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    ipcRenderer: {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      invoke: vi.fn(),
      send: vi.fn(),
      postMessage: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      show: vi.fn(),
      close: vi.fn(),
      destroy: vi.fn(),
      webContents: {
        send: vi.fn(),
        on: vi.fn(),
        session: {
          webRequest: {
            onBeforeSendHeaders: vi.fn(),
          }
        }
      },
      on: vi.fn(),
    })),
    dialog: {
      showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
      showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
      showSaveDialog: vi.fn().mockResolvedValue({ canceled: true, filePath: '' }),
    },
    shell: {
      openPath: vi.fn(),
      openExternal: vi.fn(),
    },
    contextBridge: {
      exposeInMainWorld: vi.fn(),
    },
    Tray: vi.fn().mockImplementation(() => ({
      setToolTip: vi.fn(),
      setContextMenu: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    })),
    Menu: {
      buildFromTemplate: vi.fn(),
    },
    nativeTheme: {
      themeSource: 'system',
      shouldUseDarkColors: true,
      on: vi.fn(),
    },
  };
});
