import { app } from './app';
import { theme } from './theme';
import { window } from './window';
import { databaseRouter } from './database/router';
import { accountRouter } from './account/router';
import { cloudRouter } from './cloud/router';
import { configRouter } from './config/router';
import { gatewayRouter } from './gateway/router';

import { os } from '@orpc/server';
import { z } from 'zod';
import { isProcessRunning, closeGeminiNexus, startGeminiNexus } from './process/handler';
import { systemHandler } from './system/handler';
import { logger } from '../utils/logger';

// Log middleware setup
const logMiddleware = os.middleware(async (opts: any) => {
  const { next, path, meta } = opts;
  const requestPath = path || meta?.path || 'unknown';

  try {
    const result = await next({});
    return result;
  } catch (err) {
    logger.error(`[ORPC] Error in handler for ${JSON.stringify(requestPath)}:`, err);
    throw err;
  }
});

// Explicit Router Definition
export const router = os.use(logMiddleware).router({
  ping: os.output(z.string()).handler(async () => 'pong'),

  theme,
  window,
  app,
  database: databaseRouter,

  // Inline process router to ensure structure
  proc: os.router({
    isProcessRunning: os.output(z.boolean()).handler(async () => {
      return await isProcessRunning();
    }),
    closeGeminiNexus: os.output(z.void()).handler(async () => {
      await closeGeminiNexus();
    }),
    startGeminiNexus: os.output(z.void()).handler(async () => {
      await startGeminiNexus();
    }),
  }),

  account: accountRouter,
  cloud: cloudRouter,
  config: configRouter,
  gateway: gatewayRouter,
  system: systemHandler,
});
