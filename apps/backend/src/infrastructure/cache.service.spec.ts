import { ConfigService } from '@nestjs/config';
import { AppCacheService } from './cache.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    return {
      status: 'ready',
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn((key: string) =>
        Promise.resolve(store.has(key) ? store.get(key)! : null),
      ),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        const existed = store.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      // Deliberately unimplemented — production Redis (6.0.16) predates
      // GETDEL (added in 6.2.0) and would reject this command. `take()`
      // must not rely on it.
      getdel: jest.fn(() =>
        Promise.reject(new Error("ERR unknown command 'GETDEL'")),
      ),
    };
  });
});

describe('AppCacheService.take (regression: production Redis 6.0.16 does not support GETDEL — take() used it directly, silently swallowed the resulting error, and always reported "not found" even for a value that was correctly stored, breaking password-reset-token consumption and the OAuth state/exchange flows)', () => {
  function redisConfig() {
    return {
      get: (key: string) =>
        key === 'CACHE_ENABLED'
          ? 'true'
          : key === 'CACHE_DEFAULT_TTL_SECONDS'
            ? '60'
            : key === 'REDIS_URL'
              ? 'redis://localhost:6379/0'
              : undefined,
    };
  }

  it('retrieves and removes a value stored via Redis, without calling the unsupported GETDEL command', async () => {
    const cache = new AppCacheService(redisConfig() as unknown as ConfigService);

    await cache.set('reset-token-key', { phone: '+998901234567' }, 600);

    await expect(cache.take('reset-token-key')).resolves.toEqual({
      phone: '+998901234567',
    });
    // Second take must find nothing — the first take deleted it.
    await expect(cache.take('reset-token-key')).resolves.toBeUndefined();
  });
});

describe('AppCacheService.take (in-memory fallback, no Redis configured)', () => {
  it('returns a local value only once', async () => {
    const config = {
      get: (key: string) =>
        key === 'CACHE_ENABLED'
          ? 'true'
          : key === 'CACHE_DEFAULT_TTL_SECONDS'
            ? '60'
            : undefined,
    };
    const cache = new AppCacheService(config as unknown as ConfigService);

    await cache.set('one-time-code', { userId: 'user-1' }, 60);

    await expect(cache.take('one-time-code')).resolves.toEqual({
      userId: 'user-1',
    });
    await expect(cache.take('one-time-code')).resolves.toBeUndefined();
  });

  it('deduplicates concurrent producers for the same cache key', async () => {
    const config = {
      get: (key: string) =>
        key === 'CACHE_ENABLED'
          ? 'true'
          : key === 'CACHE_DEFAULT_TTL_SECONDS'
            ? '60'
            : undefined,
    };
    const cache = new AppCacheService(config as unknown as ConfigService);
    const producer = jest.fn(() => Promise.resolve({ value: 'fresh' }));

    const [first, second, third] = await Promise.all([
      cache.getOrSet('shared-key', 60, producer),
      cache.getOrSet('shared-key', 60, producer),
      cache.getOrSet('shared-key', 60, producer),
    ]);

    expect(producer).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ value: 'fresh' });
    expect(second).toEqual({ value: 'fresh' });
    expect(third).toEqual({ value: 'fresh' });
  });
});
