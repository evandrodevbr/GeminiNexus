import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { TokenManagerService } from './token-manager.service';
import { GeminiClient } from './clients/gemini.client';
import { GeminiController } from './gemini.controller';
import { ProxyGuard } from './proxy.guard';
import { TokenUsageService } from '../usage/token-usage.service';
import { ProxyReplayService } from './proxy-replay.service';
import { ProxyMetricsService } from './proxy-metrics.service';
import { ProxyIdeConfigService } from './proxy-ide-config.service';
import { ProxyEventBus } from './proxy-event-bus.service';
import { ProxyTransformInterceptor } from './proxy-transform.interceptor';

@Module({
  imports: [],
  controllers: [ProxyController, GeminiController],
  providers: [
    ProxyService,
    TokenManagerService,
    GeminiClient,
    ProxyGuard,
    TokenUsageService,
    ProxyReplayService,
    ProxyMetricsService,
    ProxyIdeConfigService,
    ProxyEventBus,
    ProxyTransformInterceptor,
  ],
  exports: [TokenManagerService],
})
export class ProxyModule {}
