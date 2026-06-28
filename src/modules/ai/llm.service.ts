import { Inject, Injectable, Logger } from '@nestjs/common';
import { ZodType } from 'zod';
import { LlmMessage, LlmProvider, LlmResult, LLM_PROVIDER } from './llm.types';

interface GenerateStructuredOptions<T> {
  system: string;
  user: string;
  schema: ZodType<T, any, any>;
  model: string;
  maxRepairs?: number;
  /** Applied to the validated data before it's returned, e.g. language-specific text cleanup. */
  postprocess?: (data: T) => T;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  /**
   * Calls the active provider in JSON mode, validates against a zod schema,
   * and runs a repair loop (feeding the validation error back) until valid.
   */
  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<LlmResult<T>> {
    const { system, user, schema, model, maxRepairs = 2 } = opts;

    const messages: LlmMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    let lastError = 'unknown error';

    for (let attempt = 0; attempt <= maxRepairs; attempt++) {
      const { content, usage, model: usedModel } = await this.provider.chatJson(messages, model);

      const parsed = this.tryParse(content);
      if (parsed.ok) {
        const result = schema.safeParse(parsed.value);
        if (result.success) {
          const data = opts.postprocess ? opts.postprocess(result.data) : result.data;
          return { data, model: usedModel, usage };
        }
        lastError = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
      } else {
        lastError = parsed.error;
      }

      this.logger.warn(`Structured generation attempt ${attempt + 1} invalid: ${lastError}`);
      messages.push({ role: 'assistant', content });
      messages.push({
        role: 'user',
        content:
          `Your previous response was invalid: ${lastError}. ` +
          `Return ONLY corrected JSON that matches the required structure. No prose, no markdown.`,
      });
    }

    throw new Error(
      `LLM failed schema validation after ${maxRepairs + 1} attempts: ${lastError}`,
    );
  }

  private tryParse(
    content: string,
  ): { ok: true; value: unknown } | { ok: false; error: string } {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();
    try {
      return { ok: true, value: JSON.parse(cleaned) };
    } catch (e) {
      return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
    }
  }
}
