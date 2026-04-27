import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { registerProxyAdvancedService } from '../../../ipc/proxy-advanced/service-registry';
import { ProxyService } from './proxy.service';
import {
  OpenAIChatRequest,
  AnthropicChatRequest,
  GeminiRequest,
} from './interfaces/request-interfaces';

export interface ReplayEntry {
  requestId: string;
  timestamp: number;
  endpoint: string;
  method: string;
  body: unknown;
  headers: Record<string, unknown>;
  accountId?: string;
  model?: string;
  responseSnapshot?: unknown;
}

@Injectable()
export class ProxyReplayService {
  private readonly logger = new Logger(ProxyReplayService.name);
  private readonly buffer: ReplayEntry[] = [];
  private readonly maxSize = 20;

  constructor(
    @Inject(ProxyService) private readonly proxyService: ProxyService,
  ) {
    registerProxyAdvancedService('proxyReplay', this);
  }

  recordRequest(entry: ReplayEntry): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(entry);
    this.logger.debug(`Recorded request ${entry.requestId} for ${entry.endpoint}`);
  }

  getRecentRequests(limit?: number): ReplayEntry[] {
    const recent = [...this.buffer].reverse();
    if (limit && limit > 0) {
      return recent.slice(0, limit);
    }
    return recent;
  }

  async replayRequest(requestId: string): Promise<{ original: ReplayEntry; newResponse: unknown }> {
    const entry = this.buffer.find((e) => e.requestId === requestId);
    if (!entry) {
      throw new NotFoundException(`Request ${requestId} not found in replay buffer`);
    }

    this.logger.log(`Replaying request ${requestId} for ${entry.endpoint}`);
    const newResponse = await this.executeReplay(entry);
    return { original: entry, newResponse };
  }

  private async executeReplay(entry: ReplayEntry): Promise<unknown> {
    switch (entry.endpoint) {
      case '/v1/chat/completions':
      case '/v1/messages/chat/completions': {
        const body = entry.body as OpenAIChatRequest;
        return this.proxyService.handleChatCompletions(body);
      }
      case '/v1/completions': {
        const originalBody = entry.body as {
          model?: string;
          prompt?: string | string[];
          max_tokens?: number;
          temperature?: number;
          top_p?: number;
          stream?: boolean;
        };
        const request: OpenAIChatRequest = {
          model: originalBody.model ?? 'gemini-3-flash',
          messages: [
            {
              role: 'user',
              content: Array.isArray(originalBody.prompt)
                ? originalBody.prompt.join('\n')
                : (originalBody.prompt ?? ''),
            },
          ],
          max_tokens: originalBody.max_tokens,
          temperature: originalBody.temperature,
          top_p: originalBody.top_p,
          stream: originalBody.stream,
        };
        return this.proxyService.handleChatCompletions(request);
      }
      case '/v1/messages': {
        const body = entry.body as AnthropicChatRequest;
        return this.proxyService.handleAnthropicMessages(body);
      }
      case '/v1/responses': {
        const originalBody = entry.body as {
          model?: string;
          instructions?: string;
          input?: unknown;
          tools?: OpenAIChatRequest['tools'];
          max_output_tokens?: number;
          temperature?: number;
          top_p?: number;
          stream?: boolean;
        };
        const messages: OpenAIChatRequest['messages'] = [];
        if (
          typeof originalBody.instructions === 'string' &&
          originalBody.instructions.trim().length > 0
        ) {
          messages.push({ role: 'system', content: originalBody.instructions });
        }

        const input = originalBody.input;
        if (typeof input === 'string') {
          messages.push({ role: 'user', content: input });
        } else if (Array.isArray(input)) {
          for (const item of input) {
            if (typeof item === 'string') {
              messages.push({ role: 'user', content: item });
            } else if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              if (obj.type === 'message' && typeof obj.content === 'string') {
                messages.push({
                  role: typeof obj.role === 'string' ? obj.role : 'user',
                  content: obj.content,
                });
              } else if (obj.type === 'message') {
                messages.push({
                  role: typeof obj.role === 'string' ? obj.role : 'user',
                  content: JSON.stringify(obj.content),
                });
              }
            }
          }
        }

        if (messages.length === 0) {
          messages.push({ role: 'user', content: '' });
        }

        const request: OpenAIChatRequest = {
          model: originalBody.model ?? 'gemini-3-flash',
          messages,
          tools: originalBody.tools,
          max_tokens: originalBody.max_output_tokens,
          temperature: originalBody.temperature,
          top_p: originalBody.top_p,
          stream: originalBody.stream,
        };
        return this.proxyService.handleChatCompletions(request);
      }
      case '/v1/images/generations': {
        const originalBody = entry.body as {
          model?: string;
          prompt?: string;
          size?: string;
          quality?: string;
        };
        const request: OpenAIChatRequest = {
          model: originalBody.model ?? 'gemini-3-pro-image',
          messages: [{ role: 'user', content: originalBody.prompt ?? '' }],
          stream: false,
          size: originalBody.size,
          quality: originalBody.quality,
        };
        return this.proxyService.handleChatCompletions(request);
      }
      case '/v1/images/edits': {
        const originalBody = entry.body as {
          model?: string;
          prompt?: string;
          size?: string;
          quality?: string;
          image?: string | { data?: string; mimeType?: string };
          reference_images?: Array<string | { data?: string; mimeType?: string }>;
          mask?: string | { data?: string; mimeType?: string };
        };
        const imageParts = this.collectImageContentParts([
          originalBody.image,
          originalBody.mask,
          ...(originalBody.reference_images ?? []),
        ]);
        const request: OpenAIChatRequest = {
          model: originalBody.model ?? 'gemini-3-pro-image',
          messages: [
            {
              role: 'user',
              content:
                imageParts.length > 0
                  ? [
                      {
                        type: 'text' as const,
                        text:
                          originalBody.prompt ??
                          'Please edit this image based on the provided instruction.',
                      },
                      ...imageParts,
                    ]
                  : (originalBody.prompt ??
                    'Please edit this image based on the provided instruction.'),
            },
          ],
          stream: false,
          size: originalBody.size,
          quality: originalBody.quality,
        };
        return this.proxyService.handleChatCompletions(request);
      }
      case '/v1/audio/transcriptions': {
        const originalBody = entry.body as {
          model?: string;
          prompt?: string;
          file?: string | { data?: string; mimeType?: string };
          audio?: string | { data?: string; mimeType?: string };
        };
        const inlineAudio = this.resolveInlineData(originalBody.file ?? originalBody.audio);
        if (!inlineAudio) {
          throw new BadRequestException("Missing 'file' or 'audio' input for replay");
        }
        return this.proxyService.handleGeminiGenerateContent(
          originalBody.model ?? 'gemini-3-flash',
          {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      originalBody.prompt ??
                      'Please transcribe the provided speech audio accurately.',
                  },
                  { inlineData: inlineAudio },
                ],
              },
            ],
          } as GeminiRequest,
        );
      }
      default:
        throw new BadRequestException(`Replay not supported for endpoint ${entry.endpoint}`);
    }
  }

  private collectImageContentParts(
    entries: Array<string | { data?: string; mimeType?: string } | undefined>,
  ): Array<{ type: 'image_url'; image_url: { url: string } }> {
    const parts: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
    for (const entry of entries) {
      const inlineData = this.resolveInlineData(entry);
      if (!inlineData) {
        continue;
      }
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${inlineData.mimeType};base64,${inlineData.data}`,
        },
      });
    }
    return parts;
  }

  private resolveInlineData(input: unknown): { mimeType: string; data: string } | null {
    if (!input) {
      return null;
    }
    if (typeof input === 'string') {
      const dataUri = input.match(/^data:(?<mime>[^;]+);base64,(?<data>[A-Za-z0-9+/=]+)$/);
      if (dataUri?.groups?.mime && dataUri.groups.data) {
        return {
          mimeType: dataUri.groups.mime,
          data: dataUri.groups.data,
        };
      }
      const cleaned = input.replace(/\s+/g, '');
      if (cleaned.length > 0) {
        return {
          mimeType: 'audio/mpeg',
          data: cleaned,
        };
      }
      return null;
    }
    const inputRecord = input as Record<string, unknown>;
    const data = typeof inputRecord.data === 'string' ? inputRecord.data : undefined;
    if (!data) {
      return null;
    }
    return {
      mimeType: typeof inputRecord.mimeType === 'string' ? inputRecord.mimeType : 'audio/mpeg',
      data,
    };
  }
}
