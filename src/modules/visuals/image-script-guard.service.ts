import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker, detect, Worker } from 'tesseract.js';
import * as path from 'path';

/** Persisted so tesseract's ~10MB eng/osd trained-data files are downloaded
 *  once per deploy, not once per validated image. */
const CACHE_DIR = path.join(__dirname, '..', '..', '..', '.cache', 'tesseract');

/** tesseract.js script names that are never English. Latin is deliberately
 *  excluded — English, French, German, Uzbek-Latin etc. all share it, so a
 *  Latin verdict needs an actual language-id pass, not a script check. */
const NON_LATIN_SCRIPTS = new Set([
  'Cyrillic', 'Arabic', 'Han', 'Hebrew', 'Devanagari', 'Thai', 'Armenian',
  'Georgian', 'Hiragana', 'Katakana', 'Hangul', 'Greek', 'Bengali', 'Tamil',
  'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Gurmukhi', 'Sinhala', 'Myanmar',
  'Khmer', 'Lao', 'Tibetan', 'Amharic', 'Syriac', 'Thaana',
]);

/** Below this, tesseract's own script guess is too noisy to trust (e.g. a
 *  handful of texture pixels in a photo misread as glyphs) — treat as "no
 *  text" rather than risk a false disqualification. */
const MIN_SCRIPT_CONFIDENCE = 5;
const MIN_OCR_TEXT_LENGTH = 12;

/**
 * Free, local, deterministic first pass for the "any visible text must be
 * English" rule — catches the common case (a Commons file baked with
 * non-Latin captions, or a same-diagram translated variant, see the
 * "CAM_cycle(ru).svg" naming convention Commons itself uses) without ever
 * spending an Anthropic vision call. Only genuinely ambiguous cases (no
 * script detected, or Latin-script text franc can't confidently place) fall
 * through to the real AI vision check in visual-validator.service.ts.
 */
@Injectable()
export class ImageScriptGuardService implements OnModuleDestroy {
  private readonly logger = new Logger(ImageScriptGuardService.name);
  private worker: Promise<Worker> | null = null;

  async hasDisqualifyingText(imageBuffer: Buffer): Promise<boolean> {
    try {
      const { data } = await detect(imageBuffer, { cachePath: CACHE_DIR });
      if (!data.script || (data.script_confidence ?? 0) < MIN_SCRIPT_CONFIDENCE) return false;

      if (NON_LATIN_SCRIPTS.has(data.script)) {
        this.logger.log(`Local script guard: non-Latin script "${data.script}" detected — rejecting without an AI call`);
        return true;
      }
      if (data.script !== 'Latin') return false;

      const text = await this.extractText(imageBuffer);
      if (!text || text.length < MIN_OCR_TEXT_LENGTH) return false;

      const { franc } = await import('franc');
      const lang = franc(text);
      if (lang !== 'und' && lang !== 'eng') {
        this.logger.log(`Local script guard: Latin-script text detected as non-English (franc="${lang}") — rejecting without an AI call`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.warn(`Local script guard failed, deferring to AI check: ${String(error)}`);
      return false;
    }
  }

  private async extractText(imageBuffer: Buffer): Promise<string> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(imageBuffer);
    return data.text.replace(/\s+/g, ' ').trim();
  }

  private getWorker(): Promise<Worker> {
    if (!this.worker) this.worker = createWorker('eng', undefined, { cachePath: CACHE_DIR });
    return this.worker;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) await (await this.worker).terminate();
  }
}
