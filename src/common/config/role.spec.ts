import { appRole, runsBot, runsWorkers } from './role';

describe('appRole / runsBot / runsWorkers', () => {
  const original = process.env.APP_ROLE;
  afterEach(() => {
    if (original === undefined) delete process.env.APP_ROLE;
    else process.env.APP_ROLE = original;
  });

  it('defaults to "all" (both bot and workers) when unset', () => {
    delete process.env.APP_ROLE;
    expect(appRole()).toBe('all');
    expect(runsBot()).toBe(true);
    expect(runsWorkers()).toBe(true);
  });

  it('bot role runs the bot but not workers', () => {
    process.env.APP_ROLE = 'bot';
    expect(appRole()).toBe('bot');
    expect(runsBot()).toBe(true);
    expect(runsWorkers()).toBe(false);
  });

  it('worker role runs workers but not the bot', () => {
    process.env.APP_ROLE = 'worker';
    expect(appRole()).toBe('worker');
    expect(runsBot()).toBe(false);
    expect(runsWorkers()).toBe(true);
  });

  it('treats an unknown value as "all"', () => {
    process.env.APP_ROLE = 'nonsense';
    expect(appRole()).toBe('all');
  });
});
