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
  // Optional title-page (1-bet) metadata collected from the user.
  titulEnabled?: boolean;
  titulUniversity?: string;
  titulFaculty?: string;
  titulStudent?: string;
  // outline-edit transient state
  editIndex?: number;
  pendingTitle?: string;
  editMsgId?: number;
  // Content style chosen once per deck, right after outline confirm —
  // 'cards' (default, points/bullets) vs 'prose' (continuous paragraph, only
  // for the types that support it — see card.prompt.prose.ts).
  contentMode?: 'cards' | 'prose';
}
