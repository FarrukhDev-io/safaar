import { isRetryablePostgresError } from './postgres.service';

describe('isRetryablePostgresError', () => {
  it('retries transient connection, serialization, and deadlock failures', () => {
    expect(isRetryablePostgresError({ code: '40001' })).toBe(true);
    expect(isRetryablePostgresError({ code: '40P01' })).toBe(true);
    expect(isRetryablePostgresError({ code: '08006' })).toBe(true);
  });

  it('does not retry deterministic query or constraint errors', () => {
    expect(isRetryablePostgresError({ code: '23505' })).toBe(false);
    expect(isRetryablePostgresError({ code: '42601' })).toBe(false);
    expect(isRetryablePostgresError(new Error('plain error'))).toBe(false);
  });
});
