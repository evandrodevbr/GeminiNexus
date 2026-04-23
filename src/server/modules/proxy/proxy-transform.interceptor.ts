import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';
import { isString } from 'lodash-es';

@Injectable()
export class ProxyTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const body = request.body as Record<string, unknown>;

    if (body && typeof body === 'object') {
      // Normalize model field to string
      if (body.model !== undefined && !isString(body.model)) {
        body.model = String(body.model);
      }

      // Ensure messages array exists and elements have required fields
      if (Array.isArray(body.messages)) {
        body.messages = body.messages.map((msg: Record<string, unknown>) => ({
          role: isString(msg.role) ? msg.role : 'user',
          content: msg.content !== undefined ? msg.content : '',
          ...(msg.tool_calls !== undefined ? { tool_calls: msg.tool_calls } : {}),
          ...(msg.tool_call_id !== undefined ? { tool_call_id: msg.tool_call_id } : {}),
        }));
      }

      // Normalize temperature to number if present
      if (body.temperature !== undefined && typeof body.temperature !== 'number') {
        const parsed = parseFloat(String(body.temperature));
        if (!isNaN(parsed)) {
          body.temperature = parsed;
        }
      }

      // Normalize top_p to number if present
      if (body.top_p !== undefined && typeof body.top_p !== 'number') {
        const parsed = parseFloat(String(body.top_p));
        if (!isNaN(parsed)) {
          body.top_p = parsed;
        }
      }

      // Normalize max_tokens to number if present
      if (body.max_tokens !== undefined && typeof body.max_tokens !== 'number') {
        const parsed = parseInt(String(body.max_tokens), 10);
        if (!isNaN(parsed)) {
          body.max_tokens = parsed;
        }
      }
    }

    return next.handle();
  }
}
