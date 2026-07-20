import { RateLimitService } from './rate-limit.service';

function fakeConfig(overrides: Record<string, unknown> = {}) {
  const vals: Record<string, unknown> = {
    'app.rateLimit.enabled': true,
    'app.rateLimit.daily': 3,
    'app.rateLimit.lockTtlSec': 1800,
    'app.rateLimit.globalConcurrency': 1,
    'app.admin.telegramIds': [],
    ...overrides,
  };
  return { get: (k: string) => vals[k] } as any;
}

function makeService(evalResult: unknown, config = fakeConfig()) {
  const redis = { eval: jest.fn().mockResolvedValue(evalResult) } as any;
  const svc = new RateLimitService(redis, config);
  return { svc, redis };
}

describe('RateLimitService.startGeneration', () => {
  it('allows and reports usage when the script returns ok', async () => {
    const { svc } = makeService(['ok', 1]);
    const d = await svc.startGeneration(1n);
    expect(d).toMatchObject({ allowed: true, used: 1, limit: 3 });
  });

  it('bypasses the daily quota for a configured admin but keeps Redis safety guards', async () => {
    const config = fakeConfig({ 'app.admin.telegramIds': ['99'] });
    const { svc, redis } = makeService(['ok_admin', 0], config);
    const d = await svc.startGeneration(1n, 99n);

    expect(d).toEqual({ allowed: true, used: 0, limit: 3, unlimited: true });
    const args = redis.eval.mock.calls[0];
    expect(args[args.length - 1]).toBe('1');
  });

  it('does not grant admin bypass based on the internal database user id', async () => {
    const config = fakeConfig({ 'app.admin.telegramIds': ['99'] });
    const { svc, redis } = makeService(['daily', 3], config);
    const d = await svc.startGeneration(99n, 7n);

    expect(d).toMatchObject({ allowed: false, reason: 'daily' });
    const args = redis.eval.mock.calls[0];
    expect(args[args.length - 1]).toBe('0');
  });

  it('blocks a concurrent (in-flight) generation', async () => {
    const { svc } = makeService(['inflight', 0]);
    const d = await svc.startGeneration(1n);
    expect(d).toEqual({ allowed: false, reason: 'inflight' });
  });

  it('blocks when the daily quota is exceeded and reports reset time', async () => {
    const { svc } = makeService(['daily', 3]);
    const d = await svc.startGeneration(1n);
    expect(d).toMatchObject({ allowed: false, reason: 'daily', used: 3, limit: 3 });
    expect((d as any).resetsAt).toBeInstanceOf(Date);
  });

  it('blocks when the server has no global generation slots left', async () => {
    const { svc } = makeService(['busy', 1]);
    const d = await svc.startGeneration(1n);
    expect(d).toEqual({ allowed: false, reason: 'busy', active: 1, limit: 1 });
  });

  it('short-circuits (no Redis call) when disabled', async () => {
    const { svc, redis } = makeService(['ok', 1], fakeConfig({ 'app.rateLimit.enabled': false }));
    const d = await svc.startGeneration(1n);
    expect(d).toMatchObject({ allowed: true });
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it('fails open (allows) when Redis errors, so an outage does not block users', async () => {
    const redis = { eval: jest.fn().mockRejectedValue(new Error('redis down')) } as any;
    const svc = new RateLimitService(redis, fakeConfig());
    const d = await svc.startGeneration(1n);
    expect(d).toMatchObject({ allowed: true });
  });
});

describe('RateLimitService.finishGeneration', () => {
  it('passes refund flag "1" when refunding', async () => {
    const { svc, redis } = makeService(1);
    await svc.finishGeneration(7n, { refund: true });
    const args = redis.eval.mock.calls[0];
    expect(args[args.length - 1]).toBe('1');
  });

  it('passes refund flag "0" when not refunding', async () => {
    const { svc, redis } = makeService(1);
    await svc.finishGeneration(7n, { refund: false });
    const args = redis.eval.mock.calls[0];
    expect(args[args.length - 1]).toBe('0');
  });

  it('does nothing when disabled', async () => {
    const { svc, redis } = makeService(1, fakeConfig({ 'app.rateLimit.enabled': false }));
    await svc.finishGeneration(7n, { refund: true });
    expect(redis.eval).not.toHaveBeenCalled();
  });
});
