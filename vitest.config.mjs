import { defineConfig } from 'vitest/config';
import path from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  resolve: {
    alias: [
      { find: 'keytar', replacement: path.resolve(process.cwd(), './src/tests/unit/mocks/keytar.ts') },
      { find: 'better-sqlite3', replacement: path.resolve(process.cwd(), './src/tests/unit/mocks/better-sqlite3.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/tests/unit/**/*.{test,spec}.{ts,tsx}', 'src/tests/integration/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/tests/e2e/**/*'],
    setupFiles: ['src/tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/mocks/',
        '**/*.config.*',
        '**/*.d.ts',
        '.vite/',
        'forge.config.ts',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
});
