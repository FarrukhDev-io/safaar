import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService ownership', () => {
  let service: NotificationsService;
  let pgMock: jest.Mocked<Pick<PostgresService, 'query'>>;
  const actor: RequestActor = {
    id: '00000000-0000-0000-0000-000000000001',
    actorType: 'partner',
    role: Role.PARTNER,
    roles: [Role.PARTNER],
    organizationId: '00000000-0000-0000-0000-000000000002',
    sessionId: 'test-session-id',
  };

  beforeEach(() => {
    pgMock = { query: jest.fn() };
    service = new NotificationsService(pgMock as unknown as PostgresService);
  });

  it('lists only notifications owned by the submitting partner user', async () => {
    pgMock.query.mockResolvedValueOnce([]);

    await service.list(actor);

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('owner_id = $1::uuid AND owner_type = $2'),
      [actor.id, 'partner'],
    );
  });

  it('allows a partner to read its own partner notification', async () => {
    const notification = {
      id: '00000000-0000-0000-0000-000000000003',
      owner_id: actor.id,
      owner_type: 'partner',
      read_at: null,
    };
    pgMock.query
      .mockResolvedValueOnce([notification])
      .mockResolvedValueOnce([
        { ...notification, read_at: '2026-07-18T15:45:00.000Z' },
      ]);

    await service.read(actor, notification.id);

    expect(pgMock.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE notifications SET read_at'),
      [expect.any(String), notification.id],
    );
  });

  it('rejects a notification with the same id owner but another owner type', async () => {
    pgMock.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-0000-0000-000000000003',
        owner_id: actor.id,
        owner_type: 'user',
      },
    ]);

    await expect(
      service.read(actor, '00000000-0000-0000-0000-000000000003'),
    ).rejects.toThrow('Bu resurs sizga tegishli emas');
  });
});
