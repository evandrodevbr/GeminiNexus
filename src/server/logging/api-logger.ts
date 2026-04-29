import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getAgentDir } from '../../utils/paths';
import { sanitizeObject } from '../../utils/sensitiveDataMasking';

const LOG_RETENTION = '30d';
const LOG_MAX_SIZE = '50m';

let _logger: winston.Logger | null = null;

/**
 * Lazily initializes the API logger on first access.
 * Avoids creating directories and file transports at module load time,
 * preventing EACCES errors in CI/test environments.
 */
function getLogger(): winston.Logger {
  if (_logger) {
    return _logger;
  }

  const agentDir = getAgentDir();

  if (!fs.existsSync(agentDir)) {
    try {
      fs.mkdirSync(agentDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create agent directory for API logs', e);
    }
  }

  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const logEntry = {
        timestamp,
        level,
        message,
        ...meta,
      };
      return JSON.stringify(logEntry);
    }),
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const logEntry = {
        timestamp,
        level,
        message,
        ...meta,
      };
      return JSON.stringify(logEntry);
    }),
  );

  const rotateTransport = new DailyRotateFile({
    filename: path.join(agentDir, 'api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_RETENTION,
    zippedArchive: false,
    auditFile: path.join(agentDir, '.api-log-audit.json'),
    level: 'debug',
    format: fileFormat,
  });

  rotateTransport.on('error', (error) => {
    console.error('DailyRotateFile API transport error', error);
  });

  const consoleTransport = new winston.transports.Console({
    level: 'debug',
    format: consoleFormat,
  });

  consoleTransport.on('error', (error) => {
    console.error('Console API transport error', error);
  });

  _logger = winston.createLogger({
    level: 'debug',
    transports: [consoleTransport, rotateTransport],
    exitOnError: false,
  });

  return _logger;
}

/** Lazily-initialized API logger instance. */
export const apiLogger = new Proxy({} as winston.Logger, {
  get(_target, prop: string) {
    const logger = getLogger();
    const value = logger[prop as keyof winston.Logger];
    if (typeof value === 'function') {
      return value.bind(logger);
    }
    return value;
  },
});

/**
 * Safely serialize a value for API logging.
 * Truncates very large bodies to avoid excessive log sizes.
 */
export function safeApiLogValue(value: unknown, maxLength = 50_000): unknown {
  const sanitized = sanitizeObject(value);

  if (typeof sanitized === 'string' && sanitized.length > maxLength) {
    return (
      sanitized.substring(0, maxLength) + `... [truncated ${sanitized.length - maxLength} chars]`
    );
  }

  const stringified = JSON.stringify(sanitized);
  if (stringified.length > maxLength) {
    return (
      stringified.substring(0, maxLength) +
      `... [truncated ${stringified.length - maxLength} chars]`
    );
  }

  return sanitized;
}
