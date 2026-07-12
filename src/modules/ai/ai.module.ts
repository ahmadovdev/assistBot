import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { CacheStatsService } from './cache-stats.service';
import { LLM_PROVIDER, LLM_FALLBACK, LlmProvider, LlmFallback } from './llm.types';
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
    {
      // Optional secondary provider+model. Null unless AI_FALLBACK_PROVIDER is
      // set to something other than 'none' AND a fallback model is configured.
      provide: LLM_FALLBACK,
      inject: [ConfigService, AnthropicProvider, OpenRouterProvider, GeminiProvider],
      useFactory: (
        config: ConfigService,
        anthropic: AnthropicProvider,
        openrouter: OpenRouterProvider,
        gemini: GeminiProvider,
      ): LlmFallback | null => {
        const name = config.get<string>('app.ai.fallbackProvider');
        const model = config.get<string>('app.ai.fallbackModel');
        if (!name || name === 'none' || !model) return null;
        Logger.log(`LLM fallback enabled: ${name} / ${model}`, 'AiModule');
        return { provider: pickProvider(name, { anthropic, openrouter, gemini }), model };
      },
    },
    LlmService,
  ],
  exports: [LlmService, CacheStatsService],
})
export class AiModule {}
