import fs from 'fs';
import path from 'path';
import { isObjectLike } from 'lodash-es';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getAgentDir } from './paths';
import { TrafficLogsRepo } from '../ipc/database/proxyMetricsHandler';

export type TrafficDirection =
  | 'inbound'
  | 'outbound'
  | 'upstream'
  | 'upstream_response'
  | 'sse_chunk'
  | 'error';

export interface TrafficLogEntry {
  timestamp: string;
  direction: TrafficDirection;
  requestId: string;
  endpoint: string;
  method?: string;
  status?: number;
  headers?: Record<string, unknown>;
  body?: unknown;
  chunk?: unknown;
  durationMs?: number;
  error?: {
    message: string;
    stack?: string;
    status?: number;
    body?: unknown;
  };
  metadata?: Record<string, unknown>;
}

const LOG_RETENTION = '30d';
const LOG_MAX_SIZE = '50m';

function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    if (isObjectLike(value)) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

class TrafficLogger {
  private winstonLogger: winston.Logger;

  constructor() {
    const agentDir = getAgentDir();
    const logsDir = path.join(agentDir, 'traffic');

    if (!fs.existsSync(logsDir)) {
      try {
        fs.mkdirSync(logsDir, { recursive: true });
      } catch (e) {
        console.error('Failed to create traffic logs directory', e);
      }
    }

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      }),
    );

    const rotateTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'api-traffic-%DATE%.log'),
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_RETENTION,
      zippedArchive: true,
      auditFile: path.join(logsDir, '.api-traffic-log-audit.json'),
      level: 'debug',
      format: fileFormat,
    });

    rotateTransport.on('error', (error) => {
      console.error('Traffic DailyRotateFile transport error', error);
    });

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message }) => {
        return `[TRAFFIC] ${level}: ${message}`;
      }),
    );

    this.winstonLogger = winston.createLogger({
      level: 'debug',
      transports: [
        rotateTransport,
        new winston.transports.Console({
          level: 'debug',
          format: consoleFormat,
        }),
      ],
      exitOnError: false,
    });
  }

  log(entry: TrafficLogEntry): void {
    const line = safeStringify(entry);
    this.winstonLogger.log({
      level: 'debug',
      message: line,
    });

    try {
      TrafficLogsRepo.insert({
        timestamp: new Date(entry.timestamp).getTime(),
        direction: entry.direction,
        requestId: entry.requestId,
        endpoint: entry.endpoint,
        method: entry.method,
        status: entry.status,
        headers: entry.headers,
        body: entry.body,
        chunk: entry.chunk,
        durationMs: entry.durationMs,
        error: entry.error,
        metadata: entry.metadata,
      });
    } catch (dbError) {
      console.error('Failed to persist traffic log to DB', dbError);
    }
  }

  logInbound(
    requestId: string,
    endpoint: string,
    body: unknown,
    headers?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'inbound',
      requestId,
      endpoint,
      method: 'POST',
      headers: this.sanitizeHeaders(headers),
      body: this.truncateBody(body),
      metadata,
    });
  }

  logOutbound(
    requestId: string,
    endpoint: string,
    status: number,
    body: unknown,
    durationMs: number,
    headers?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'outbound',
      requestId,
      endpoint,
      status,
      headers: this.sanitizeHeaders(headers),
      body: this.truncateBody(body),
      durationMs,
    });
  }

  logUpstream(
    requestId: string,
    endpoint: string,
    body: unknown,
    headers?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'upstream',
      requestId,
      endpoint,
      headers: this.sanitizeHeaders(headers),
      body: this.truncateBody(body),
      metadata,
    });
  }

  logUpstreamResponse(
    requestId: string,
    endpoint: string,
    status: number,
    body: unknown,
    durationMs: number,
    headers?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'upstream_response',
      requestId,
      endpoint,
      status,
      headers: this.sanitizeHeaders(headers),
      body: this.truncateBody(body),
      durationMs,
    });
  }

  logSseChunk(
    requestId: string,
    endpoint: string,
    chunk: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'sse_chunk',
      requestId,
      endpoint,
      chunk: this.truncateBody(chunk),
      metadata,
    });
  }

  logError(
    requestId: string,
    endpoint: string,
    error: Error | unknown,
    status?: number,
    body?: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log({
      timestamp: new Date().toISOString(),
      direction: 'error',
      requestId,
      endpoint,
      status,
      error: {
        message: err.message,
        stack: err.stack,
        status,
        body: this.truncateBody(body),
      },
      metadata,
    });
  }

  private sanitizeHeaders(headers?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!headers) {
      return undefined;
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'authorization' || lowerKey === 'x-api-key' || lowerKey === 'cookie') {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private truncateBody(body: unknown, maxChars = 500_000): unknown {
    if (typeof body === 'string' && body.length > maxChars) {
      return body.slice(0, maxChars) + `... [truncated ${body.length - maxChars} chars]`;
    }
    return body;
  }
}

export const trafficLogger = new TrafficLogger();
