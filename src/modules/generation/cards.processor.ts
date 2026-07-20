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
import { RateLimitService } from '../ratelimit/rate-limit.service';
import { LONG_PRESENTATION_JOB_OPTIONS } from '../../infra/queue/worker-options';

// Two independent cards may be generated together. The worker still handles
// one presentation job at a time, so this reduces latency without overlapping
// browser/PDF work or regenerating already-valid cards.
const CARD_CONCURRENCY = 3;

function titleOnlyLayout(title: unknown): 'typographic_statement' | 'editorial_split' {
  const text = String(title ?? '').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return words <= 8 && text.length <= 68 ? 'typographic_statement' : 'editorial_split';
}

@Processor(QUEUES.CARDS, LONG_PRESENTATION_JOB_OPTIONS)
export class CardsProcessor extends WorkerHost {
  private readonly logger = new Logger(CardsProcessor.name);

  constructor(
    private readonly cards: CardService,
    private readonly brief: BriefService,
    private readonly presentations: PresentationsService,
    private readonly slides: SlidesService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
    private readonly rateLimit: RateLimitService,
    @InjectQueue(QUEUES.RENDER) private readonly renderQueue: Queue<RenderJobData>,
  ) {
    super();
  }

  async process(job: Job<CardsJobData>): Promise<void> {
    const { presentationId, titul, contentMode } = job.data;
    await job.updateProgress({ stage: 'cards_loading', presentationId });
    const presentation = await this.presentations.findByIdWithUser(presentationId);
    if (!presentation) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }

    const chatId = Number(presentation.user.telegramId);

    try {
      const outline = outlineSchema.parse(presentation.outline);
      const total = outline.slides.length;

      this.logger.log(`Cards job ${job.id} started for presentation ${presentationId} (${total} slides)`);
      await job.updateProgress({ stage: 'cards_started', presentationId, total });
      await this.presentations.setStatus(presentationId, 'generating');
      await this.sender.sendMessage(chatId, `\u23F3 ${total} ta slayd tayyorlanmoqda...`);

      await job.updateProgress({ stage: 'brief_started', presentationId, total });
      this.logger.log(`Deck brief started for presentation ${presentationId}`);
      const briefResult = await this.brief.generate({
        topic: presentation.topicPrompt,
        language: presentation.language,
        deckTitle: outline.deck_title,
        outline,
      });
      const brief: DeckBrief = briefResult.data;
      const briefTokens = briefResult.usage.totalTokens;
      const briefPromptTokens = briefResult.usage.promptTokens;
      const briefCompletionTokens = briefResult.usage.completionTokens;
      const briefCostUsd =
        briefResult.costUsd ??
        estimateCostUsd(briefResult.model, briefResult.usage);
      await job.updateProgress({
        stage: 'brief_done',
        presentationId,
        total,
        tokens: briefTokens,
      });
      this.logger.log(`Deck brief completed for presentation ${presentationId} (${briefTokens} tokens)`);

      const focusByPosition = new Map<number, string>(
        brief.slideFocus.map((f) => [f.position, f.focus]),
      );
      const outlineTitles = outline.slides.map(
        (s) => `${s.position}. ${s.type} — ${s.title}`,
      );

      let completedCards = 0;
      const results = await mapLimit(outline.slides, CARD_CONCURRENCY, async (slide) => {
        await job.updateProgress({
          stage: 'card_generating',
          presentationId,
          current: slide.position,
          total,
          type: slide.type,
          completed: completedCards,
        });
        this.logger.log(
          `Card ${slide.position}/${total} (${slide.type}) started for presentation ${presentationId}`,
        );
        const r = await this.cards.generate({
          deckTitle: outline.deck_title,
          topic: presentation.topicPrompt,
          language: presentation.language,
          totalSlides: total,
          position: slide.position,
          title: slide.title,
          keyPoints: slide.key_points,
          type: slide.type,
          deckThesis: brief.thesis,
          deckNarrative: brief.narrative,
          sharedFacts: brief.keyFacts,
          slideFocus: focusByPosition.get(slide.position),
          outlineTitles,
          contentMode,
        });
        completedCards += 1;
        await job.updateProgress({
          stage: 'cards_progress',
          presentationId,
          current: slide.position,
          total,
          type: slide.type,
          completed: completedCards,
          ok: true,
        });
        this.logger.log(
          `Card ${slide.position}/${total} (${slide.type}) completed for presentation ${presentationId} ` +
          `(${r.usage.totalTokens} tokens)`,
        );
        return {
          layout: slide.type,
          content: r.data,
          tokens: r.usage.totalTokens,
          model: r.model,
          promptTokens: r.usage.promptTokens,
          completionTokens: r.usage.completionTokens,
          costUsd: r.costUsd ?? estimateCostUsd(r.model, r.usage),
        };
      });

      await job.updateProgress({ stage: 'cards_building_slides', presentationId, total });
      // One DeckState per presentation keeps variant selection deterministic
      // and prevents monotonous repetition.
      const themeId = presentation.theme?.key ?? 'dark_premium';
      const deckState = createDeckState();

      const built = outline.slides.map((slide, i) => {
        // Slide 1 (TITLE): build its content deterministically from the user's
        // choice — do NOT let the AI invent an institution/name. When titul is
        // disabled, show ONLY the topic (typographic layout).
        if (slide.type === 'TITLE') {
          const ai = results[i].content as Record<string, unknown>;
          const topicText = String(ai.title);
          const content = titul?.enabled
            ? {
                layout: (typeof ai.layout === 'string' && ai.layout) || 'editorial_split',
                title: topicText,
                university: titul.university,
                faculty: titul.faculty,
                student: titul.student,
              }
            : { layout: titleOnlyLayout(topicText), title: topicText };
          return { position: slide.position, layout: 'TITLE', content };
        }
        const content = results[i].content as Record<string, unknown>;
        return {
          position: slide.position,
          layout: results[i].layout,
          content,
        };
      });

      await job.updateProgress({ stage: 'layout_selection', presentationId, total });
      const withLayouts = built.map((slide) => {
        const content = (slide.content ?? {}) as Record<string, unknown>;
        return {
          ...slide,
          content: slide.layout === 'TITLE'
            ? content
            : withSelectedLayout(slide.layout, content, themeId, deckState),
        };
      });

      await job.updateProgress({ stage: 'slides_saving', presentationId, total });
      await this.slides.replaceAll(presentationId, withLayouts);

      const tokens = results.reduce((sum, r) => sum + r.tokens, briefTokens);
      const promptTokens = results.reduce((sum, r) => sum + r.promptTokens, briefPromptTokens);
      const completionTokens = results.reduce((sum, r) => sum + r.completionTokens, briefCompletionTokens);
      const cardsCostUsd = [briefCostUsd, ...results.map((r) => r.costUsd)]
        .reduce((sum: number | undefined, c) => (c === undefined ? sum : (sum ?? 0) + c), undefined as number | undefined);
      await this.presentations.recordJob(presentationId, {
        stage: 'cards',
        status: 'completed',
        modelUsed: results[0].model,
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
      await job.updateProgress({ stage: 'render_queued', presentationId, total });
      await this.renderQueue.add('render', { presentationId }, { attempts: 1 });
      this.logger.log(`Cards job ${job.id} completed for presentation ${presentationId}; render queued`);
    } catch (err) {
      await job.updateProgress({ stage: 'cards_failed', presentationId, error: String(err).slice(0, 180) });
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
