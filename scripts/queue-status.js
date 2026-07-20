const fs = require('fs');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const raw of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function summarizeJob(job) {
  if (!job) return null;
  const processedOn = job.processedOn ?? null;
  const finishedOn = job.finishedOn ?? null;
  return {
    id: job.id,
    name: job.name,
    attemptsMade: job.attemptsMade,
    ageSec: processedOn ? Math.round((Date.now() - processedOn) / 1000) : null,
    finishedAgeSec: finishedOn ? Math.round((Date.now() - finishedOn) / 1000) : null,
    progress: job.progress,
    failedReason: job.failedReason,
    data: {
      presentationId: job.data?.presentationId,
      userId: job.data?.userId,
      themeId: job.data?.themeId,
      contentMode: job.data?.contentMode,
      slideCount: job.data?.outline?.slides?.length,
    },
  };
}

async function main() {
  loadEnvFile('.env');

  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
  const redis = new Redis(connection);
  const queueNames = ['outline', 'cards', 'render'];

  const result = {};
  for (const name of queueNames) {
    const queue = new Queue(name, { connection });
    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'failed',
      'completed',
      'delayed',
      'paused',
    );
    const active = await queue.getActive(0, 10);
    const waiting = await queue.getWaiting(0, 10);
    const failed = await queue.getFailed(0, 5);

    const activeWithLocks = [];
    for (const job of active) {
      const summary = summarizeJob(job);
      const ttl = await redis.ttl(`bull:${name}:${job.id}:lock`);
      activeWithLocks.push({ ...summary, lockTtlSec: ttl });
    }

    result[name] = {
      counts,
      active: activeWithLocks,
      waiting: waiting.map(summarizeJob),
      failed: failed.map(summarizeJob),
    };
    await queue.close();
  }

  await redis.quit();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
