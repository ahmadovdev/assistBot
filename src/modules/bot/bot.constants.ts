/**
 * Finite-state-machine states for the conversation flow.
 * Phase 1 uses IDLE and AWAITING_TOPIC. The rest are reserved
 * for Phase 2 (parameter collection) and beyond.
 */
export enum BotState {
  IDLE = 'idle',
  AWAITING_TOPIC = 'awaiting_topic',
  // Title-page (1-bet) metadata collection — optional, asked right after topic.
  AWAITING_TITLE_CHOICE = 'awaiting_title_choice',
  AWAITING_TITLE_UNIVERSITY = 'awaiting_title_university',
  AWAITING_TITLE_FACULTY = 'awaiting_title_faculty',
  AWAITING_TITLE_STUDENT = 'awaiting_title_student',
  AWAITING_SLIDE_COUNT = 'awaiting_slide_count',
  AWAITING_LANGUAGE = 'awaiting_language',
  AWAITING_THEME = 'awaiting_theme',
  OUTLINING = 'outlining',
  AWAITING_OUTLINE_CONFIRM = 'awaiting_outline_confirm',
  // Content style — cards (default) vs continuous prose — asked once per deck,
  // right after the outline is confirmed and before card generation starts.
  AWAITING_CONTENT_MODE = 'awaiting_content_mode',
  AWAITING_SLIDE_TITLE_EDIT = 'awaiting_slide_title_edit',
  AWAITING_NEW_SLIDE_TITLE = 'awaiting_new_slide_title',
  GENERATING = 'generating',
  // /testslide — admin-only, token-free renderer for the saved 21-type catalog.
  TESTSLIDE_AWAITING_TYPE = 'testslide_awaiting_type',
  TESTSLIDE_AWAITING_THEME = 'testslide_awaiting_theme',
}
