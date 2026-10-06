import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { imageCountForSlideCount, rankVisualCandidates } from './visual.policy';
import { SlideVisual, VisualSlideInput } from './visual.types';
import { VisualValidatorService } from './visual-validator.service';

/** Bounds the number of vision-validation calls per query — candidates are
 *  already ranked, so only the top few are worth spending a Claude call on. */
const MAX_CANDIDATES_CHECKED = 4;

type ApiMetadata = { value?: string };
type ApiImageInfo = {
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  url?: string;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, ApiMetadata>;
};
type ApiPage = {
  index?: number;
  title?: string;
  pageimage?: string;
  imageinfo?: ApiImageInfo[];
};
type ApiResponse = { query?: { pages?: Record<string, ApiPage> } };

const API_PATH = '/w/api.php';
const COMMONS_HOST = 'commons.wikimedia.org';
const ALLOWED_IMAGE_HOST = /^upload\.wikimedia\.org$/i;
const ALLOWED_SOURCE_HOST = /(^|\.)(wikimedia|wikipedia)\.org$|(^|\.)creativecommons\.org$/i;
const SEARCH_STOP_WORDS = new Set([
  'asosiy', 'haqida', 'uchun', 'bilan', 'orqali', 'kerak', 'bo‘ladi', 'bo\'ladi', 'va',
  'hamda', 'uning', 'ularning', 'tizimi', 'jarayoni', 'turlari', 'bosqichlari',
  'ta’siri', 'ta\'siri', 'tasiri', 'roli', 'ahamiyati', 'mavzusi',
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'main',
  'для', 'через', 'основной', 'основные', 'система', 'процесс',
]);

const TOPIC_ENGLISH_PATTERNS: Array<[RegExp, string]> = [
  [/sun.?iy\s+intellekt|su.?niy\s+intellekt|artificial\s+intelligence|\bai\b/i, 'artificial intelligence'],
  [/mashin(?:a|aviy)?\s+o.?rgan|machine\s+learning/i, 'machine learning'],
  [/ta.?lim|o.?quv|o.?qitish|education|learning/i, 'education'],
  [/raqamli\s+texnolog|digital\s+technolog/i, 'digital technology'],
  [/axborot\s+texnolog|information\s+technolog/i, 'information technology'],
  [/robot|robototexnika/i, 'robotics'],
  [/internet|tarmoq|network/i, 'internet'],
  [/ekolog|atrof.?muhit|environment/i, 'environment'],
  [/fotosintez|photosynthesis/i, 'photosynthesis'],
  [/iqtisod|econom/i, 'economics'],
  [/marketing/i, 'marketing'],
  [/moliya|finance/i, 'finance'],
  [/tibbiyot|medicine|medical/i, 'medicine'],
  [/biolog|biology/i, 'biology'],
  [/kimyo|chemistry/i, 'chemistry'],
  [/fizika|physics/i, 'physics'],
  [/tarix|history/i, 'history'],
  [/huquq|law|legal/i, 'law'],
];

function stripHtml(value: string | undefined): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactQuery(value: unknown): string {
  const words = stripHtml(String(value ?? ''))
    .replace(/[^\p{L}\p{N}'’ʻʼ-]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !SEARCH_STOP_WORDS.has(word.toLowerCase()));
  return words.slice(0, 7).join(' ');
}

function normalizedTopic(value: string): string {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[’ʻʼ`]/g, "'")
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function englishTopicQuery(topic: string): string | undefined {
  const normalized = normalizedTopic(topic);
  const terms: string[] = [];
  for (const [pattern, term] of TOPIC_ENGLISH_PATTERNS) {
    if (pattern.test(normalized) && !terms.includes(term)) terms.push(term);
  }
  return terms.slice(0, 4).join(' ') || undefined;
}

function preferredTopicQueries(topic: string): string[] {
  const normalized = normalizedTopic(topic);
  const queries: string[] = [];

  if (/sun.?iy\s+intellekt|su.?niy\s+intellekt|artificial\s+intelligence|\bai\b/i.test(normalized)) {
    if (/ta.?lim|o.?quv|o.?qitish|education|learning/i.test(normalized)) {
      queries.push(
        'artificial intelligence in education',
        'artificial intelligence education',
        'educational technology artificial intelligence',
      );
    } else {
      queries.push('artificial intelligence', 'machine learning artificial intelligence');
    }
  }

  if (/fotosintez|photosynthesis/i.test(normalized)) {
    queries.push('photosynthesis diagram', 'photosynthesis', 'photosynthesis process');
    if (/ekolog|atrof.?muhit|environment/i.test(normalized)) {
      queries.push('photosynthesis ecosystem', 'photosynthesis environment');
    }
  }

  if (/ekolog|atrof.?muhit|environment/i.test(normalized) && !queries.length) {
    queries.push('environmental science', 'ecosystem diagram');
  }

  return queries;
}

function queryCoreTerms(query: string): string[] {
  return compactQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length >= 4 && !['diagram', 'photo', 'image', 'illustration', 'technology'].includes(term));
}

function visualSearchText(page: ApiPage, visual: SlideVisual): string {
  return `${page.title ?? ''} ${visual.alt ?? ''}`.toLowerCase();
}

function languageWiki(language: string): string {
  if (language === 'ru' || language === 'en' || language === 'kaa') return language;
  return 'uz';
}

function topicVisualQueries(topic: string, slot: number): string[] {
  const base = compactQuery(topic);
  const english = englishTopicQuery(topic);
  const preferred = preferredTopicQueries(topic);
  if (!base && !english && !preferred.length) return [];
  const variants = slot === 0
    ? [
        preferred[0],
        preferred[0] && `${preferred[0]} diagram`,
        preferred[1],
        english && `${english} education technology`,
        english && `${english} diagram`,
        english && `${english} illustration`,
        base && `${base} diagram`,
        base,
        english,
      ]
    : [
        preferred[1] && `${preferred[1]} diagram`,
        preferred[2],
        preferred[0],
        english && `${english} diagram`,
        english && `${english} education technology`,
        english && `${english} illustration`,
        english && `${english} photo`,
        base && `${base} diagram`,
        base,
        english,
      ];
  return [...new Set(variants.map(compactQuery).filter(Boolean))];
}

function trustedUrl(value: string | undefined, kind: 'image' | 'source'): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    const allowed = kind === 'image'
      ? ALLOWED_IMAGE_HOST.test(parsed.hostname)
      : ALLOWED_SOURCE_HOST.test(parsed.hostname);
    if (parsed.protocol !== 'https:' || !allowed) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

@Injectable()
export class WikimediaService {
  private readonly logger = new Logger(WikimediaService.name);
  private readonly cache = new Map<string, Promise<SlideVisual[]>>();
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly validator?: VisualValidatorService,
  ) {
    this.userAgent = this.config.get<string>('app.visuals.wikimediaUserAgent')
      ?? 'LumioPresentationBot/1.0 (https://t.me/LumioApp_bot)';
    this.timeoutMs = this.config.get<number>('app.visuals.timeoutMs') ?? 8000;
  }

  async enrichSlides(
    slides: VisualSlideInput[],
    _topic: string,
    _language: string,
  ): Promise<VisualSlideInput[]> {
    this.logger.log('Visual enrichment disabled.');
    return slides;
  }

  async search(
    query: string,
    language: string,
    topic: string,
    excludedUrls: ReadonlySet<string> = new Set(),
  ): Promise<SlideVisual | null> {
    const key = `${language}:${query.toLowerCase()}`;
    const cached = this.cache.get(key);
    const candidates = cached ?? this.searchUncached(query, language).catch((error) => {
      this.logger.warn(`Wikimedia search failed for "${query}": ${String(error)}`);
      return [];
    });
    if (!cached) {
      this.cache.set(key, candidates);
      if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value!);
    }

    const shortlist = (await candidates)
      .filter((visual) => !excludedUrls.has(visual.url))
      .slice(0, MAX_CANDIDATES_CHECKED);
    for (const visual of shortlist) {
      const accepted = this.validator
        ? await this.validator.isAcceptable(visual, { topic, query })
        : true;
      if (accepted) return visual;
      this.logger.log(`Wikimedia candidate rejected by vision check: ${visual.url}`);
    }
    return null;
  }

  private async searchUncached(query: string, language: string): Promise<SlideVisual[]> {
    const commons = await this.searchCommons(query, language);
    if (commons.length) return commons;

    const wiki = languageWiki(language);
    const leadImage = await this.searchWikipediaPageImage(query, wiki);
    if (!leadImage) return [];
    const visual = await this.fetchFileVisual(`${wiki}.wikipedia.org`, leadImage, query);
    return visual ? [visual] : [];
  }

  private async searchCommons(query: string, language: string): Promise<SlideVisual[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '8',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '1600',
    });
    const data = await this.fetchJson(`https://${COMMONS_HOST}${API_PATH}?${params}`);
    const pages = Object.values(data.query?.pages ?? {}).sort(
      (a, b) => (a.index ?? 999) - (b.index ?? 999),
    );
    return this.pickBest(pages, query, language);
  }

  private async searchWikipediaPageImage(query: string, language: string): Promise<string | null> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '0',
      gsrlimit: '4',
      prop: 'pageimages',
      piprop: 'name',
    });
    const data = await this.fetchJson(`https://${language}.wikipedia.org${API_PATH}?${params}`);
    const pages = Object.values(data.query?.pages ?? {}).sort(
      (a, b) => (a.index ?? 999) - (b.index ?? 999),
    );
    return pages.find((page) => page.pageimage)?.pageimage ?? null;
  }

  private async fetchFileVisual(host: string, fileTitle: string, query: string): Promise<SlideVisual | null> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`,
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '1600',
    });
    const data = await this.fetchJson(`https://${host}${API_PATH}?${params}`);
    return this.pickBest(Object.values(data.query?.pages ?? {}), query, host.startsWith('en.') ? 'en' : 'local')[0] ?? null;
  }

  private pickBest(pages: ApiPage[], query: string, language: string): SlideVisual[] {
    const coreTerms = queryCoreTerms(query);
    const candidates = pages
      .map((page) => ({ page, visual: this.toVisual(page, query) }))
      .filter((item): item is { page: ApiPage; visual: SlideVisual } => !!item.visual)
      .filter((item) => {
        if (!coreTerms.length) return true;
        const text = visualSearchText(item.page, item.visual);
        const matches = coreTerms.filter((term) => text.includes(term)).length;
        return matches > 0;
      })
      .sort((a, b) => {
        const score = (item: { page: ApiPage; visual: SlideVisual }) => {
          const ratio = (item.visual.width ?? 1) / Math.max(item.visual.height ?? 1, 1);
          const ratioPenalty = ratio >= 1.15 && ratio <= 2.2 ? 0 : ratio >= 0.85 ? 1 : 2;
          const foreignDiagramPenalty = language === 'en' || item.visual.fit !== 'contain' ? 0 : 2;
          const text = visualSearchText(item.page, item.visual);
          const relevanceBonus = coreTerms.filter((term) => text.includes(term)).length * -8;
          const exactBonus = text.includes(query.toLowerCase()) ? -8 : 0;
          return (item.page.index ?? 99) * 2 + ratioPenalty + foreignDiagramPenalty + relevanceBonus + exactBonus;
        };
        return score(a) - score(b);
      });
    return candidates.map((candidate) => candidate.visual);
  }

  private toVisual(page: ApiPage, query: string): SlideVisual | null {
    const info = page.imageinfo?.[0];
    if (!info || !['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(info.mime ?? '')) {
      return null;
    }
    const url = trustedUrl(info.thumburl ?? info.url, 'image');
    const sourceUrl = trustedUrl(info.descriptionurl, 'source');
    if (!url || !sourceUrl) return null;

    const metadata = info.extmetadata ?? {};
    const author = stripHtml(metadata.Artist?.value || metadata.Credit?.value) || 'Wikimedia contributor';
    const license = stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value) || 'See source';
    const licenseUrl = trustedUrl(metadata.LicenseUrl?.value, 'source');
    const alt = stripHtml(metadata.ImageDescription?.value)
      || stripHtml(metadata.ObjectName?.value)
      || String(page.title ?? query).replace(/^File:/, '');

    return {
      provider: 'Wikimedia Commons',
      query,
      url,
      sourceUrl,
      alt: alt.slice(0, 220),
      author: author.slice(0, 120),
      license: license.slice(0, 80),
      licenseUrl,
      fit: info.mime === 'image/svg+xml' ? 'contain' : 'cover',
      width: info.thumbwidth,
      height: info.thumbheight,
    };
  }

  private async fetchJson(url: string): Promise<ApiResponse> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (response.ok) return response.json() as Promise<ApiResponse>;
      if (![429, 503].includes(response.status) || attempt === 1) {
        throw new Error(`HTTP ${response.status}`);
      }
      const retryAfter = Math.min(Number(response.headers.get('retry-after') ?? 1), 2);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    }
    return {};
  }
}
