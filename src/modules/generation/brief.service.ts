import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { buildBriefSchema, DeckBrief } from '../ai/schemas/brief.schema';
import { BRIEF_SYSTEM, buildBriefUser, BriefParams } from '../ai/prompts/brief.prompt';
import { sanitizeUzbekScript } from '../ai/uzbek-script.sanitizer';
import { resolveModel } from '../ai/layout.catalog';

@Injectable()
export class BriefService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  /** Strategy/reasoning task — reuses the outline model. */
  generate(input: BriefParams): Promise<LlmResult<DeckBrief>> {
    const model = resolveModel(this.config.get<string>('app.ai.outlineModel') as string, input.language);
    return this.llm.generateStructured<DeckBrief>({
      system: BRIEF_SYSTEM,
      user: buildBriefUser(input),
      schema: buildBriefSchema(input.outline.slides.map((slide) => slide.position)),
      model,
      postprocess: input.language === 'uz' ? sanitizeUzbekScript : undefined,
    });
  }
}
