import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProxyReplayService, ReplayEntry } from '@/server/modules/proxy/proxy-replay.service';
import { ProxyService } from '@/server/modules/proxy/proxy.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@/ipc/proxy-advanced/service-registry', () => ({
  registerProxyAdvancedService: vi.fn(),
}));

const mockProxyService = {
  handleChatCompletions: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'test' } }] }),
  handleAnthropicMessages: vi.fn().mockResolvedValue({ content: [{ text: 'test' }] }),
  handleGeminiGenerateContent: vi
    .fn()
    .mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'test' }] } }] }),
} as unknown as ProxyService;

describe('ProxyReplayService', () => {
  let service: ProxyReplayService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProxyReplayService(mockProxyService);
  });

  describe('recordRequest', () => {
    it('should record a request entry', () => {
      const entry: ReplayEntry = {
        requestId: 'req-1',
        timestamp: Date.now(),
        endpoint: '/v1/chat/completions',
        method: 'POST',
        body: { model: 'gemini-pro', messages: [] },
        headers: { 'Content-Type': 'application/json' },
      };

      service.recordRequest(entry);
      const recent = service.getRecentRequests(1);

      expect(recent).toHaveLength(1);
      expect(recent[0].requestId).toBe('req-1');
    });

    it('should cap buffer at max size of 20', () => {
      for (let i = 0; i < 25; i++) {
        service.recordRequest({
          requestId: `req-${i}`,
          timestamp: Date.now(),
          endpoint: '/v1/chat/completions',
          method: 'POST',
          body: {},
          headers: {},
        });
      }

      const all = service.getRecentRequests();
      expect(all).toHaveLength(20);
    });

    it('should return requests in reverse chronological order', () => {
      service.recordRequest({
        requestId: 'req-1',
        timestamp: 1000,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        body: {},
        headers: {},
      });
      service.recordRequest({
        requestId: 'req-2',
        timestamp: 2000,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        body: {},
        headers: {},
      });

      const recent = service.getRecentRequests();
      expect(recent[0].requestId).toBe('req-2');
      expect(recent[1].requestId).toBe('req-1');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        service.recordRequest({
          requestId: `req-${i}`,
          timestamp: Date.now(),
          endpoint: '/v1/chat/completions',
          method: 'POST',
          body: {},
          headers: {},
        });
      }

      expect(service.getRecentRequests(2)).toHaveLength(2);
      expect(service.getRecentRequests(10)).toHaveLength(5);
    });
  });

  describe('replayRequest', () => {
    it('should replay a chat completion request', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-chat',
        timestamp: Date.now(),
        endpoint: '/v1/chat/completions',
        method: 'POST',
        body: { model: 'gemini-pro', messages: [{ role: 'user', content: 'hi' }] },
        headers: {},
      };
      service.recordRequest(entry);

      const result = await service.replayRequest('req-chat');

      expect(mockProxyService.handleChatCompletions).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-pro' }),
      );
      expect(result.original).toEqual(entry);
      expect(result.newResponse).toBeDefined();
    });

    it('should replay an anthropic messages request', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-anthropic',
        timestamp: Date.now(),
        endpoint: '/v1/messages',
        method: 'POST',
        body: { model: 'claude-3', messages: [{ role: 'user', content: 'hi' }] },
        headers: {},
      };
      service.recordRequest(entry);

      await service.replayRequest('req-anthropic');
      expect(mockProxyService.handleAnthropicMessages).toHaveBeenCalled();
    });

    it('should replay a responses request', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-responses',
        timestamp: Date.now(),
        endpoint: '/v1/responses',
        method: 'POST',
        body: {
          model: 'gemini-pro',
          instructions: 'Be helpful',
          input: 'Hello',
        },
        headers: {},
      };
      service.recordRequest(entry);

      await service.replayRequest('req-responses');
      expect(mockProxyService.handleChatCompletions).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: 'Be helpful' }),
            expect.objectContaining({ role: 'user', content: 'Hello' }),
          ]),
        }),
      );
    });

    it('should replay an image generation request', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-image',
        timestamp: Date.now(),
        endpoint: '/v1/images/generations',
        method: 'POST',
        body: { prompt: 'A cat', size: '1024x1024' },
        headers: {},
      };
      service.recordRequest(entry);

      await service.replayRequest('req-image');
      expect(mockProxyService.handleChatCompletions).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'A cat' }],
          size: '1024x1024',
        }),
      );
    });

    it('should replay an audio transcription request', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-audio',
        timestamp: Date.now(),
        endpoint: '/v1/audio/transcriptions',
        method: 'POST',
        body: {
          model: 'gemini-pro',
          prompt: 'Transcribe this',
          file: { data: 'base64data', mimeType: 'audio/mp3' },
        },
        headers: {},
      };
      service.recordRequest(entry);

      await service.replayRequest('req-audio');
      expect(mockProxyService.handleGeminiGenerateContent).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown request id', async () => {
      await expect(service.replayRequest('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unsupported endpoint', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-unknown',
        timestamp: Date.now(),
        endpoint: '/v1/unknown',
        method: 'GET',
        body: {},
        headers: {},
      };
      service.recordRequest(entry);

      await expect(service.replayRequest('req-unknown')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing audio data', async () => {
      const entry: ReplayEntry = {
        requestId: 'req-audio-missing',
        timestamp: Date.now(),
        endpoint: '/v1/audio/transcriptions',
        method: 'POST',
        body: { model: 'gemini-pro' },
        headers: {},
      };
      service.recordRequest(entry);

      await expect(service.replayRequest('req-audio-missing')).rejects.toThrow(BadRequestException);
    });
  });
});
