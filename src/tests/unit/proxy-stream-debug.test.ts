import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { ProxyService } from '../../server/modules/proxy/proxy.service';

// Minimal mocks so ProxyService can instantiate
const mockTokenManager = {
  getNextToken: vi.fn(),
  markAsRateLimited: vi.fn(),
  markAsForbidden: vi.fn(),
  forceRefreshToken: vi.fn(),
  markFromUpstreamError: vi.fn(),
  recordParityError: vi.fn(),
  getModelOutputLimitForAccount: vi.fn(),
  getModelThinkingBudgetForAccount: vi.fn(),
  resolveDynamicModelForAccount: vi.fn((_token: unknown, model: string) => model),
};
const mockGeminiClient = { streamGenerateInternal: vi.fn(), generateInternal: vi.fn() };
const mockTokenUsageService = { recordUsage: vi.fn() };

class TestableProxyService extends ProxyService {
  constructor() {
    super(mockTokenManager as any, mockGeminiClient as any, mockTokenUsageService as any);
  }

  public testProcessStreamResponse(
    stream: any,
    model: string = 'gemini-3.1-pro-low',
    requestId?: string,
  ) {
    return (this as any).processStreamResponse(stream, model, requestId);
  }
}

function collectChunks(observable: any): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    observable.subscribe({
      next: (chunk: string) => chunks.push(chunk),
      error: reject,
      complete: () => resolve(chunks),
    });
  });
}

function emitSseLine(stream: EventEmitter, payload: object): void {
  stream.emit('data', Buffer.from(`data: ${JSON.stringify(payload)}\n`));
}

describe('ProxyService Stream Debug', () => {
  it('emits role chunk followed by content for a simple text response', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [{ text: 'Hello world' }],
          },
        },
      ],
    });

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [{ text: '!' }],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('end');

    const chunks = await promise;
    console.log('=== Simple text response chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    // Should have at least role + content + finish + DONE
    expect(chunks.length).toBeGreaterThanOrEqual(4);
    expect(chunks[0]).toContain('"role":"assistant"');
    expect(chunks.some((c) => c.includes('"content":"Hello world"'))).toBe(true);
    expect(chunks.some((c) => c.includes('"finish_reason":"stop"'))).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('[DONE]');
  });

  it('handles empty parts array gracefully', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('end');

    const chunks = await promise;
    console.log('=== Empty parts response chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    // With empty parts, only finish + DONE should be emitted
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => c.includes('"finish_reason":"stop"'))).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('[DONE]');
  });

  it('handles reasoning content (thought parts)', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [{ thought: true, text: 'Let me think...' }],
          },
        },
      ],
    });

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [{ text: 'Final answer' }],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('end');

    const chunks = await promise;
    console.log('=== Reasoning response chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"reasoning_content":"Let me think..."'))).toBe(true);
    expect(chunks.some((c) => c.includes('"content":"Final answer"'))).toBe(true);
  });

  it('handles function call parts', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    emitSseLine(stream, {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  id: 'fc-1',
                  name: 'get_weather',
                  args: { city: 'London' },
                },
              },
            ],
          },
          finishReason: 'STOP',
        },
      ],
    });

    stream.emit('end');

    const chunks = await promise;
    console.log('=== Function call response chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"tool_calls"'))).toBe(true);
    expect(chunks.some((c) => c.includes('"finish_reason":"tool_calls"'))).toBe(true);
  });

  it('handles multiple SSE lines in a single buffer', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    // Simulate two complete SSE lines in one data chunk
    const payload1 = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'First' }] } }],
    });
    const payload2 = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Second' }] }, finishReason: 'STOP' }],
    });
    stream.emit('data', Buffer.from(`data: ${payload1}\ndata: ${payload2}\n`));
    stream.emit('end');

    const chunks = await promise;
    console.log('=== Multi-line buffer chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"content":"First"'))).toBe(true);
    expect(chunks.some((c) => c.includes('"content":"Second"'))).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('[DONE]');
  });

  it('handles partial SSE lines across multiple data events', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    const payload = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Split' }] }, finishReason: 'STOP' }],
    });
    const line = `data: ${payload}\n`;

    // Split the line across two data events
    const mid = Math.floor(line.length / 2);
    stream.emit('data', Buffer.from(line.slice(0, mid)));
    stream.emit('data', Buffer.from(line.slice(mid)));
    stream.emit('end');

    const chunks = await promise;
    console.log('=== Split-line buffer chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"content":"Split"'))).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('[DONE]');
  });

  it('handles Gemini v1internal wrapped response format (response.candidates)', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    // v1internal API wraps the payload in {"response": {"candidates": [...]}}
    stream.emit(
      'data',
      Buffer.from(
        `data: ${JSON.stringify({
          response: {
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello from wrapped' }],
                },
              },
            ],
          },
          traceId: 'abc123',
          metadata: {},
        })}\n`,
      ),
    );

    stream.emit(
      'data',
      Buffer.from(
        `data: ${JSON.stringify({
          response: {
            candidates: [
              {
                content: {
                  parts: [{ text: ' response' }],
                },
                finishReason: 'STOP',
              },
            ],
          },
          traceId: 'abc123',
          metadata: {},
        })}\n`,
      ),
    );

    stream.emit('end');

    const chunks = await promise;
    console.log('=== Wrapped response format chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"content":"Hello from wrapped"'))).toBe(true);
    expect(chunks.some((c) => c.includes('"content":" response"'))).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('[DONE]');
  });

  it('handles Gemini streaming chunks with no content field', async () => {
    const service = new TestableProxyService();
    const stream = new EventEmitter();
    const observable = service.testProcessStreamResponse(stream, 'gemini-3.1-pro-low');

    const promise = collectChunks(observable);

    // Sometimes Gemini sends candidates without content at all
    emitSseLine(stream, {
      candidates: [{ index: 0 }],
    });

    emitSseLine(stream, {
      candidates: [{ content: { parts: [{ text: 'Late content' }] }, finishReason: 'STOP' }],
    });

    stream.emit('end');

    const chunks = await promise;
    console.log('=== No-content-then-late-content chunks ===');
    chunks.forEach((c, i) => console.log(`Chunk ${i}:`, c.trim()));

    expect(chunks.some((c) => c.includes('"content":"Late content"'))).toBe(true);
  });
});
