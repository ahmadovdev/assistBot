import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { LLM_PROVIDER, LlmProvider } from './llm.types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenRouterProvider } from './openrouter.provider';

@Module({
  providers: [
    AnthropicProvider,
    OpenRouterProvider,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, AnthropicProvider, OpenRouterProvider],
      useFactory: (
        config: ConfigService,
        anthropic: AnthropicProvider,
        openrouter: OpenRouterProvider,
      ): LlmProvider => {
        const provider = config.get<string>('app.ai.provider');
        return provider === 'openrouter' ? openrouter : anthropic;
      },
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class AiModule {}
