import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { QUEUES } from '../../infra/queue/queue.constants';
import { CardsJobData, RenderJobData } from '../../infra/queue/queue.types';
import { CardService } from './card.service';
import { BriefService } from './brief.service';
import { DeckBrief } from '../ai/schemas/brief.schema';
import { mapLimit } from './map-limit';
import { PresentationsService } from '../presentations/presentations.service';
import { SlidesService } from '../slides/slides.service';
import { SessionService } from '../bot/session.service';
import { BotSender } from '../bot/bot.sender';
import { BotState } from '../bot/bot.constants';
import { outlineSchema } from '../ai/schemas/outline.schema';
import { createDeckState, withSelectedLayout } from '../render/templates/layout-registry';
import { estimateCostUsd } from '../ai/model-pricing';
import { TopicVisualService } from '../visuals/topic-visual.service';
import { RateLimitService } from '../ratelimit/rate-limit.service';

const CARD_CONCURRENCY = 3;

/** A data slide with no real data to show — converted, not dropped, so the
 * requested slide count stays stable without fabricating numbers/sources. */
function isEmptyDataSlide(layout: string, content: unknown): boolean {
  const c = (content ?? {}) as Record<string, any>;
  if (layout === 'STATS') return !Array.isArray(c.stats) || c.stats.length === 0;
  if (layout === 'REFERENCES') return !Array.isArray(c.items) || c.items.length === 0;
  return false;
}

const FALLBACK_COPY: Record<string, Record<'stats' | 'references', { lead: string; points: string[] }>> = {
  uz: {
    stats: {
      lead: 'Bu slayd raqam to‘qimasdan, mavzuning ishonchli talqinini beradi.',
      points: [
        'Aniq raqamlar ishonchli manba bilan tekshirilmaguncha kiritilmaydi.',
        'Mavzuning asosiy mazmuni sifat jihatdan tushuntiriladi.',
      ],
    },
    references: {
      lead: 'Bu slayd soxta adabiyotlar o‘rniga manba tanlash mezonini ko‘rsatadi.',
      points: [
        'Manbalar real va tekshiriladigan bo‘lishi kerak.',
        'Aniq bibliografik yozuvlar foydalanuvchi tomonidan keyin to‘ldirilishi mumkin.',
      ],
    },
  },
  ru: {
    stats: {
      lead: 'Этот слайд объясняет тему без выдуманных чисел.',
      points: [
        'Точные данные добавляются только после проверки надежного источника.',
        'Главная мысль раскрывается качественно, без ложной точности.',
      ],
    },
    references: {
      lead: 'Этот слайд заменяет выдуманные источники критериями подбора литературы.',
      points: [
        'Источники должны быть реальными и проверяемыми.',
        'Точные библиографические записи можно добавить после проверки.',
      ],
    },
  },
  en: {
    stats: {
      lead: 'This slide explains the topic without inventing numbers.',
      points: [
        'Precise figures are included only when a reliable source is available.',
        'The core idea is explained qualitatively instead of using false precision.',
      ],
    },
    references: {
      lead: 'This slide avoids fabricated bibliography and explains how sources should be selected.',
      points: [
        'Sources should be real, relevant, and verifiable.',
        'Exact bibliography entries can be added after source review.',
      ],
    },
  },
  kaa: {
    stats: {
      lead: 'Bul slayd sandi oylap tappastan, temanı isenimli turde tusindiredi.',
      points: [
        'Aniq sandar isenimli derek penen tekserilgende gana qosiladi.',
        'Temanin negizgi mazmuni jalgan aniqliqsiz tusindiriledi.',
      ],
    },
    references: {
      lead: 'Bul slayd jalgan adebiyatlar ornina derek tanlaw olshemlerin korsetedi.',
      points: [
        'Derekler haqiyqiy ham tekseriletugin boliwi kerek.',
        'Aniq bibliografiyaliq jazbalar keyin toliqtiriladi.',
      ],
    },
  },
};

function fallbackContentSlide(
  slide: { title: string; key_points: string[] },
  reason: 'stats' | 'references',
  language: string,
) {
  const copy = FALLBACK_COPY[language]?.[reason] ?? FALLBACK_COPY.uz[reason];
  const points = slide.key_points.length >= 2
    ? slide.key_points.slice(0, 4)
    : copy.points;
  return {
    title: slide.title,
    lead: copy.lead,
    points: points.map((text) => ({ text })),
  };
}

@Processor(QUEUES.CARDS)
export class CardsProcessor extends WorkerHost {
  private readonly logger = new Logger(CardsProcessor.name);

  constructor(
    private readonly cards: CardService,
    private readonly brief: BriefService,
    private readonly topicVisuals: TopicVisualService,
    private readonly presentations: PresentationsService,
    private readonly slides: SlidesService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
    private readonly rateLimit: RateLimitService,
    @InjectQueue(QUEUES.RENDER) private readonly renderQueue: Queue<RenderJobData>,
  ) {
    super();
  }

  /** Academic-consistency checks (Fix 4) — non-blocking, logged for observability. */
  private logDeckQuality(id: string, slides: { position: number; layout: string; content: unknown }[]): void {
    const warnings: string[] = [];
    if (!slides.some((s) => s.layout === 'REFERENCES')) warnings.push('no REFERENCES slide');
    for (const s of slides) {
      const c = (s.content ?? {}) as Record<string, any>;
      if (s.layout === 'STATS' && c.stats?.length && !c.source) warnings.push(`STATS@${s.position}: figures without a source`);
      if (s.layout === 'FINDING' && /\d/.test(String(c.evidence ?? '')) && !c.source) warnings.push(`FINDING@${s.position}: cites a number without a source`);
    }
    if (warnings.length) this.logger.warn(`Deck ${id} academic-quality: ${warnings.join('; ')}`);
  }

  async process(job: Job<CardsJobData>): Promise<void> {
    const { presentationId, titul, contentMode } = job.data;
    const presentation = await this.presentations.findByIdWithUser(presentationId);
    if (!presentation) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }

    const chatId = Number(presentation.user.telegramId);

    try {
      const outline = outlineSchema.parse(presentation.outline);
      const total = outline.slides.length;

      await this.presentations.setStatus(presentationId, 'generating');
      await this.sender.sendMessage(chatId, `\u23F3 ${total} ta slayd tayyorlanmoqda...`);

      // Deck brief: shared narrative spine + facts so slides stay coherent and
      // non-repetitive. Best-effort \u2014 if it fails, generate cards without it.
      let brief: DeckBrief | undefined;
      let briefTokens = 0;
      let briefPromptTokens = 0;
      let briefCompletionTokens = 0;
      let briefCostUsd: number | undefined;
      try {
        const briefResult = await this.brief.generate({
          topic: presentation.topicPrompt,
          language: presentation.language,
          deckTitle: outline.deck_title,
          outline,
        });
        brief = briefResult.data;
        briefTokens = briefResult.usage.totalTokens;
        briefPromptTokens = briefResult.usage.promptTokens;
        briefCompletionTokens = briefResult.usage.completionTokens;
        briefCostUsd = estimateCostUsd(briefResult.model, briefResult.usage);
      } catch (e) {
        this.logger.warn(`Deck brief failed for ${presentationId}, continuing without it: ${String(e)}`);
      }

      const focusByPosition = new Map<number, string>(
        (brief?.slideFocus ?? []).map((f) => [f.position, f.focus]),
      );
      const outlineTitles = outline.slides.map(
        (s) => `${s.position}. ${s.type} \u2014 ${s.title}`,
      );

      // Per-card resilience: one card failing schema/JSON must NOT kill the whole
      // deck. On failure we fall back to a valid CONTENT slide built from the
      // outline so every render engine receives a known slide type.
      const results = await mapLimit(outline.slides, CARD_CONCURRENCY, async (slide) => {
        try {
          const r = await this.cards.generate({
            deckTitle: outline.deck_title,
            topic: presentation.topicPrompt,
            language: presentation.language,
            totalSlides: total,
            position: slide.position,
            title: slide.title,
            keyPoints: slide.key_points,
            type: slide.type,
            deckThesis: brief?.thesis,
            deckNarrative: brief?.narrative,
            sharedFacts: brief?.keyFacts,
            slideFocus: focusByPosition.get(slide.position),
            outlineTitles,
            contentMode,
          });
          return {
            ok: true, layout: slide.type, content: r.data, tokens: r.usage.totalTokens, model: r.model,
            promptTokens: r.usage.promptTokens, completionTokens: r.usage.completionTokens,
            costUsd: estimateCostUsd(r.model, r.usage),
          };
        } catch (e) {
          this.logger.warn(`Card ${slide.position} (${slide.type}) failed, using CONTENT fallback: ${String(e)}`);
          const body = Array.isArray(slide.key_points) ? slide.key_points.join('. ') : '';
          return {
            ok: false,
            layout: 'CONTENT',
            content: {
              title: slide.title,
              lead: body.slice(0, 180),
              points: (slide.key_points.length ? slide.key_points : [slide.title, body || slide.title])
                .slice(0, 4)
                .map((text) => ({ text })),
            },
            tokens: 0,
            model: 'fallback',
            promptTokens: 0, completionTokens: 0, costUsd: undefined as number | undefined,
          };
        }
      });

      // Deterministic layout-VARIANT selection (e.g. STATS's 'default' vs
      // 'gradient_cards') — one DeckState per presentation, threaded through
      // every slide so anti-monotony is tracked across the whole deck, not
      // reset per-slide. TITLE is explicitly excluded (see below) — its
      // layout stays AI/user-driven, untouched by this system.
      const themeId = presentation.theme?.key ?? 'dark_premium';
      const deckState = createDeckState();

      const built = outline.slides.map((slide, i) => {
        // Slide 1 (TITLE): build its content deterministically from the user's
        // choice — do NOT let the AI invent an institution/name. When titul is
        // disabled, show ONLY the topic (typographic layout).
        if (slide.type === 'TITLE') {
          const ai = (results[i].ok ? results[i].content : {}) as Record<string, unknown>;
          const topicText =
            (typeof ai.title === 'string' && ai.title) || slide.title || presentation.topicPrompt;
          const content = titul?.enabled
            ? {
                layout: (typeof ai.layout === 'string' && ai.layout) || 'editorial_split',
                title: topicText,
                university: titul.university,
                faculty: titul.faculty,
                student: titul.student,
              }
            : { layout: 'typographic_statement', title: topicText };
          return { position: slide.position, layout: 'TITLE', content };
        }
        const content = (results[i].content ?? {}) as Record<string, unknown>;
        if (isEmptyDataSlide(results[i].layout, content)) {
          this.logger.warn(
            `Slide ${slide.position} (${results[i].layout}) had no verified data; converting to CONTENT fallback`,
          );
          return {
            position: slide.position,
            layout: 'CONTENT',
            content: fallbackContentSlide(
              { title: slide.title, key_points: slide.key_points },
              results[i].layout === 'STATS' ? 'stats' : 'references',
              presentation.language,
            ),
          };
        }
        // Prose-mode content (has `paragraph`) never goes through the
        // layout-registry — it's a data-shape different from what the
        // decorative dark_premium concepts' `matches()` checks expect (e.g.
        // `points` is absent), and the render layer already dispatches prose
        // on its own (see layouts.ts `if (d.paragraph !== undefined) ...`).
        const isProse = typeof content.paragraph === 'string';
        // Layout-registry selection must key off `results[i].layout` (the
        // ACTUAL type of `content`), not `slide.type` (the outline's
        // originally-intended type) — when a card fails schema validation
        // and falls back, `results[i].layout` becomes 'CONTENT' while
        // `slide.type` stays whatever it originally was (e.g. 'PROCESS').
        // Passing the mismatched `slide.type` into a registry whose
        // `matches()` predicates assume that type's real shape (e.g.
        // PROCESS_LAYOUTS reading `d.steps.length`) crashes on the
        // CONTENT-shaped fallback object, which has no `steps` at all.
        return {
          position: slide.position,
          layout: results[i].layout,
          content: isProse ? content : withSelectedLayout(results[i].layout, content, themeId, deckState),
        };
      });

      // Visuals are planned and generated locally from deck content: no extra
      // LLM call, no stock-photo mismatch, no external search result drift.
      // Policy remains: 0 images below 10 slides, 1 for 10-14, 2 for 15+.
      const withVisuals = await this.topicVisuals.enrichSlides(
        built.map((slide) => ({
          ...slide,
          content: slide.content as Record<string, unknown>,
        })),
        presentation.topicPrompt,
        presentation.language,
      );

      this.logDeckQuality(presentationId, withVisuals);
      await this.slides.replaceAll(presentationId, withVisuals);

      const tokens = results.reduce((sum, r) => sum + r.tokens, briefTokens);
      const promptTokens = results.reduce((sum, r) => sum + r.promptTokens, briefPromptTokens);
      const completionTokens = results.reduce((sum, r) => sum + r.completionTokens, briefCompletionTokens);
      // Sum whatever costs are computable (brief + each card); undefined
      // contributions (unpriced model, or a fallback CONTENT card with 0
      // tokens) just don't add anything — see model-pricing.ts.
      const cardsCostUsd = [briefCostUsd, ...results.map((r) => r.costUsd)]
        .reduce((sum: number | undefined, c) => (c === undefined ? sum : (sum ?? 0) + c), undefined as number | undefined);
      await this.presentations.recordJob(presentationId, {
        stage: 'cards',
        status: 'completed',
        modelUsed: results.find((r) => r.ok)?.model ?? 'fallback',
        tokensUsed: tokens,
        promptTokens,
        completionTokens,
        costUsd: cardsCostUsd,
      });

      const totals = await this.presentations.getJobTotals(presentationId);
      this.logger.log(
        `Presentation ${presentationId} generation total: ${totals.totalTokens} tokens ` +
        `(input=${totals.promptTokens}, output=${totals.completionTokens})` +
        (totals.totalCostUsd !== null ? `, ~$${totals.totalCostUsd.toFixed(4)}` : ' (cost unknown — unpriced model)'),
      );

      await this.session.setState(presentation.userId, BotState.GENERATING);
      await this.sender.sendMessage(
        chatId,
        `\u2705 ${total} ta slayd tayyor. PDF yig'ilmoqda...`,
      );
      await this.renderQueue.add('render', { presentationId }, { attempts: 3 });
    } catch (err) {
      this.logger.error(`Card generation failed for ${presentationId}: ${String(err)}`);
      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.presentations.recordJob(presentationId, { stage: 'cards', status: 'failed' });
      await this.rateLimit.finishGeneration(presentation.userId, { refund: true });
      await this.session.setState(presentation.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        "\u274C Slaydlar tayyorlashda xatolik. /start orqali qayta urinib ko'ring.",
      );
    }
  }
}
