/**
 * Finite-state-machine states for the conversation flow.
 * Phase 1 uses IDLE and AWAITING_TOPIC. The rest are reserved
 * for Phase 2 (parameter collection) and beyond.
 */
export enum BotState {
  IDLE = 'idle',
  AWAITING_TOPIC = 'awaiting_topic',
  AWAITING_SLIDE_COUNT = 'awaiting_slide_count',
  AWAITING_LANGUAGE = 'awaiting_language',
  AWAITING_TONE = 'awaiting_tone',
  AWAITING_THEME = 'awaiting_theme',
  OUTLINING = 'outlining',
  AWAITING_OUTLINE_CONFIRM = 'awaiting_outline_confirm',
  AWAITING_SLIDE_TITLE_EDIT = 'awaiting_slide_title_edit',
  AWAITING_NEW_SLIDE_TITLE = 'awaiting_new_slide_title',
  GENERATING = 'generating',
}
