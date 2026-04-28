import { logger } from '../../utils/logger';
import {
  bootstrapNestServer,
  isNestServerRunning,
  stopNestServer,
} from '../../server/main';
import { ConfigManager } from '../config/manager';

/**
 * Checks if the Gemini Nexus process is running.
 * Uses find-process package for robust cross-platform process detection.
 * @returns {boolean} True if the Gemini Nexus process is running, false otherwise.
 */
export async function isProcessRunning(): Promise<boolean> {
  // Check the embedded NestJS proxy server status instead of an external process
  return isNestServerRunning();
}

/**
 * Closes the Gemini Nexus process.
 * @returns {boolean} True if the Gemini Nexus process is running, false otherwise.
 */
export async function closeGeminiNexus(): Promise<void> {
  logger.info('Stopping Gemini Nexus proxy server...');
  await stopNestServer();
}



/**
 * Waits for the Gemini Nexus process to exit.
 * Polls the NestJS server status until it stops or the timeout is reached.
 * @param timeoutMs {number} Maximum time to wait in milliseconds.
 * @returns {Promise<void>} A promise that resolves when the process exits.
 */
export async function _waitForProcessExit(timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (isNestServerRunning()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timeout waiting for Gemini Nexus proxy server to stop');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Starts the Gemini Nexus process.
 * @param useUri {boolean} Whether to use the URI protocol to start Gemini Nexus.
 * @returns {Promise<void>} A promise that resolves when the process starts.
 */
export async function startGeminiNexus(_useUri = true): Promise<void> {
  logger.info('Starting Gemini Nexus proxy server...');

  if (isNestServerRunning()) {
    logger.info('Gemini Nexus proxy server is already running');
    return;
  }

  const config = ConfigManager.loadConfig();
  if (config.proxy) {
    await bootstrapNestServer(config.proxy);
  } else {
    throw new Error('Proxy configuration not found');
  }
}
