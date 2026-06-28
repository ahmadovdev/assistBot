import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { cardSchemaByType, CardContent } from '../ai/schemas/card.schemas';
import { CARD_SYSTEM, buildCardUser, CardInput } from '../ai/prompts/card.prompt';
import { sanitizeUzbekScript } from '../ai/uzbek-script.sanitizer';

@Injectable()
export class CardService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  generate(input: CardInput): Promise<LlmResult<CardContent>> {
    const model = this.config.get<string>('app.ai.cardModel') as string;
    const schema = cardSchemaByType[input.type];
    return this.llm.generateStructured<CardContent>({
      system: CARD_SYSTEM,
      user: buildCardUser(input),
      schema,
      model,
      postprocess: input.language === 'uz' ? sanitizeUzbekScript : undefined,
    });
  }
}
