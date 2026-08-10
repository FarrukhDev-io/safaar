import { AuthSessionStore } from './session-store';

describe('AuthSessionStore.isActive', () => {
  it('checks active sessions with a lightweight existence query', async () => {
    const store = new AuthSessionStore();
    const query = jest
      .spyOn(
        store as unknown as {
          query: (
            sql: string,
            params: unknown[],
          ) => Promise<Array<{ active: number }>>;
        },
        'query',
      )
      .mockResolvedValue([{ active: 1 }]);
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456789);

    await expect(store.isActive('session-1')).resolves.toBe(true);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT 1 AS active'),
      ['session-1', 123456789],
    );
    expect(query.mock.calls[0]?.[0]).not.toContain('SELECT *');
    nowSpy.mockRestore();
  });

  it('returns false without querying when session id is missing', async () => {
    const store = new AuthSessionStore();
    const query = jest.spyOn(
      store as unknown as {
        query: (sql: string, params: unknown[]) => Promise<unknown[]>;
      },
      'query',
    );

    await expect(store.isActive(undefined)).resolves.toBe(false);

    expect(query).not.toHaveBeenCalled();
  });
});
