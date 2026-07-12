import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlideVisual } from './visual.types';
import { ImageScriptGuardService } from './image-script-guard.service';

interface JudgeVerdict {
  relevant: boolean;
  textIsEnglishOrAbsent: boolean;
  reason: string;
}

interface ValidationContext {
  topic: string;
  query?: string;
}

/**
 * Wikimedia's search results are matched on title/description TEXT only —
 * a page can rank well for a query while depicting something else entirely,
 * and a fair share of Commons diagrams carry baked-in captions in the
 * source-country's language. Both are invisible to the text-only ranking in
 * wikimedia.service.ts, so this does one real look at the pixels via Claude
 * vision before a candidate is allowed into a deck.
 */
@Injectable()
export class VisualValidatorService {
  private readonly logger = new Logger(VisualValidatorService.name);
  private readonly endpoint = 'https://api.anthropic.com/v1/messages';
  private readonly version = '2023-06-01';
  private readonly verdictCache = new Map<string, Promise<boolean>>();

  constructor(
    private readonly config: ConfigService,
    private readonly scriptGuard: ImageScriptGuardService,
  ) {}

  async isAcceptable(visual: SlideVisual, context: string | ValidationContext): Promise<boolean> {
    const ctx = typeof context === 'string' ? { topic: context } : context;
    const cacheKey = `${ctx.topic.toLowerCase().trim()}::${visual.url}`;
    const cached = this.verdictCache.get(cacheKey);
    if (cached) return cached;

    const verdict = this.checkAcceptable(visual, ctx);
    this.verdictCache.set(cacheKey, verdict);
    if (this.verdictCache.size > 200) this.verdictCache.delete(this.verdictCache.keys().next().value!);
    return verdict;
  }

  private async checkAcceptable(visual: SlideVisual, context: ValidationContext): Promise<boolean> {
    const apiKey = this.config.get<string>('app.ai.anthropicApiKey');
    if (!apiKey) return true;

    try {
      const image = await this.downloadImage(visual.url);
      if (!image) return true;

      // Free, local, deterministic pass first: catches non-English baked-in
      // text (wrong script, or a Latin-script language that isn't English)
      // without spending an Anthropic call at all. Only relevance — which
      // has no cheap non-AI equivalent — still needs the vision call below.
      if (await this.scriptGuard.hasDisqualifyingText(image.buffer)) {
        this.logger.log(`Visual check "${visual.query}": rejected by local script/language guard (no AI call spent)`);
        return false;
      }

      // Uses the higher-quality outline model, not the cost-optimized card
      // model: this call gates what actually appears in a user-facing deck,
      // runs only once or twice per presentation (not once per slide), and
      // needs solid comprehension of the topic string, which is usually
      // Uzbek/Russian/Karakalpak, not English.
      const model = this.config.get<string>('app.ai.outlineModel') || 'claude-sonnet-5';
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': this.version,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 200,
          system: 'You are a strict visual fact-checker for an educational slide deck tool. Reply with ONLY the requested JSON object, no other text.',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.buffer.toString('base64') } },
                {
                  type: 'text',
                  text:
                    `Presentation topic: "${context.topic}"\n` +
                    `Search query used: "${context.query ?? visual.query}"\n` +
                    `Wikimedia alt/title text: "${visual.alt}"\n` +
                    `Source page: ${visual.sourceUrl}\n\n` +
                    'Look at the image and answer with exactly this JSON shape:\n' +
                    '{"relevant": boolean, "textIsEnglishOrAbsent": boolean, "reason": string}\n\n' +
                    '- relevant: true ONLY if the image clearly and specifically depicts the topic above (not just vaguely or thematically similar).\n' +
                    '- Use the search query and Wikimedia alt/title text only as hints; the pixels are the final authority.\n' +
                    '- Reject logos, UI screenshots, decorative icons, unrelated people/objects, and generic stock-like images unless they directly depict the topic.\n' +
                    '- textIsEnglishOrAbsent: true if the image has no readable text/labels/captions rendered in it, OR all such text is in English. false if any visible text is in a non-English language.\n' +
                    '- reason: one short sentence.',
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return true;

      const json = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = json.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') ?? '';
      const verdict = this.parseVerdict(text);
      if (!verdict) return true;

      const accepted = verdict.relevant && verdict.textIsEnglishOrAbsent;
      this.logger.log(
        `Visual check "${visual.query}": relevant=${verdict.relevant} textOk=${verdict.textIsEnglishOrAbsent} accepted=${accepted} — ${verdict.reason}`,
      );
      return accepted;
    } catch (error) {
      this.logger.warn(`Visual validation errored, allowing candidate through: ${String(error)}`);
      return true;
    }
  }

  private parseVerdict(text: string): JudgeVerdict | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return {
        relevant: !!parsed.relevant,
        textIsEnglishOrAbsent: !!parsed.textIsEnglishOrAbsent,
        reason: String(parsed.reason ?? ''),
      };
    } catch {
      return null;
    }
  }

  private async downloadImage(url: string): Promise<{ buffer: Buffer; mediaType: string } | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return null;
      const mediaType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, mediaType };
    } catch {
      return null;
    }
  }
}
