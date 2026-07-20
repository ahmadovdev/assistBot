import { CacheStatsService } from './cache-stats.service';

describe('CacheStatsService', () => {
  it('computes hit rate as cached / (cached + fresh)', () => {
    const s = new CacheStatsService();
    s.record({ cacheRead: 80, cacheWrite: 0, freshInput: 20 });
    const snap = s.snapshot();
    expect(snap.hitRate).toBeCloseTo(0.8);
    expect(snap.cachedInput).toBe(80);
    expect(snap.freshInput).toBe(20);
  });

  it('accumulates across calls', () => {
    const s = new CacheStatsService();
    s.record({ cacheRead: 50, cacheWrite: 10, freshInput: 50 });
    s.record({ cacheRead: 50, cacheWrite: 0, freshInput: 50 });
    const snap = s.snapshot();
    expect(snap.cachedInput).toBe(100);
    expect(snap.freshInput).toBe(100);
    expect(snap.cacheWrite).toBe(10);
    expect(snap.hitRate).toBeCloseTo(0.5);
  });

  it('reports a 0 hit rate before any input is seen', () => {
    expect(new CacheStatsService().snapshot().hitRate).toBe(0);
  });
});
