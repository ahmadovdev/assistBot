// PM2 process topology for production.
//
// The bot and the workers run as SEPARATE processes so a heavy/slow job
// (e.g. a Puppeteer render) can never block the Telegram event loop and
// freeze the bot for everyone. They coordinate purely through Redis/BullMQ.
//
//   presentation-bot     APP_ROLE=bot     Telegram long-polling + enqueues jobs
//   presentation-worker  APP_ROLE=worker  runs the BullMQ processors
//
// Only ONE process may long-poll the bot token (else Telegram 409), so exactly
// one 'bot' app with instances: 1. Never set APP_ROLE=all here.
//
// Deploy / switch:  pm2 delete presentation-bot 2>/dev/null; pm2 start ecosystem.config.js
// Reload after build: pm2 reload ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'presentation-bot',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', APP_ROLE: 'bot' },
      // Give in-flight update handling a moment to finish on restart.
      kill_timeout: 10000,
      max_memory_restart: '500M',
      merge_logs: true,
      time: true,
    },
    {
      name: 'presentation-worker',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', APP_ROLE: 'worker' },
      // Long enough for an in-flight render job to finish before SIGKILL, so
      // graceful shutdown (enableShutdownHooks) can drain BullMQ workers and
      // jobs aren't orphaned mid-run.
      kill_timeout: 45000,
      max_memory_restart: '1200M',
      merge_logs: true,
      time: true,
    },
  ],
};
