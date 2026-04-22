import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { TokenManagerService } from './token-manager.service';
import { GeminiClient } from './clients/gemini.client';
import { GeminiController } from './gemini.controller';
import { ProxyGuard } from './proxy.guard';
import { TokenUsageService } from '../usage/token-usage.service';

@Module({
  imports: [],
  controllers: [ProxyController, GeminiController],
  providers: [ProxyService, TokenManagerService, GeminiClient, ProxyGuard, TokenUsageService],
  exports: [TokenManagerService],
})
export class ProxyModule {}
