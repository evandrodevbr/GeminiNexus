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
