import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { outlineSchema, Outline } from '../ai/schemas/outline.schema';
import { OUTLINE_SYSTEM, buildOutlineUser } from '../ai/prompts/outline.prompt';
import { sanitizeUzbekScript } from '../ai/uzbek-script.sanitizer';

export interface OutlineInput {
  topic: string;
  slideCount: number;
  language: string;
  tone: string;
}

@Injectable()
export class OutlineService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  generate(input: OutlineInput): Promise<LlmResult<Outline>> {
    const model = this.config.get<string>('app.ai.outlineModel') as string;
    return this.llm.generateStructured({
      system: OUTLINE_SYSTEM,
      user: buildOutlineUser(input),
      schema: outlineSchema,
      model,
      postprocess: input.language === 'uz' ? sanitizeUzbekScript : undefined,
    });
  }
}
