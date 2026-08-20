import { assertStrongSecret, isWeakSecret } from './secret-strength';

describe('isWeakSecret (regression: CRITICAL — hyphenated "change-me" bypassed the old underscore-only check)', () => {
  it('treats undefined/null/empty as weak', () => {
    expect(isWeakSecret(undefined)).toBe(true);
    expect(isWeakSecret(null)).toBe(true);
    expect(isWeakSecret('')).toBe(true);
  });

  it('treats anything under 32 characters as weak', () => {
    expect(isWeakSecret('a'.repeat(31))).toBe(true);
    expect(isWeakSecret('a'.repeat(32))).toBe(false);
  });

  it('rejects the exact previous hardcoded JWT fallback strings', () => {
    expect(isWeakSecret('development-access-secret-change-me-32')).toBe(true);
    expect(isWeakSecret('development-refresh-secret-change-me-32')).toBe(true);
  });

  it('rejects every separator variant between "change" and "me", case-insensitively', () => {
    const long = (s: string) => 'x'.repeat(15) + s + 'x'.repeat(15);
    expect(isWeakSecret(long('change_me'))).toBe(true);
    expect(isWeakSecret(long('change-me'))).toBe(true);
    expect(isWeakSecret(long('changeme'))).toBe(true);
    expect(isWeakSecret(long('change me'))).toBe(true);
    expect(isWeakSecret(long('CHANGE_ME'))).toBe(true);
    expect(isWeakSecret(long('Change-Me'))).toBe(true);
  });

  it('accepts a long, random-looking secret with no placeholder word', () => {
    expect(isWeakSecret('F7zTi33zD6arBAq7Z3vYUTtSy+uX5v9eINxzTDB8JbA=')).toBe(
      false,
    );
  });
});

describe('assertStrongSecret', () => {
  it('throws naming the variable, without ever including the secret value in the message', () => {
    let caught: unknown;
    try {
      assertStrongSecret('SOME_SECRET_NAME', 'short');
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain('SOME_SECRET_NAME');
    expect((caught as Error).message).not.toContain('short');
  });

  it('does not throw for a strong secret', () => {
    expect(() =>
      assertStrongSecret('SOME_SECRET_NAME', 'a'.repeat(40)),
    ).not.toThrow();
  });
});
