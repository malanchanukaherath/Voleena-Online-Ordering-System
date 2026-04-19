const rateLimitHeadersMiddleware = require('../middleware/rateLimitHeaders');

describe('rateLimitHeaders middleware', () => {
  // Simple: This creates the response harness.
  function buildResponseHarness() {
    const headers = {};
    const res = {
      setHeader: jest.fn((key, value) => {
        headers[key] = value;
      }),
      json: jest.fn((body) => body),
      send: jest.fn((body) => body)
    };

    return { res, headers };
  }

  test('calculates remaining requests from limit and current when remaining is absent', () => {
    const req = {
      rateLimit: {
        limit: 100,
        current: 12,
        resetTime: new Date('2026-04-04T12:00:00.000Z')
      }
    };

    const { res, headers } = buildResponseHarness();

    rateLimitHeadersMiddleware(req, res, () => {});
    res.json({ ok: true });

    expect(headers['RateLimit-Limit']).toBe(100);
    expect(headers['RateLimit-Remaining']).toBe(88);
    expect(headers['RateLimit-Reset']).toBe('Sat, 04 Apr 2026 12:00:00 GMT');
    expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(new Date('2026-04-04T12:00:00.000Z').getTime() / 1000));
  });

  test('uses provided remaining value from rate limiter metadata', () => {
    const req = {
      rateLimit: {
        limit: 50,
        current: 7,
        remaining: 43,
        resetTime: new Date('2026-04-04T13:00:00.000Z')
      }
    };

    const { res, headers } = buildResponseHarness();

    rateLimitHeadersMiddleware(req, res, () => {});
    res.send({ ok: true });

    expect(headers['RateLimit-Limit']).toBe(50);
    expect(headers['RateLimit-Remaining']).toBe(43);
    expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(new Date('2026-04-04T13:00:00.000Z').getTime() / 1000));
  });
});
