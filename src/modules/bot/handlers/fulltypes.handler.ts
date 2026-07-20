import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InlineKeyboard } from 'grammy';
import { Queue } from 'bullmq';
import { BotContext, WizardContext } from '../bot.types';
import { BotState } from '../bot.constants';
import { SessionService } from '../session.service';
import { ThemesService } from '../../themes/themes.service';
import { PresentationsService } from '../../presentations/presentations.service';
import { RateLimitService } from '../../ratelimit/rate-limit.service';
import { QUEUES } from '../../../infra/queue/queue.constants';
import { CardsJobData } from '../../../infra/queue/queue.types';
import { Outline } from '../../ai/schemas/outline.schema';
import { SlideType } from '../../ai/layout.catalog';

const FULL_TYPE_ORDER: SlideType[] = [
  'TITLE',
  'AGENDA',
  'RELEVANCE',
  'OBJECT_SUBJECT',
  'DEFINITION',
  'MISOL',
  'CONTENT',
  'TURLAR',
  'BATAFSIL',
  'COMPARISON',
  'PROCESS',
  'TIMELINE',
  'STATS',
  'FINDING',
  'PROBLEMS_SOLUTIONS',
  'REFERENCES',
  'CONCLUSION',
  'CLOSING',
];

@Injectable()
export class FullTypesHandler {
  private readonly logger = new Logger(FullTypesHandler.name);

  constructor(
    private readonly session: SessionService,
    private readonly themes: ThemesService,
    private readonly presentations: PresentationsService,
    private readonly rateLimit: RateLimitService,
    @InjectQueue(QUEUES.CARDS) private readonly cardsQueue: Queue<CardsJobData>,
  ) {}

  private isAdmin(ctx: BotContext): boolean {
    const adminId = process.env.TESTSLIDE_ADMIN_ID;
    return !!adminId && String(ctx.from?.id) === adminId;
  }

  async handleCommand(ctx: BotContext): Promise<void> {
    if (!this.isAdmin(ctx)) return;
    const topic = this.extractTopic(ctx.message?.text ?? '');
    await this.session.reset(ctx.user.id);

    if (!topic) {
      await this.session.setState(ctx.user.id, BotState.FULLTYPES_AWAITING_TOPIC);
      await ctx.reply(
        '🧪 AI full type showcase\n\nMavzuni yuboring. Men 18 ta active slide type’ning hammasini majburan ishlatib, contentni AI orqali yozdiraman.',
      );
      return;
    }

    await this.askTheme(ctx, topic);
  }

  async handleTopic(ctx: BotContext, topic: string): Promise<void> {
    if (!this.isAdmin(ctx)) return;
    await this.askTheme(ctx, topic);
  }

  async handleCallback(ctx: BotContext): Promise<void> {
    if (!this.isAdmin(ctx)) return;
    const data = ctx.callbackQuery?.data;
    if (!data?.startsWith('fttheme:')) return;
    await ctx.answerCallbackQuery();

    const { state, context } = await this.session.get(ctx.user.id);
    if (state !== BotState.FULLTYPES_AWAITING_THEME) return;

    const themeKey = data.split(':')[1];
    const theme = await this.themes.findByKey(themeKey);
    const topic = (context as WizardContext).fullTypesTopic;
    if (!theme || !topic) {
      await ctx.reply('Sessiya topilmadi. /fulltypes orqali qayta boshlang.');
      await this.session.reset(ctx.user.id);
      return;
    }

    const decision = await this.rateLimit.startGeneration(ctx.user.id, ctx.user.telegramId);
    if (!decision.allowed) {
      const msg = decision.reason === 'inflight'
        ? '⏳ Avvalgi taqdimotingiz hali tayyorlanmoqda.'
        : decision.reason === 'busy'
          ? '⏳ Server hozir boshqa taqdimot tayyorlayapti. Birozdan keyin urinib ko‘ring.'
          : `🛑 Bugungi limit tugadi (${decision.limit} ta/kun).`;
      await ctx.reply(msg);
      return;
    }

    try {
      const wizard: WizardContext = {
        topic,
        language: 'uz',
        slideCount: FULL_TYPE_ORDER.length,
        themeKey,
        titulEnabled: false,
        contentMode: 'cards',
      };
      const presentation = await this.presentations.createFromWizard(ctx.user.id, theme.id, wizard);
      const outline = buildFullTypesOutline(topic);
      await this.presentations.saveOutline(presentation.id, outline);
      await this.session.patchContext(ctx.user.id, {
        ...wizard,
        presentationId: presentation.id,
      });
      await this.session.setState(ctx.user.id, BotState.GENERATING);

      await ctx.reply(
        `✅ AI full type showcase boshlandi\n\n` +
        `📌 Mavzu: ${topic}\n` +
        `🎨 Tema: ${theme.name}\n` +
        `🧩 Type: ${FULL_TYPE_ORDER.length}/${FULL_TYPE_ORDER.length}\n\n` +
        `⏳ Har bir slayd contentini AI yozmoqda...`,
      );

      await this.cardsQueue.add(
        'generate',
        {
          presentationId: presentation.id,
          titul: { enabled: false },
          contentMode: 'cards',
          fullTypesShowcase: true,
        },
        { attempts: 1 },
      );
    } catch (err) {
      this.logger.error(`/fulltypes failed: ${String(err)}`);
      await this.rateLimit.finishGeneration(ctx.user.id, { refund: true });
      await this.session.reset(ctx.user.id);
      await ctx.reply(`❌ Full type showcase xatolik berdi: ${String(err)}`);
    }
  }

  private async askTheme(ctx: BotContext, topic: string): Promise<void> {
    await this.session.patchContext(ctx.user.id, { fullTypesTopic: topic });
    await this.session.setState(ctx.user.id, BotState.FULLTYPES_AWAITING_THEME);

    const themes = await this.themes.findAll();
    const kb = new InlineKeyboard();
    themes.forEach((theme, i) => {
      kb.text(theme.name, `fttheme:${theme.key}`);
      if (i % 2 === 1) kb.row();
    });

    await ctx.reply(
      `🧪 AI full type showcase\n\n` +
      `📌 Mavzu: ${topic}\n` +
      `🧩 ${FULL_TYPE_ORDER.length} ta active type majburan ishlatiladi.\n` +
      `💸 Token ketadi: outline tayyor, lekin har bir slayd contentini AI yozadi.\n\n` +
      `Qaysi dizaynda ko‘ramiz?`,
      { reply_markup: kb },
    );
  }

  private extractTopic(text: string): string {
    return text
      .replace(/^\/fulltypes(?:@\w+)?/i, '')
      .trim()
      .slice(0, 500);
  }
}

function buildFullTypesOutline(topic: string): Outline {
  const slides = FULL_TYPE_ORDER.map((type, index) => ({
    position: index + 1,
    type,
    ...outlineCopy(type, topic),
  }));
  return {
    deck_title: `${topic}: to‘liq slide type showcase`,
    slides,
  };
}

function outlineCopy(type: SlideType, topic: string): { title: string; key_points: string[] } {
  switch (type) {
    case 'TITLE':
      return { title: topic, key_points: ['Mavzuni taqdimot formatida ochish'] };
    case 'AGENDA':
      return { title: 'Reja', key_points: ['Kirish va dolzarblik', 'Asosiy tushunchalar', 'Tahlil va misollar', 'Xulosa'] };
    case 'RELEVANCE':
      return { title: `${topic} bugungi amaliyotda muhim o‘rin tutadi`, key_points: ['Mavzuning hozirgi ahamiyati', 'Talaba yoki mutaxassis uchun foydasi', 'Amaliy qo‘llanish sohasi'] };
    case 'OBJECT_SUBJECT':
      return { title: 'Tahlil obyekti va predmeti aniq ajratiladi', key_points: ['Keng o‘rganiladigan obyekt', 'Aniq tahlil qilinadigan jihat', 'Tadqiqot chegarasi'] };
    case 'DEFINITION':
      return { title: 'Asosiy tushuncha aniq ta’rif talab qiladi', key_points: ['Markaziy termin', 'Ta’rifning mazmuni', 'Asosiy belgilar'] };
    case 'MISOL':
      return { title: 'Aniq misol mavzuni tezroq tushuntiradi', key_points: ['Real yoki sodda vaziyat', 'Misolning ishlash mexanizmi', 'Misoldan olinadigan xulosa'] };
    case 'CONTENT':
      return { title: `${topic} bir nechta bog‘liq g‘oyadan iborat`, key_points: ['Asosiy tamoyil', 'Sabab-oqibat bog‘lanishi', 'Amaliy natija'] };
    case 'TURLAR':
      return { title: `${topic} ichida bir nechta asosiy tur ajraladi`, key_points: ['Birinchi tur', 'Ikkinchi tur', 'Uchinchi tur', 'Qo‘llanish farqi'] };
    case 'BATAFSIL':
      return { title: 'Muhim qism chuqurroq izoh talab qiladi', key_points: ['Jarayonning ichki mantiqi', 'Muhim tafsilotlar', 'Nima uchun bu qism hal qiluvchi'] };
    case 'COMPARISON':
      return { title: 'Ikki yondashuvni solishtirish farqni ochadi', key_points: ['Birinchi yondashuv xususiyatlari', 'Ikkinchi yondashuv xususiyatlari', 'Tanlash mezoni'] };
    case 'PROCESS':
      return { title: `${topic} ketma-ket bosqichlar orqali ishlaydi`, key_points: ['Boshlang‘ich bosqich', 'Qayta ishlash bosqichi', 'Natija bosqichi'] };
    case 'TIMELINE':
      return { title: `${topic} vaqt davomida rivojlanib kelgan`, key_points: ['Dastlabki bosqich', 'Muhim burilish', 'Hozirgi holat', 'Keyingi yo‘nalish'] };
    case 'STATS':
      return { title: 'Ko‘rsatkichlar mavzu ta’sirini aniqroq ko‘rsatadi', key_points: ['Mavzuga oid ishonchli raqamlar', 'Raqamlar manbasi', 'Ko‘rsatkichlardan olinadigan xulosa'] };
    case 'FINDING':
      return { title: 'Asosiy natija mavzuning qiymatini ko‘rsatadi', key_points: ['Tahlildan kelib chiqadigan natija', 'Natijani asoslaydigan dalil', 'Cheklov yoki izoh'] };
    case 'PROBLEMS_SOLUTIONS':
      return { title: 'Muammolar yechim bilan birga ko‘rsatilishi kerak', key_points: ['Eng ko‘p uchraydigan muammo', 'Amaliy yechim', 'Joriy etishdagi ehtiyot chorasi'] };
    case 'REFERENCES':
      return { title: 'Manbalar ishonchlilikni oshiradi', key_points: ['Rasmiy yoki ilmiy manbalar', 'Kitob va maqolalar', 'Ishonchli veb manbalar'] };
    case 'CONCLUSION':
      return { title: 'Xulosa asosiy fikrlarni jamlaydi', key_points: ['Eng muhim takeaway', 'Amaliy ahamiyat', 'Keyingi o‘rganish yo‘nalishi'] };
    case 'CLOSING':
      return { title: 'E’tiboringiz uchun rahmat!', key_points: [] };
  }
}
