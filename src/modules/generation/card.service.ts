import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { CardContent } from '../ai/schemas/card.schemas';
import { buildCardSystem, buildCardUser, buildCardDeckContext, CardInput } from '../ai/prompts/card.prompt';
import { resolveModel } from '../ai/layout.catalog';

const directCardSchema = z.record(z.unknown()) as z.ZodType<CardContent, any, any>;

@Injectable()
export class CardService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  generate(input: CardInput): Promise<LlmResult<CardContent>> {
    const model = resolveModel(this.config.get<string>('app.ai.cardModel') as string, input.language);
    return this.llm.generateStructured<CardContent>({
      system: buildCardSystem(input.contentMode),
      // Deck-wide preamble (same for every slide of this deck) — sent as a
      // separate cache breakpoint so a ~10-slide deck pays the full prefix
      // cost once instead of once per slide. See llm.service.ts/card.prompt.ts.
      systemCacheable: buildCardDeckContext(input),
      user: buildCardUser(input),
      schema: directCardSchema,
      model,
    });
  }
}
