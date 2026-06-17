import { Context } from 'grammy';
import { User } from '@prisma/client';

/**
 * grammy Context augmented with our resolved DB user.
 * `user` is guaranteed to be set by the auth middleware before any handler runs.
 */
export interface BotContext extends Context {
  user: User;
}

/** Data collected step-by-step during the parameter-collection wizard. */
export interface WizardContext {
  topic?: string;
  slideCount?: number;
  language?: string;
  tone?: string;
  themeKey?: string;
  presentationId?: string;
}
