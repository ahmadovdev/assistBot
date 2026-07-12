export type AppRole = 'all' | 'bot' | 'worker';

/**
 * Process role, read straight from the environment.
 *
 * IMPORTANT: this is read at module-load time (to decide which providers to
 * register), which runs BEFORE @nestjs/config loads any `.env` file. So
 * APP_ROLE must be a REAL environment variable — set it via the PM2 ecosystem
 * `env` block, not only in `.env`. Unset/unknown → 'all' (single-process dev).
 */
export function appRole(): AppRole {
  const r = process.env.APP_ROLE;
  return r === 'bot' || r === 'worker' ? r : 'all';
}

/** True in processes that should run the BullMQ workers ('all' or 'worker'). */
export function runsWorkers(): boolean {
  return appRole() !== 'bot';
}

/** True in processes that should run the Telegram bot ('all' or 'bot'). */
export function runsBot(): boolean {
  return appRole() !== 'worker';
}
