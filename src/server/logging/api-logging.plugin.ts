import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { apiLogger, safeApiLogValue } from './api-logger';

declare module 'fastify' {
  interface FastifyRequest {
    apiLogContext?: {
      startTime: number;
      requestId: string;
    };
  }
}

const MAX_BODY_LOG_LENGTH = 100_000;

function truncateBody(body: unknown): unknown {
  return safeApiLogValue(body, MAX_BODY_LOG_LENGTH);
}

function isStreamResponse(reply: FastifyReply): boolean {
  const contentType = reply.getHeader('content-type');
  if (typeof contentType === 'string') {
    return (
      contentType.includes('text/event-stream') || contentType.includes('application/octet-stream')
    );
  }
  return false;
}

export async function registerApiLogging(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.apiLogContext = {
      startTime: Date.now(),
      requestId: request.id,
    };

    apiLogger.debug({
      type: 'request-start',
      requestId: request.id,
      method: request.method,
      url: request.url,
      query: safeApiLogValue(request.query),
      headers: safeApiLogValue(request.headers),
      ip: request.ip,
      remoteAddress: request.socket?.remoteAddress,
      timestamp: new Date().toISOString(),
    });
  });

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    if (request.body) {
      apiLogger.debug({
        type: 'request-body',
        requestId: request.id,
        method: request.method,
        url: request.url,
        body: truncateBody(request.body),
        timestamp: new Date().toISOString(),
      });
    }
  });

  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      const duration = Date.now() - (request.apiLogContext?.startTime || Date.now());

      if (isStreamResponse(reply)) {
        apiLogger.debug({
          type: 'response-stream',
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          headers: safeApiLogValue(reply.getHeaders()),
          durationMs: duration,
          note: 'Streaming response body not logged',
          timestamp: new Date().toISOString(),
        });
        return payload;
      }

      let parsedPayload: unknown = payload;
      if (typeof payload === 'string') {
        try {
          parsedPayload = JSON.parse(payload);
        } catch {
          parsedPayload = payload;
        }
      }

      apiLogger.debug({
        type: 'response',
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        headers: safeApiLogValue(reply.getHeaders()),
        body: truncateBody(parsedPayload),
        durationMs: duration,
        timestamp: new Date().toISOString(),
      });

      return payload;
    },
  );

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - (request.apiLogContext?.startTime || Date.now());

    apiLogger.info({
      type: 'request-summary',
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: duration,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    });
  });

  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const duration = Date.now() - (request.apiLogContext?.startTime || Date.now());

    apiLogger.error({
      type: 'error',
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  });
}
