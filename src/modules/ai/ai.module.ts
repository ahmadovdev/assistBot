import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { LLM_PROVIDER, LlmProvider } from './llm.types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { GeminiProvider } from './gemini.provider';

@Module({
  providers: [
    AnthropicProvider,
    OpenRouterProvider,
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, AnthropicProvider, OpenRouterProvider, GeminiProvider],
      useFactory: (
        config: ConfigService,
        anthropic: AnthropicProvider,
        openrouter: OpenRouterProvider,
        gemini: GeminiProvider,
      ): LlmProvider => {
        switch (config.get<string>('app.ai.provider')) {
          case 'openrouter':
            return openrouter;
          case 'gemini':
            return gemini;
          default:
            return anthropic;
        }
      },
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class AiModule {}
