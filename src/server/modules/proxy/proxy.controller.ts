import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Inject,
  Req,
  Logger,
  Optional,
  Param,
  Query,
  Sse,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { isEmpty, isFunction, isNil, isObjectLike, isPlainObject, isString } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { ProxyService, ProxyRequestContext, ProxyConfigOverride } from './proxy.service';
import { ProxyReplayService } from './proxy-replay.service';
import { Observable, interval, map } from 'rxjs';
import { trafficLogger } from '../../../utils/traffic-logger';
import type {
  OpenAIChatRequest,
  AnthropicChatRequest,
  OpenAIChatResponse,
  OpenAIContentPart,
  GeminiRequest,
  GeminiResponse,
} from './interfaces/request-interfaces';
import { ProxyGuard } from './proxy.guard';
import {
  getAllDynamicModels,
  MODEL_LIST_CREATED_AT,
  MODEL_LIST_OWNER,
} from '../../../lib/geminiNexus/ModelMapping';
import { getServerConfig } from '../../server-config';
import { TokenManagerService } from './token-manager.service';
import { ProxyMetricsService } from './proxy-metrics.service';

@Controller('v1')
@UseGuards(ProxyGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(
    @Inject(ProxyService) private readonly proxyService: ProxyService,
    @Optional()
    @Inject(ProxyReplayService)
    private readonly proxyReplayService?: ProxyReplayService,
    @Optional() @Inject(TokenManagerService) private readonly tokenManager?: TokenManagerService,
    @Optional() @Inject(ProxyMetricsService) private readonly proxyMetrics?: ProxyMetricsService,
  ) {}

  @Get('models')
  listModels(@Res() res: FastifyReply) {
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    try {
      const config = getServerConfig();
      const customMapping = config?.custom_mapping ?? {};
      const modelIds = getAllDynamicModels(
        customMapping,
        this.tokenManager?.getAllCollectedModels(),
      );

      const data = modelIds.map((id) => ({
        id,
        object: 'model',
        created: MODEL_LIST_CREATED_AT,
        owned_by: MODEL_LIST_OWNER,
      }));

      res.status(HttpStatus.OK).send({
        object: 'list',
        data,
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint: '/v1/models',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list models';
      this.logger.error(message, error instanceof Error ? error.stack : undefined);
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const { type, code } = this.resolveOpenAIErrorTypeAndCode(status, message);
      const errorPayload: Record<string, unknown> = {
        message,
        type,
      };
      if (code) {
        errorPayload.code = code;
      }
      res.status(status).send({
        error: errorPayload,
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status,
        endpoint: '/v1/models',
      });
    } finally {
      this.proxyMetrics?.decrementActiveConnections();
    }
  }

  @Get('status')
  async getStatus(@Res() res: FastifyReply) {
    const startTime = Date.now();
    try {
      const metrics = this.proxyMetrics?.getMetrics();
      const circuitBreakerStatus = this.tokenManager?.getCircuitBreakerStatus() ?? {};
      const accountCount = Object.keys(circuitBreakerStatus).length;
      const healthyAccounts = Object.values(circuitBreakerStatus).filter(
        (s) => s.state === 'healthy',
      ).length;

      res.status(HttpStatus.OK).send({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        accounts: {
          total: accountCount,
          healthy: healthyAccounts,
        },
        metrics: {
          requestsPerMinute: metrics?.requestsPerMinute ?? 0,
          avgLatency: metrics?.avgLatency ?? 0,
          errorRate: metrics?.errorRate ?? 0,
          activeConnections: metrics?.activeConnections ?? 0,
        },
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint: '/v1/status',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get status';
      this.logger.error(message, error instanceof Error ? error.stack : undefined);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: {
          message,
          type: 'internal_server_error',
        },
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        endpoint: '/v1/status',
      });
    }
  }

  @Get('replay/requests')
  async getReplayRequests(@Query('limit') limit?: string, @Res() res?: FastifyReply) {
    if (!res) {
      throw new Error('Response object is required');
    }
    const startTime = Date.now();
    try {
      const requests =
        this.proxyReplayService?.getRecentRequests(limit ? parseInt(limit, 10) : undefined) ?? [];
      this.setProxyHeaders(res, { requestId: uuidv4(), accountId: '', retryCount: 0, model: '' });
      res.status(HttpStatus.OK).send({
        object: 'list',
        data: requests,
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint: '/v1/replay/requests',
      });
    } catch (error) {
      this.sendOpenAIErrorResponse(res, '/v1/replay/requests', error);
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        endpoint: '/v1/replay/requests',
      });
    }
  }

  @Post('replay/:requestId')
  async replayRequest(@Param('requestId') requestId: string, @Res() res: FastifyReply) {
    const startTime = Date.now();
    try {
      if (!this.proxyReplayService) {
        throw new Error('Replay service not available');
      }
      const result = await this.proxyReplayService.replayRequest(requestId);
      this.setProxyHeaders(res, { requestId: uuidv4(), accountId: '', retryCount: 0, model: '' });
      res.status(HttpStatus.OK).send(result);
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint: '/v1/replay/:requestId',
      });
    } catch (error) {
      this.sendOpenAIErrorResponse(res, '/v1/replay/:requestId', error);
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        endpoint: '/v1/replay/:requestId',
      });
    }
  }

  @Get('models/capabilities')
  listModelCapabilities(@Res() res: FastifyReply) {
    const startTime = Date.now();
    try {
      const config = getServerConfig();
      const customMapping = config?.custom_mapping ?? {};
      const modelIds = getAllDynamicModels(
        customMapping,
        this.tokenManager?.getAllCollectedModels(),
      );

      const capabilitiesMap = this.buildCapabilitiesMap();

      const data = modelIds.map((id) => {
        const baseId =
          Object.keys(capabilitiesMap).find((key) => id.includes(key)) ?? 'gemini-3-flash';
        return {
          id,
          object: 'model_capability',
          capabilities: capabilitiesMap[baseId] ?? capabilitiesMap['gemini-3-flash'],
        };
      });

      res.status(HttpStatus.OK).send({
        object: 'list',
        data,
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint: '/v1/models/capabilities',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list model capabilities';
      this.logger.error(message, error instanceof Error ? error.stack : undefined);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: { message, type: 'internal_server_error' } });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        endpoint: '/v1/models/capabilities',
      });
    }
  }

  private buildCapabilitiesMap(): Record<
    string,
    {
      vision: boolean;
      streaming: boolean;
      jsonMode: boolean;
      audio: boolean;
      imageGeneration: boolean;
    }
  > {
    const allTokens = this.tokenManager?.getAllTokens() ?? [];
    const map: Record<
      string,
      {
        vision: boolean;
        streaming: boolean;
        jsonMode: boolean;
        audio: boolean;
        imageGeneration: boolean;
      }
    > = {};

    for (const [, tokenData] of allTokens) {
      for (const [modelId, modelInfo] of Object.entries(tokenData.quota?.models ?? {})) {
        if (map[modelId]) continue;
        const baseId = modelId.toLowerCase();
        const isProImage = baseId.includes('gemini-3-pro') && baseId.includes('image');
        map[baseId] = {
          vision: modelInfo.supports_images ?? false,
          streaming: isProImage ? false : true,
          jsonMode: isProImage ? false : true,
          audio: false,
          imageGeneration: baseId.includes('gemini-3-pro') && !baseId.includes('flash'),
        };
      }
    }

    if (Object.keys(map).length === 0) {
      return {
        'gemini-3-flash': {
          vision: true,
          streaming: true,
          jsonMode: true,
          audio: false,
          imageGeneration: false,
        },
      };
    }

    return map;
  }

  @Post('batch/completions')
  async batchCompletions(
    @Body() body: { requests: OpenAIChatRequest[] },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const startTime = Date.now();
    const endpoint = '/v1/batch/completions';
    this.proxyMetrics?.incrementActiveConnections();
    try {
      const requests = Array.isArray(body?.requests) ? body.requests : [];
      const responses: unknown[] = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        const proxyContext: ProxyRequestContext = {};
        try {
          const result = await this.proxyService.handleChatCompletions(request, proxyContext);
          if (this.isObservableLike(result)) {
            responses.push({
              index: i,
              error: {
                message: 'Streaming not supported in batch mode',
                type: 'invalid_request_error',
              },
            });
          } else {
            responses.push({
              index: i,
              response: result,
            });
          }
        } catch (error) {
          responses.push({
            index: i,
            error: {
              message: error instanceof Error ? error.message : 'Request failed',
              type: 'api_error',
            },
          });
        }
      }

      this.setProxyHeaders(res, { requestId: uuidv4(), accountId: '', retryCount: 0, model: '' });
      res.status(HttpStatus.OK).send({
        object: 'list',
        data: responses,
      });
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint,
      });
    } catch (error) {
      this.sendOpenAIErrorResponse(res, endpoint, error);
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        endpoint,
      });
    } finally {
      this.proxyMetrics?.decrementActiveConnections();
    }
  }

  @Sse('events')
  proxyEvents() {
    const startTime = Date.now();
    this.proxyMetrics?.recordRequest({
      timestamp: startTime,
      duration: 0,
      status: HttpStatus.OK,
      endpoint: '/v1/events',
    });

    return interval(5000).pipe(
      map((tick) => {
        const metrics = this.proxyMetrics?.getMetrics();
        return {
          data: {
            type: 'heartbeat',
            tick,
            timestamp: Date.now(),
            metrics,
          },
        };
      }),
    );
  }

  @Post('chat/completions')
  async chatCompletions(
    @Body() body: OpenAIChatRequest,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/chat/completions',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    await this.respondOpenAIChatCompletions(body, res, req);
  }

  /**
   * Alias route: some clients (e.g. OpenCode configured with baseURL ending in /v1/messages)
   * send requests to /v1/messages/chat/completions. Forward to the same handler so those
   * clients do not receive a 404.
   */
  @Post('messages/chat/completions')
  async messagesCompletionsAlias(
    @Body() body: OpenAIChatRequest,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/messages/chat/completions',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    await this.respondOpenAIChatCompletions(body, res, req);
  }

  @Post('completions')
  async completions(
    @Body()
    body: {
      model?: string;
      prompt?: string | string[];
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      stream?: boolean;
    },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/completions',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    const request: OpenAIChatRequest = {
      model: body.model ?? 'gemini-3-flash',
      messages: [
        {
          role: 'user',
          content: this.normalizeCompletionPrompt(body.prompt),
        },
      ],
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      top_p: body.top_p,
      stream: body.stream,
    };
    const proxyContext: ProxyRequestContext = {};
    let isStream = false;
    try {
      const result = await this.proxyService.handleChatCompletions(request, proxyContext);
      isStream = !!(body.stream && this.isObservableLike(result));
      if (isStream) {
        this.writeSseResponse(
          res,
          result as Observable<unknown>,
          undefined,
          '/v1/completions',
          startTime,
          proxyContext,
        );
        return;
      }

      const response = result as OpenAIChatResponse;
      const duration = Date.now() - startTime;
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status: HttpStatus.OK,
        endpoint: '/v1/completions',
      });
      if (response.usage?.total_tokens) {
        this.proxyMetrics?.recordTokens(response.usage.total_tokens);
      }
      this.setProxyHeaders(res, proxyContext);
      res.status(HttpStatus.OK).send(this.toLegacyTextCompletionsResponse(response));
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = this.resolveErrorHttpStatus(error instanceof Error ? error.message : '');
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status,
        endpoint: '/v1/completions',
      });
      this.sendOpenAIErrorResponse(res, '/v1/completions', error);
    } finally {
      if (!isStream) {
        this.proxyMetrics?.decrementActiveConnections();
      }
    }
  }

  @Post('responses')
  async responses(
    @Body()
    body: {
      model?: string;
      instructions?: string;
      input?: unknown;
      tools?: OpenAIChatRequest['tools'];
      max_output_tokens?: number;
      temperature?: number;
      top_p?: number;
      stream?: boolean;
      reasoning?: { effort?: string };
    },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/responses',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    const request = this.buildResponsesChatRequest(body);
    const proxyContext: ProxyRequestContext = {};
    let isStream = false;

    this.logger.log(
      `[/v1/responses] Converted input: ${Array.isArray(body.input) ? body.input.length : 0} items → ${request.messages.length} messages, ` +
        `model=${request.model}, stream=${body.stream}, tools=${request.tools?.length ?? 0}, ` +
        `reasoning=${body.reasoning?.effort ?? 'default'}`,
    );

    try {
      const result = await this.proxyService.handleChatCompletions(request, proxyContext);
      isStream = !!(body.stream && this.isObservableLike(result));
      if (isStream) {
        this.writeSseResponse(
          res,
          result as Observable<unknown>,
          undefined,
          '/v1/responses',
          startTime,
          proxyContext,
        );
        return;
      }

      const response = result as OpenAIChatResponse;
      const duration = Date.now() - startTime;
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status: HttpStatus.OK,
        endpoint: '/v1/responses',
      });
      if (response.usage?.total_tokens) {
        this.proxyMetrics?.recordTokens(response.usage.total_tokens);
      }
      this.setProxyHeaders(res, proxyContext);
      res.status(HttpStatus.OK).send(this.toLegacyTextCompletionsResponse(response));
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = this.resolveErrorHttpStatus(error instanceof Error ? error.message : '');
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status,
        endpoint: '/v1/responses',
      });
      this.sendOpenAIErrorResponse(res, '/v1/responses', error);
    } finally {
      if (!isStream) {
        this.proxyMetrics?.decrementActiveConnections();
      }
    }
  }

  @Post('images/generations')
  async imageGenerations(
    @Body()
    body: {
      model?: string;
      prompt?: string;
      size?: string;
      quality?: string;
    },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/images/generations',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    const request: OpenAIChatRequest = {
      model: body.model ?? 'gemini-3-pro-image',
      messages: [
        {
          role: 'user',
          content: body.prompt ?? '',
        },
      ],
      stream: false,
      size: body.size,
      quality: body.quality,
    };

    await this.sendOpenAIImageGenerationResponse(request, body.prompt ?? '', res);
  }

  @Post('images/edits')
  async imageEdits(
    @Body()
    body: {
      model?: string;
      prompt?: string;
      size?: string;
      quality?: string;
      image?: string | { data?: string; mimeType?: string };
      reference_images?: Array<string | { data?: string; mimeType?: string }>;
      mask?: string | { data?: string; mimeType?: string };
    },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/images/edits',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    if (!this.hasMultipartBoundary(req)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid `boundary` for `multipart/form-data` request');
      return;
    }

    const imageParts = this.collectImageContentParts([
      body.image,
      body.mask,
      ...(body.reference_images ?? []),
    ]);

    const request: OpenAIChatRequest = {
      model: body.model ?? 'gemini-3-pro-image',
      messages: [
        {
          role: 'user',
          content:
            imageParts.length > 0
              ? [
                  {
                    type: 'text',
                    text:
                      body.prompt ?? 'Please edit this image based on the provided instruction.',
                  },
                  ...imageParts,
                ]
              : (body.prompt ?? 'Please edit this image based on the provided instruction.'),
        },
      ],
      stream: false,
      size: body.size,
      quality: body.quality,
    };

    await this.sendOpenAIImageGenerationResponse(request, body.prompt ?? '', res);
  }

  @Post('audio/transcriptions')
  async audioTranscriptions(
    @Body()
    body: {
      model?: string;
      prompt?: string;
      file?: string | { data?: string; mimeType?: string };
      audio?: string | { data?: string; mimeType?: string };
    },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    const endpoint = '/v1/audio/transcriptions';
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/audio/transcriptions',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    if (!this.hasMultipartBoundary(req)) {
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.BAD_REQUEST,
        endpoint,
      });
      this.proxyMetrics?.decrementActiveConnections();
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid `boundary` for `multipart/form-data` request');
      return;
    }

    const inlineAudio = this.resolveInlineData(body.file ?? body.audio);
    if (!inlineAudio) {
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.BAD_REQUEST,
        endpoint,
      });
      this.proxyMetrics?.decrementActiveConnections();
      res.status(HttpStatus.BAD_REQUEST).send({
        error: {
          message: "Missing 'file' or 'audio' input. Provide base64 content or a data URL.",
          type: 'invalid_request_error',
        },
      });
      return;
    }

    try {
      const result = await this.proxyService.handleGeminiGenerateContent(
        body.model ?? 'gemini-3-flash',
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: body.prompt ?? 'Please transcribe the provided speech audio accurately.',
                },
                {
                  inlineData: inlineAudio,
                },
              ],
            },
          ],
        },
      );

      const text = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();

      const duration = Date.now() - startTime;
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status: HttpStatus.OK,
        endpoint,
      });
      if (result.usageMetadata?.totalTokenCount) {
        this.proxyMetrics?.recordTokens(result.usageMetadata.totalTokenCount);
      }
      res.status(HttpStatus.OK).send({
        text: text ?? '',
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = this.resolveErrorHttpStatus(error instanceof Error ? error.message : '');
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status,
        endpoint,
      });
      this.sendOpenAIErrorResponse(res, endpoint, error);
    } finally {
      this.proxyMetrics?.decrementActiveConnections();
    }
  }

  private setProxyHeaders(res: FastifyReply, context: ProxyRequestContext): void {
    if (context.accountId) {
      res.header('X-Proxy-Account-Used', context.accountId);
    }
    if (typeof context.retryCount === 'number') {
      res.header('X-Proxy-Retry-Count', String(context.retryCount));
    }
    if (context.model) {
      res.header('X-Proxy-Model-Used', context.model);
    }
    if (context.requestId) {
      res.header('X-Proxy-Request-Id', context.requestId);
    }
    if (context?.cacheStatus) {
      res.header('X-Proxy-Cache-Status', context.cacheStatus);
    }
  }

  private extractConfigOverride(req: FastifyRequest): ProxyConfigOverride {
    const headers = req.headers as Record<string, string | undefined>;
    const override: ProxyConfigOverride = {};
    if (headers['x-proxy-account-id']) {
      override.accountId = headers['x-proxy-account-id'];
    }
    if (headers['x-proxy-scheduling-mode']) {
      const mode = headers['x-proxy-scheduling-mode'];
      if (mode === 'cache-first' || mode === 'balance' || mode === 'performance-first') {
        override.schedulingMode = mode;
      }
    }
    if (headers['x-proxy-max-retries']) {
      const maxRetries = parseInt(headers['x-proxy-max-retries'], 10);
      if (!isNaN(maxRetries) && maxRetries >= 0) {
        override.maxRetries = maxRetries;
      }
    }
    if (headers['x-proxy-timeout']) {
      const timeout = parseInt(headers['x-proxy-timeout'], 10);
      if (!isNaN(timeout) && timeout > 0) {
        override.timeout = timeout;
      }
    }
    return override;
  }

  private async respondOpenAIChatCompletions(
    body: OpenAIChatRequest,
    res: FastifyReply,
    req?: FastifyRequest,
  ) {
    this.proxyMetrics?.incrementActiveConnections();
    const requestId = uuidv4();
    const startTime = Date.now();
    trafficLogger.logInbound(requestId, '/v1/chat/completions', body, undefined, {
      stream: body.stream,
      model: body.model,
    });

    // Extract x-session-affinity header so OpenCode session stickiness works even when
    // the request body does not carry an explicit session_id field.
    const headerSessionKey = req
      ? (req.headers['x-session-affinity'] as string | undefined)
      : undefined;

    const proxyContext: ProxyRequestContext = {};
    let isStream = false;
    try {
      const result = await this.proxyService.handleChatCompletions(body, proxyContext);

      isStream = !!(body.stream && this.isObservableLike(result));
      if (isStream) {
        this.writeSseResponse(
          res,
          result as Observable<unknown>,
          requestId,
          '/v1/chat/completions',
          startTime,
          proxyContext,
        );
        return;
      } else {
        const duration = Date.now() - startTime;
        const response = result as OpenAIChatResponse;
        const usage = response.usage;
        trafficLogger.logOutbound(
          requestId,
          '/v1/chat/completions',
          HttpStatus.OK,
          result,
          duration,
          undefined,
          {
            model: response.model || body.model,
            tokensPrompt: usage?.prompt_tokens ?? 0,
            tokensCompletion: usage?.completion_tokens ?? 0,
            tokensTotal: usage?.total_tokens ?? 0,
          },
        );
        this.proxyMetrics?.recordRequest({
          timestamp: startTime,
          duration,
          status: HttpStatus.OK,
          endpoint: '/v1/chat/completions',
        });
        if (usage?.total_tokens) {
          this.proxyMetrics?.recordTokens(usage.total_tokens);
        }
        this.setProxyHeaders(res, proxyContext);
        res.status(HttpStatus.OK).send(result);
      }
    } catch (error) {
      trafficLogger.logError(requestId, '/v1/chat/completions', error);
      const duration = Date.now() - startTime;
      const status = this.resolveErrorHttpStatus(error instanceof Error ? error.message : '');
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status,
        endpoint: '/v1/chat/completions',
      });
      this.sendOpenAIErrorResponse(res, '/v1/chat/completions', error);
    } finally {
      if (!isStream) {
        this.proxyMetrics?.decrementActiveConnections();
      }
    }
  }

  @Post('messages')
  async anthropicMessages(
    @Body() body: AnthropicChatRequest,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    this.proxyReplayService?.recordRequest({
      requestId: uuidv4(),
      timestamp: Date.now(),
      endpoint: '/v1/messages',
      method: 'POST',
      body,
      headers: req.headers as Record<string, unknown>,
      model: body.model,
    });
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    let isStream = false;
    const proxyContext: ProxyRequestContext = {
      requestId: uuidv4(),
      accountId: '',
      retryCount: 0,
      model: body.model || '',
    };
    try {
      const result = await this.proxyService.handleAnthropicMessages(body, proxyContext);
      isStream = !!(body.stream && this.isObservableLike(result));

      if (isStream) {
        this.writeSseResponse(
          res,
          result as Observable<unknown>,
          undefined,
          '/v1/messages',
          startTime,
          proxyContext,
        );
        return;
      } else {
        const duration = Date.now() - startTime;
        this.proxyMetrics?.recordRequest({
          timestamp: startTime,
          duration,
          status: HttpStatus.OK,
          endpoint: '/v1/messages',
        });
        this.setProxyHeaders(res, proxyContext);
        res.status(HttpStatus.OK).send(result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = this.resolveErrorHttpStatus(error instanceof Error ? error.message : '');
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration,
        status,
        endpoint: '/v1/messages',
      });
      this.sendAnthropicErrorResponse(res, '/v1/messages', error);
    } finally {
      if (!isStream) {
        this.proxyMetrics?.decrementActiveConnections();
      }
    }
  }

  private normalizeCompletionPrompt(prompt: string | string[] | undefined): string {
    if (!prompt) {
      return '';
    }
    if (Array.isArray(prompt)) {
      return prompt.join('\n');
    }
    return prompt;
  }

  private toLegacyTextCompletionsResponse(response: OpenAIChatResponse): Record<string, unknown> {
    const choice = response.choices?.[0];
    const content = choice?.message?.content;
    const text = isString(content) ? content : '';

    return {
      id: response.id,
      object: 'text_completion',
      created: response.created,
      model: response.model,
      choices: [
        {
          text,
          index: choice?.index ?? 0,
          logprobs: null,
          finish_reason: choice?.finish_reason ?? null,
        },
      ],
      usage: response.usage,
    };
  }

  private normalizeResponsesInput(input: unknown): string {
    if (isString(input)) {
      return input;
    }

    if (Array.isArray(input)) {
      return input
        .map((item) => {
          if (isString(item)) {
            return item;
          }
          const itemRecord = this.toRecord(item);
          const content = this.asString(itemRecord?.content);
          if (content) {
            return content;
          }
          return JSON.stringify(item);
        })
        .join('\n');
    }

    if (isNil(input)) {
      return '';
    }

    return JSON.stringify(input);
  }

  private buildResponsesChatRequest(body: {
    model?: string;
    instructions?: string;
    input?: unknown;
    tools?: OpenAIChatRequest['tools'];
    max_output_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    reasoning?: { effort?: string };
  }): OpenAIChatRequest {
    const messages: OpenAIChatRequest['messages'] = [];
    if (isString(body.instructions) && !isEmpty(body.instructions.trim())) {
      messages.push({
        role: 'system',
        content: body.instructions,
      });
    }

    const callIdToToolName = new Map<string, string>();
    const inputItems = Array.isArray(body.input) ? body.input : null;

    if (inputItems) {
      for (const item of inputItems) {
        const itemObj = this.toRecord(item);
        if (!itemObj) {
          continue;
        }

        const type = this.asString(itemObj.type);
        if (!type) {
          continue;
        }

        if (type === 'function_call' || type === 'local_shell_call' || type === 'web_search_call') {
          const callId =
            this.asString(itemObj.call_id) ?? this.asString(itemObj.id) ?? `call_${Date.now()}`;
          const toolName =
            type === 'local_shell_call'
              ? 'shell'
              : type === 'web_search_call'
                ? 'builtin_web_search'
                : (this.asString(itemObj.name) ?? 'unknown');
          callIdToToolName.set(callId, toolName);
        }
      }

      for (let idx = 0; idx < inputItems.length; idx++) {
        const item = inputItems[idx];
        const itemObj = this.toRecord(item);
        if (!itemObj) {
          this.logger.debug(`[/v1/responses] input[${idx}]: skipped (not an object)`);
          continue;
        }

        const type = this.asString(itemObj.type);
        const role = this.asString(itemObj.role);

        // Items without a type but with role/content — treat as regular chat messages
        // (common in clients like Open CoDesign that mix chat and responses formats)
        if (!type) {
          if (role && itemObj.content !== undefined) {
            const content = this.normalizeResponsesMessageContent(itemObj.content);
            messages.push({ role, content });
            this.logger.debug(`[/v1/responses] input[${idx}]: no-type fallback → role=${role}`);
          } else {
            this.logger.warn(
              `[/v1/responses] input[${idx}]: dropped (no type, no role/content). Keys: ${Object.keys(itemObj).join(',')}`,
            );
          }
          continue;
        }

        if (type === 'message') {
          const messageRole = role ?? 'user';
          const content = this.normalizeResponsesMessageContent(itemObj.content);
          messages.push({ role: messageRole, content });
          this.logger.debug(`[/v1/responses] input[${idx}]: type=message, role=${messageRole}`);
          continue;
        }

        // Responses API text item types
        if (type === 'input_text') {
          const text = this.asString(itemObj.text) ?? '';
          if (text) {
            messages.push({ role: 'user', content: text });
          }
          continue;
        }

        if (type === 'output_text') {
          const text = this.asString(itemObj.text) ?? '';
          if (text) {
            messages.push({ role: 'assistant', content: text });
          }
          continue;
        }

        // Reasoning items can be silently skipped — they are model-internal
        if (type === 'reasoning') {
          continue;
        }

        if (type === 'function_call' || type === 'local_shell_call' || type === 'web_search_call') {
          const callId =
            this.asString(itemObj.call_id) ?? this.asString(itemObj.id) ?? `call_${Date.now()}`;
          const toolName = callIdToToolName.get(callId) ?? 'unknown';
          const args = this.resolveToolArguments(type, itemObj);
          messages.push({
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                id: callId,
                type: 'function',
                function: {
                  name: toolName,
                  arguments: JSON.stringify(args),
                },
              },
            ],
          });
          continue;
        }

        if (type === 'function_call_output' || type === 'custom_tool_call_output') {
          const callId = this.asString(itemObj.call_id) ?? this.asString(itemObj.id) ?? 'unknown';
          const output = itemObj.output;
          messages.push({
            role: 'tool',
            tool_call_id: callId,
            name: callIdToToolName.get(callId) ?? 'unknown',
            content: this.normalizeResponsesOutput(output),
          });
          continue;
        }

        // Fallback: if the item has role + content but an unrecognized type, treat as message
        const fallbackRole = this.asString(itemObj.role);
        if (fallbackRole && itemObj.content !== undefined) {
          const content = this.normalizeResponsesMessageContent(itemObj.content);
          messages.push({ role: fallbackRole, content });
        }
      }
    } else if (isString(body.input)) {
      messages.push({
        role: 'user',
        content: body.input,
      });
    } else if (!isNil(body.input)) {
      messages.push({
        role: 'user',
        content: this.normalizeResponsesInput(body.input),
      });
    }

    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: '',
      });
    }

    // Forward reasoning effort to the extra field so convertOpenAIToClaude can relay it
    const extra: Record<string, unknown> = {};
    if (body.reasoning?.effort) {
      extra.reasoning_effort = body.reasoning.effort;
    }

    // Normalize Responses API tool format to Chat Completions format.
    // Responses API: { type: "function", name: "...", parameters: {...} }
    // Chat Completions: { type: "function", function: { name: "...", parameters: {...} } }
    const normalizedTools = this.normalizeResponsesTools(body.tools);

    return {
      model: body.model ?? 'gemini-3-flash',
      messages,
      tools: normalizedTools,
      max_tokens: body.max_output_tokens,
      temperature: body.temperature,
      top_p: body.top_p,
      stream: body.stream,
      ...(Object.keys(extra).length > 0 ? { extra } : {}),
    };
  }

  /**
   * Convert tools from OpenAI Responses API format to Chat Completions format.
   * Responses API puts name/description/parameters at the top level of the tool object,
   * while Chat Completions nests them under a `.function` property.
   */
  private normalizeResponsesTools(tools?: OpenAIChatRequest['tools']): OpenAIChatRequest['tools'] {
    if (!tools || tools.length === 0) {
      return tools;
    }

    return tools.map((tool) => {
      // Already in Chat Completions format (has .function.name)
      if (tool.function?.name) {
        return tool;
      }

      // Responses API format: name/description/parameters at top level
      const topLevelName = this.asString((tool as Record<string, unknown>).name);
      if (topLevelName) {
        const raw = tool as Record<string, unknown>;
        return {
          type: 'function',
          function: {
            name: topLevelName,
            description: this.asString(raw.description) ?? undefined,
            parameters: (raw.parameters ?? raw.input_schema) as Record<string, unknown> | undefined,
          },
        };
      }

      // Unknown format — pass through as-is
      return tool;
    });
  }

  private normalizeResponsesMessageContent(content: unknown): string | OpenAIContentPart[] {
    if (isString(content)) {
      return content;
    }

    if (!Array.isArray(content)) {
      return this.normalizeResponsesInput(content);
    }

    const textParts: string[] = [];
    const imageParts: OpenAIContentPart[] = [];

    for (const item of content) {
      const block = this.toRecord(item);
      if (!block) {
        continue;
      }

      const blockType = this.asString(block.type);
      if (blockType === 'input_text' || blockType === 'text' || blockType === 'output_text') {
        const text = this.asString(block.text);
        if (text) {
          textParts.push(text);
        }
        continue;
      }

      if (blockType === 'input_image' || blockType === 'image_url') {
        const imageUrl = this.resolveImageUrl(block);
        if (imageUrl) {
          imageParts.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          });
        }
      }
    }

    if (imageParts.length === 0) {
      return textParts.join('\n');
    }

    const merged: OpenAIContentPart[] = [];
    if (textParts.length > 0) {
      merged.push({
        type: 'text',
        text: textParts.join('\n'),
      });
    }
    merged.push(...imageParts);
    return merged;
  }

  private resolveToolArguments(
    type: string,
    item: Record<string, unknown>,
  ): Record<string, unknown> {
    if (type === 'local_shell_call') {
      const action = this.toRecord(item.action);
      const exec = action ? this.toRecord(action.exec) : null;
      const command = this.asString(exec?.command);
      return {
        command: command ? [command] : [],
      };
    }

    if (type === 'web_search_call') {
      const action = this.toRecord(item.action);
      return {
        query: this.asString(action?.query) ?? '',
      };
    }

    const raw = item.arguments;
    if (isString(raw)) {
      try {
        const parsed = JSON.parse(raw);
        const parsedRecord = this.toRecord(parsed);
        if (parsedRecord) {
          return parsedRecord;
        }
        return {
          value: parsed,
        };
      } catch {
        return {
          raw,
        };
      }
    }

    const rawRecord = this.toRecord(raw);
    if (rawRecord) {
      return rawRecord;
    }

    return {};
  }

  private normalizeResponsesOutput(output: unknown): string {
    if (isString(output)) {
      return output;
    }
    const outputRecord = this.toRecord(output);
    const content = this.asString(outputRecord?.content);
    if (content) {
      return content;
    }
    if (isNil(output)) {
      return '';
    }
    return JSON.stringify(output);
  }

  private resolveImageUrl(block: Record<string, unknown>): string | null {
    const raw = block.image_url;
    if (isString(raw)) {
      return raw;
    }
    const rawRecord = this.toRecord(raw);
    const url = this.asString(rawRecord?.url);
    if (url) {
      return url;
    }
    return null;
  }

  private collectImageContentParts(
    entries: Array<string | { data?: string; mimeType?: string } | undefined>,
  ): OpenAIContentPart[] {
    const parts: OpenAIContentPart[] = [];
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

  private resolveInlineData(input: unknown): {
    mimeType: string;
    data: string;
  } | null {
    if (!input) {
      return null;
    }

    if (isString(input)) {
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

    const inputRecord = this.toRecord(input);
    if (inputRecord) {
      const data = this.asString(inputRecord.data);
      if (!data) {
        return null;
      }
      return {
        mimeType: this.asString(inputRecord.mimeType) ?? 'audio/mpeg',
        data,
      };
    }

    return null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!isPlainObject(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | null {
    return isString(value) ? value : null;
  }

  private isObservableLike(value: unknown): value is Observable<unknown> {
    return isObjectLike(value) && isFunction((value as { subscribe?: unknown }).subscribe);
  }

  private extractAndRecordTokens(payload: string, requestId?: string, endpoint?: string): void {
    try {
      const lines = payload.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) {
          continue;
        }
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') {
          continue;
        }
        const parsed = JSON.parse(jsonStr);
        const usageMetadata = parsed?.usageMetadata;
        if (usageMetadata && typeof usageMetadata.totalTokenCount === 'number') {
          this.proxyMetrics?.recordTokens(usageMetadata.totalTokenCount);
          // Log final token counts for this stream
          if (requestId && endpoint) {
            trafficLogger.logSseChunk(requestId, endpoint, undefined, {
              model: parsed?.model,
              tokensPrompt: usageMetadata.promptTokenCount ?? 0,
              tokensCompletion: usageMetadata.candidatesTokenCount ?? 0,
              tokensTotal: usageMetadata.totalTokenCount,
            });
          }
          return;
        }
        const usage = parsed?.usage;
        if (usage && typeof usage.total_tokens === 'number') {
          this.proxyMetrics?.recordTokens(usage.total_tokens);
          if (requestId && endpoint) {
            trafficLogger.logSseChunk(requestId, endpoint, undefined, {
              model: parsed?.model,
              tokensPrompt: usage.prompt_tokens ?? 0,
              tokensCompletion: usage.completion_tokens ?? 0,
              tokensTotal: usage.total_tokens,
            });
          }
          return;
        }
      }
    } catch {
      // Ignore parse errors for token extraction
    }
  }

  private writeSseResponse(
    res: FastifyReply,
    stream: Observable<unknown>,
    requestId?: string,
    endpoint?: string,
    startTime?: number,
    proxyContext?: ProxyRequestContext,
  ): void {
    const extraHeaders: Record<string, string> = {};
    if (proxyContext?.accountId) {
      extraHeaders['X-Proxy-Account-Used'] = proxyContext.accountId;
    }
    if (typeof proxyContext?.retryCount === 'number') {
      extraHeaders['X-Proxy-Retry-Count'] = String(proxyContext.retryCount);
    }
    if (proxyContext?.model) {
      extraHeaders['X-Proxy-Model-Used'] = proxyContext.model;
    }
    if (proxyContext?.requestId) {
      extraHeaders['X-Proxy-Request-Id'] = proxyContext.requestId;
    }
    if (proxyContext?.cacheStatus) {
      extraHeaders['X-Proxy-Cache-Status'] = proxyContext.cacheStatus;
    }

    if (!res.raw || !isFunction(res.raw.writeHead) || !isFunction(res.raw.write)) {
      res.header('Content-Type', 'text/event-stream');
      res.header('Cache-Control', 'no-cache');
      res.header('Connection', 'keep-alive');
      for (const [key, value] of Object.entries(extraHeaders)) {
        res.header(key, value);
      }
      res.send(stream);
      this.proxyMetrics?.decrementActiveConnections();
      return;
    }

    if (isFunction((res as { hijack?: () => void }).hijack)) {
      (res as { hijack: () => void }).hijack();
    }

    res.raw.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...extraHeaders,
    });

    if (isFunction(res.raw.flushHeaders)) {
      res.raw.flushHeaders();
    }

    let finished = false;
    const finish = (status: number) => {
      if (finished) {
        return;
      }
      finished = true;
      if (startTime && endpoint) {
        this.proxyMetrics?.recordRequest({
          timestamp: startTime,
          duration: Date.now() - startTime,
          status,
          endpoint,
        });
      }
      this.proxyMetrics?.decrementActiveConnections();
    };

    const subscription = stream.subscribe({
      next: (chunk) => {
        if (res.raw.writableEnded) {
          return;
        }
        const payload = isString(chunk) ? chunk : String(chunk ?? '');
        res.raw.write(payload);
        if (requestId && endpoint) {
          trafficLogger.logSseChunk(requestId, endpoint, chunk);
        }
        this.extractAndRecordTokens(payload, requestId, endpoint);
        if (isFunction((res.raw as any).flush)) {
          (res.raw as any).flush();
        }
      },
      error: (error) => {
        if (res.raw.writableEnded) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        const status = this.resolveErrorHttpStatus(message);
        const { type, code } = this.resolveOpenAIErrorTypeAndCode(status, message);
        const errorPayload: Record<string, unknown> = {
          message,
          type,
        };
        if (code) {
          errorPayload.code = code;
        }
        res.raw.write(
          `data: ${JSON.stringify({
            error: errorPayload,
          })}
\n\n`,
        );
        res.raw.end();
        finish(status);
      },
      complete: () => {
        if (!res.raw.writableEnded) {
          res.raw.end();
        }
        finish(HttpStatus.OK);
      },
    });

    res.raw.on('close', () => {
      subscription.unsubscribe();
      finish(HttpStatus.OK);
    });
  }

  private async sendOpenAIImageGenerationResponse(
    request: OpenAIChatRequest,
    prompt: string,
    res: FastifyReply,
  ): Promise<void> {
    this.proxyMetrics?.incrementActiveConnections();
    const startTime = Date.now();
    const endpoint = '/v1/images/generations';
    try {
      const result = await this.proxyService.handleChatCompletions(request);
      if (result instanceof Observable) {
        this.logProxyEndpointError(
          endpoint,
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Streaming image generation is not supported by this endpoint',
        );
        this.proxyMetrics?.recordRequest({
          timestamp: startTime,
          duration: Date.now() - startTime,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          endpoint,
        });
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          error: {
            message: 'Streaming image generation is not supported by this endpoint',
            type: 'invalid_request_error',
          },
        });
        return;
      }

      const content = result.choices?.[0]?.message?.content;
      const image = this.extractInlineBase64Image(isString(content) ? content : '');
      if (!image) {
        this.logProxyEndpointError(
          endpoint,
          HttpStatus.BAD_GATEWAY,
          'Upstream did not return inline image data',
        );
        this.proxyMetrics?.recordRequest({
          timestamp: startTime,
          duration: Date.now() - startTime,
          status: HttpStatus.BAD_GATEWAY,
          endpoint,
        });
        res.status(HttpStatus.BAD_GATEWAY).send({
          error: {
            message: 'Upstream did not return inline image data',
            type: 'invalid_response_error',
          },
        });
        return;
      }

      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status: HttpStatus.OK,
        endpoint,
      });
      if (result.usage?.total_tokens) {
        this.proxyMetrics?.recordTokens(result.usage.total_tokens);
      }
      res.status(HttpStatus.OK).send({
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            b64_json: image.data,
          },
        ],
      });
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Internal Server Error';

      if (this.isProjectContextErrorMessage(message)) {
        try {
          const geminiRequest = this.buildGeminiImageRequest(request, prompt);
          const geminiResult = await this.proxyService.handleGeminiGenerateContent(
            request.model ?? 'gemini-3-pro-image',
            geminiRequest,
          );
          const fallbackImage = this.extractInlineBase64ImageFromGeminiResponse(geminiResult);
          if (fallbackImage) {
            this.proxyMetrics?.recordRequest({
              timestamp: startTime,
              duration: Date.now() - startTime,
              status: HttpStatus.OK,
              endpoint,
            });
            if (geminiResult.usageMetadata?.totalTokenCount) {
              this.proxyMetrics?.recordTokens(geminiResult.usageMetadata.totalTokenCount);
            }
            res.status(HttpStatus.OK).send({
              created: Math.floor(Date.now() / 1000),
              data: [
                {
                  b64_json: fallbackImage.data,
                },
              ],
            });
            return;
          }
          message = 'Upstream did not return inline image data';
        } catch (fallbackError) {
          message = fallbackError instanceof Error ? fallbackError.message : message;
        }
      }

      const status = this.resolveErrorHttpStatus(message);
      this.proxyMetrics?.recordRequest({
        timestamp: startTime,
        duration: Date.now() - startTime,
        status,
        endpoint,
      });
      this.sendOpenAIErrorResponse(res, endpoint, error, message);
    } finally {
      this.proxyMetrics?.decrementActiveConnections();
    }
  }

  private extractInlineBase64Image(content: string): {
    mimeType: string;
    data: string;
  } | null {
    const pattern = /data:(?<mime>[\w/+.-]+);base64,(?<data>[A-Za-z0-9+/=]+)/;
    const matched = content.match(pattern);
    if (!matched || !matched.groups) {
      return null;
    }

    return {
      mimeType: matched.groups.mime,
      data: matched.groups.data,
    };
  }

  private extractInlineBase64ImageFromGeminiResponse(response: GeminiResponse): {
    mimeType: string;
    data: string;
  } | null {
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          mimeType: part.inlineData.mimeType ?? 'image/jpeg',
          data: part.inlineData.data,
        };
      }
      if (part.text) {
        const parsed = this.extractInlineBase64Image(part.text);
        if (parsed) {
          return parsed;
        }
      }
    }
    return null;
  }

  private buildGeminiImageRequest(
    request: OpenAIChatRequest,
    fallbackPrompt: string,
  ): GeminiRequest {
    const userMessage = request.messages.find((message) => message.role === 'user');
    const textParts: string[] = [];
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (!userMessage) {
      parts.push({ text: fallbackPrompt || 'Please generate an image based on this request.' });
    } else if (isString(userMessage.content)) {
      parts.push({
        text:
          userMessage.content ||
          fallbackPrompt ||
          'Please generate an image based on this request.',
      });
    } else {
      for (const block of userMessage.content) {
        if (block.type === 'text' && isString(block.text) && !isEmpty(block.text.trim())) {
          textParts.push(block.text);
        }
        if (block.type === 'image_url') {
          const imageUrl = this.resolveImageUrl(block as unknown as Record<string, unknown>);
          const inlineData = this.resolveInlineData(imageUrl);
          if (inlineData) {
            parts.push({
              inlineData: {
                mimeType: inlineData.mimeType,
                data: inlineData.data,
              },
            });
          }
        }
      }
      if (textParts.length > 0) {
        parts.unshift({ text: textParts.join('\n') });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: fallbackPrompt || 'Please generate an image based on this request.' });
    }

    return {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    };
  }

  private isProjectContextErrorMessage(message: string): boolean {
    const lowered = message.toLowerCase();
    return (
      lowered.includes('#3501') ||
      (lowered.includes('google cloud project') && lowered.includes('code assist license')) ||
      (lowered.includes('resource projects/') && lowered.includes('could not be found')) ||
      (lowered.includes('project') && lowered.includes('not found'))
    );
  }

  private hasMultipartBoundary(req: FastifyRequest): boolean {
    const contentType = req.headers['content-type'];
    if (!isString(contentType)) {
      return false;
    }

    const lowered = contentType.toLowerCase();
    return lowered.includes('multipart/form-data') && lowered.includes('boundary=');
  }

  private resolveErrorMessageText(error: unknown): string {
    return error instanceof Error ? error.message : 'Internal Server Error';
  }

  private sendOpenAIErrorResponse(
    res: FastifyReply,
    endpoint: string,
    error: unknown,
    overrideMessage?: string,
  ): void {
    const message = overrideMessage ?? this.resolveErrorMessageText(error);
    const status = this.resolveErrorHttpStatus(message);
    this.logProxyEndpointError(endpoint, status, message, error);
    const { type, code } = this.resolveOpenAIErrorTypeAndCode(status, message);
    const errorPayload: Record<string, unknown> = {
      message,
      type,
    };
    if (code) {
      errorPayload.code = code;
    }
    res.status(status).send({
      error: errorPayload,
    });
  }

  private sendAnthropicErrorResponse(
    res: FastifyReply,
    endpoint: string,
    error: unknown,
    overrideMessage?: string,
  ): void {
    const message = overrideMessage ?? this.resolveErrorMessageText(error);
    const status = this.resolveErrorHttpStatus(message);
    this.logProxyEndpointError(endpoint, status, message, error);
    res.status(status).send({
      type: 'error',
      error: {
        type: 'api_error',
        message,
      },
    });
  }

  private resolveErrorHttpStatus(message: string): HttpStatus {
    const lowered = message.toLowerCase();
    if (lowered.includes('all accounts failed or unhealthy')) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    if (lowered.includes('all accounts exhausted') || lowered.includes('no available accounts')) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }
    if (
      lowered.includes('network socket disconnected') ||
      lowered.includes('secure tls connection was established') ||
      lowered.includes('socket hang up') ||
      lowered.includes('econnreset') ||
      lowered.includes('eai_again')
    ) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    if (lowered.includes('401') || lowered.includes('unauthorized')) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (lowered.includes('403') || lowered.includes('forbidden')) {
      return HttpStatus.FORBIDDEN;
    }
    if (lowered.includes('429') || lowered.includes('rate limit') || lowered.includes('quota')) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }
    if (lowered.includes('503') || lowered.includes('service unavailable')) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    if (lowered.includes('502') || lowered.includes('bad gateway')) {
      return HttpStatus.BAD_GATEWAY;
    }
    if (lowered.includes('504') || lowered.includes('timeout')) {
      return HttpStatus.GATEWAY_TIMEOUT;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveOpenAIErrorTypeAndCode(
    status: HttpStatus,
    message: string,
  ): { type: string; code?: string } {
    const lowered = message.toLowerCase();
    if (status === HttpStatus.UNAUTHORIZED) {
      return { type: 'invalid_request_error', code: 'invalid_api_key' };
    }
    if (status === HttpStatus.FORBIDDEN) {
      return { type: 'invalid_request_error', code: 'permission_denied' };
    }
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return { type: 'rate_limit_error', code: 'rate_limit_exceeded' };
    }
    if (status === HttpStatus.BAD_GATEWAY || status === HttpStatus.GATEWAY_TIMEOUT) {
      return { type: 'server_error', code: 'bad_gateway' };
    }
    if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      return { type: 'server_error', code: 'temporarily_unavailable' };
    }
    if (
      lowered.includes('invalid') ||
      lowered.includes('malformed') ||
      lowered.includes('bad request')
    ) {
      return { type: 'invalid_request_error', code: 'invalid_request_error' };
    }
    return { type: 'server_error', code: 'internal_error' };
  }

  private logProxyEndpointError(
    endpoint: string,
    status: HttpStatus,
    message: string,
    error?: unknown,
  ): void {
    const base = `[${endpoint}] status=${status} message=${message}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(base, error instanceof Error ? error.stack : undefined);
      return;
    }
    this.logger.warn(base);
  }
}
