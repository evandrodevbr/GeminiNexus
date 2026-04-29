import { describe, expect, it } from 'vitest';
import { EventEmitter } from 'events';
import { ProxyService } from '../../server/modules/proxy/proxy.service';
import { Observable } from 'rxjs';

// Subclass to access private method
class TestableProxyService extends ProxyService {
  constructor() {
    super({} as any, {} as any);
  }

  public testProcessStream(
    stream: any,
    model: string = 'model',
    streamOptions?: { include_usage?: boolean },
  ): Observable<string> {
    return (this as any).processStreamResponse(stream, model, streamOptions);
  }
}

function parseSseChunk(raw: string): Record<string, unknown> {
  const lines = raw.split('\n').filter((l) => l.trim().startsWith('data: '));
  if (lines.length === 0) return {};
  const payload = lines[0].slice(6).trim();
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

describe('ProxyService Tool Streaming (OpenAI format)', () => {
  it('should emit tool call deltas with id+name first, then arguments separately', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStream(stream, 'gpt-4o');

    const chunks: string[] = [];
    const done = new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: (chunk) => chunks.push(chunk),
        error: reject,
        complete: resolve,
      });
    });

    const payload = JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              { functionCall: { id: 'call_123', name: 'get_weather', args: { location: 'NYC' } } },
            ],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('data', Buffer.from(`data: ${payload}\n`));
    stream.emit('end');

    await done;

    const toolCallChunks = chunks.filter((c) => c.includes('"tool_calls"'));
    expect(toolCallChunks.length).toBeGreaterThanOrEqual(2);

    const first = parseSseChunk(toolCallChunks[0]);
    const firstDeltas = (first.choices as any)?.[0]?.delta?.tool_calls as any[];
    expect(firstDeltas).toBeDefined();
    expect(firstDeltas[0].index).toBe(0);
    expect(firstDeltas[0].id).toBe('call_123');
    expect(firstDeltas[0].type).toBe('function');
    expect(firstDeltas[0].function.name).toBe('get_weather');
    expect(firstDeltas[0].function.arguments).toBe('');

    const second = parseSseChunk(toolCallChunks[1]);
    const secondDeltas = (second.choices as any)?.[0]?.delta?.tool_calls as any[];
    expect(secondDeltas).toBeDefined();
    expect(secondDeltas[0].index).toBe(0);
    expect(secondDeltas[0].function.arguments).toBe('{"location":"NYC"}');
    // Subsequent deltas must NOT repeat id/type/name to keep strict clients happy
    expect(secondDeltas[0].id).toBeUndefined();
    expect(secondDeltas[0].type).toBeUndefined();
    expect(secondDeltas[0].function.name).toBeUndefined();
  });

  it('should split large tool arguments into multiple argument deltas', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStream(stream, 'gpt-4o');

    const chunks: string[] = [];
    const done = new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: (chunk) => chunks.push(chunk),
        error: reject,
        complete: resolve,
      });
    });

    const bigArgs = { code: 'a'.repeat(5000) };
    const payload = JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ functionCall: { id: 'call_456', name: 'write_file', args: bigArgs } }],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('data', Buffer.from(`data: ${payload}\n`));
    stream.emit('end');

    await done;

    const toolCallChunks = chunks.filter((c) => c.includes('"tool_calls"'));
    // At least: 1st (id+name) + one or more argument deltas
    expect(toolCallChunks.length).toBeGreaterThanOrEqual(2);

    const first = parseSseChunk(toolCallChunks[0]);
    expect((first.choices as any)[0].delta.tool_calls[0].function.arguments).toBe('');

    // Concatenate all argument deltas
    let argsConcat = '';
    for (let i = 1; i < toolCallChunks.length; i++) {
      const parsed = parseSseChunk(toolCallChunks[i]);
      const argDelta = (parsed.choices as any)?.[0]?.delta?.tool_calls?.[0]?.function?.arguments;
      if (typeof argDelta === 'string') {
        argsConcat += argDelta;
      }
    }
    expect(argsConcat).toBe(JSON.stringify(bigArgs));
  });

  it('should not break normal text streaming when no tools are present', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStream(stream, 'gpt-4o');

    const chunks: string[] = [];
    const done = new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: (chunk) => chunks.push(chunk),
        error: reject,
        complete: resolve,
      });
    });

    const payload = JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: 'hello world' }],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('data', Buffer.from(`data: ${payload}\n`));
    stream.emit('end');

    await done;

    const output = chunks.join('');
    expect(output).toContain('"content":"hello world"');
    expect(output).toContain('data: [DONE]');
    expect(output).not.toContain('"tool_calls"');
  });
});
