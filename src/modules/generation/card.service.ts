import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { cardSchemaByType, proseSchemaByType, CardContent } from '../ai/schemas/card.schemas';
import { buildCardSystem, buildCardUser, buildCardDeckContext, CardInput } from '../ai/prompts/card.prompt';
import { sanitizeUzbekScript } from '../ai/uzbek-script.sanitizer';
import { resolveModel } from '../ai/layout.catalog';

@Injectable()
export class CardService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  generate(input: CardInput): Promise<LlmResult<CardContent>> {
    const model = resolveModel(this.config.get<string>('app.ai.cardModel') as string, input.language);
    // Prose schema only when explicitly requested AND this type has one —
    // every other type/mode combination keeps its normal card schema.
    const schema =
      input.contentMode === 'prose' && proseSchemaByType[input.type]
        ? proseSchemaByType[input.type]!
        : cardSchemaByType[input.type];
    return this.llm.generateStructured<CardContent>({
      system: buildCardSystem(input.contentMode),
      // Deck-wide preamble (same for every slide of this deck) — sent as a
      // separate cache breakpoint so a ~10-slide deck pays the full prefix
      // cost once instead of once per slide. See llm.service.ts/card.prompt.ts.
      systemCacheable: buildCardDeckContext(input),
      user: buildCardUser(input),
      schema,
      model,
      maxRepairs: 3,
      postprocess: input.language === 'uz' ? sanitizeUzbekScript : undefined,
    });
  }
}
