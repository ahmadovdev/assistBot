import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult } from '../ai/llm.types';
import { buildOutlineSchema, Outline } from '../ai/schemas/outline.schema';
import { OUTLINE_SYSTEM, buildOutlineUser } from '../ai/prompts/outline.prompt';
import { sanitizeUzbekScript } from '../ai/uzbek-script.sanitizer';
import { SlideType, resolveModel } from '../ai/layout.catalog';

export interface OutlineInput {
  topic: string;
  slideCount: number;
  language: string;
}

const BODY_FALLBACKS: SlideType[] = [
  'CONTENT',
  'BATAFSIL',
  'MISOL',
  'DEFINITION',
  'PROCESS',
  'COMPARISON',
  'TIMELINE',
  'TURLAR',
  'RELEVANCE',
  'AIM_TASKS',
  'PROBLEMS_SOLUTIONS',
  'FINDING',
];

const TYPE_ALTERNATES: Partial<Record<SlideType, SlideType[]>> = {
  CONTENT: ['BATAFSIL', 'MISOL', 'DEFINITION', 'PROCESS'],
  BATAFSIL: ['CONTENT', 'MISOL', 'PROCESS'],
  MISOL: ['CONTENT', 'BATAFSIL', 'COMPARISON'],
  TURLAR: ['CONTENT', 'COMPARISON', 'PROCESS'],
  PROCESS: ['CONTENT', 'TIMELINE', 'BATAFSIL'],
  TIMELINE: ['CONTENT', 'PROCESS', 'BATAFSIL'],
  COMPARISON: ['CONTENT', 'TURLAR', 'BATAFSIL'],
  DEFINITION: ['CONTENT', 'BATAFSIL', 'TURLAR'],
  RELEVANCE: ['CONTENT', 'AIM_TASKS'],
  AIM_TASKS: ['CONTENT', 'RELEVANCE'],
  OBJECT_SUBJECT: ['CONTENT', 'AIM_TASKS'],
  FINDING: ['CONTENT', 'PROBLEMS_SOLUTIONS'],
  PROBLEMS_SOLUTIONS: ['CONTENT', 'FINDING'],
  STATS: ['CONTENT', 'FINDING'],
  REFERENCES: ['CONCLUSION', 'CONTENT'],
  CONCLUSION: ['CONTENT', 'BATAFSIL'],
};

function pickReplacement(current: SlideType, prev: SlideType | undefined, next: SlideType | undefined, nearEnd: boolean): SlideType {
  const candidates = nearEnd
    ? ['CONCLUSION', 'CONTENT', 'BATAFSIL', ...(TYPE_ALTERNATES[current] ?? []), ...BODY_FALLBACKS] as SlideType[]
    : [...(TYPE_ALTERNATES[current] ?? []), ...BODY_FALLBACKS];
  return candidates.find((type) => type !== current && type !== prev && type !== next && type !== 'TITLE' && type !== 'CLOSING') ?? 'CONTENT';
}

function normalizeOutline(data: Outline): Outline {
  const slides = data.slides.map((slide) => ({ ...slide, key_points: [...slide.key_points] }));
  if (!slides.length) return data;

  slides[0].type = 'TITLE';
  slides[slides.length - 1].type = 'CLOSING';
  if (slides.length > 2 && slides[1].type === 'TITLE') slides[1].type = 'AGENDA';

  for (let i = 1; i < slides.length - 1; i += 1) {
    const prev = slides[i - 1]?.type;
    const next = slides[i + 1]?.type;
    const nearEnd = i >= slides.length - 3;
    if (slides[i].type === prev) {
      slides[i].type = pickReplacement(slides[i].type, prev, next, nearEnd);
    }
    if (nearEnd && slides[i].type === 'TURLAR') {
      slides[i].type = pickReplacement('TURLAR', slides[i - 1]?.type, next, true);
    }
  }

  for (let i = 1; i < slides.length - 1; i += 1) {
    if (slides[i].type === slides[i - 1]?.type) {
      slides[i].type = pickReplacement(slides[i].type, slides[i - 1]?.type, slides[i + 1]?.type, i >= slides.length - 3);
    }
  }

  return { ...data, slides };
}

function postprocessOutline(data: Outline, language: string): Outline {
  const sanitized = language === 'uz' ? sanitizeUzbekScript(data) : data;
  return normalizeOutline(sanitized);
}

@Injectable()
export class OutlineService {
  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  generate(input: OutlineInput): Promise<LlmResult<Outline>> {
    const model = resolveModel(this.config.get<string>('app.ai.outlineModel') as string, input.language);
    return this.llm.generateStructured({
      system: OUTLINE_SYSTEM,
      user: buildOutlineUser(input),
      schema: buildOutlineSchema(input.slideCount),
      model,
      postprocess: (data) => postprocessOutline(data, input.language),
    });
  }
}
