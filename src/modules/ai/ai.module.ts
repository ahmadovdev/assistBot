import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { CacheStatsService } from './cache-stats.service';
import { LLM_PROVIDER, LlmProvider } from './llm.types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { GeminiProvider } from './gemini.provider';

/** Resolve a provider name to its instance. */
function pickProvider(
  name: string | undefined,
  providers: { anthropic: AnthropicProvider; openrouter: OpenRouterProvider; gemini: GeminiProvider },
): LlmProvider {
  switch (name) {
    case 'openrouter':
      return providers.openrouter;
    case 'gemini':
      return providers.gemini;
    default:
      return providers.anthropic;
  }
}

@Module({
  providers: [
    AnthropicProvider,
    OpenRouterProvider,
    GeminiProvider,
    CacheStatsService,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, AnthropicProvider, OpenRouterProvider, GeminiProvider],
      useFactory: (
        config: ConfigService,
        anthropic: AnthropicProvider,
        openrouter: OpenRouterProvider,
        gemini: GeminiProvider,
      ): LlmProvider =>
        pickProvider(config.get<string>('app.ai.provider'), { anthropic, openrouter, gemini }),
    },
    LlmService,
  ],
  exports: [LlmService, CacheStatsService],
})
export class AiModule {}
