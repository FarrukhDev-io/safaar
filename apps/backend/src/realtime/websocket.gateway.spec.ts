import { Role } from '@safaar/types';
import type { PostgresService } from '../infrastructure/postgres.service';
import { RealtimeGateway } from './websocket.gateway';

type RoomGuard = {
  canJoinRoom(client: unknown, room: string): Promise<boolean>;
};

describe('RealtimeGateway room authorization', () => {
  const pg = {
    query: jest.fn(),
  };

  beforeEach(() => {
    pg.query.mockReset();
  });

  it('blocks a normal user from manually joining admin rooms', async () => {
    const gateway = new RealtimeGateway(pg as unknown as PostgresService);
    const guard = gateway as unknown as RoomGuard;

    await expect(
      guard.canJoinRoom(
        { userId: 'user-1', role: Role.USER, actorType: 'user' },
        'admin:all',
      ),
    ).resolves.toBe(false);
  });

  it('allows users to join only their own user room', async () => {
    const gateway = new RealtimeGateway(pg as unknown as PostgresService);
    const guard = gateway as unknown as RoomGuard;
    const client = { userId: 'user-1', role: Role.USER, actorType: 'user' };

    await expect(guard.canJoinRoom(client, 'user:user-1')).resolves.toBe(true);
    await expect(guard.canJoinRoom(client, 'user:user-2')).resolves.toBe(false);
  });

  it('checks support ticket ownership before joining support rooms', async () => {
    const gateway = new RealtimeGateway(pg as unknown as PostgresService);
    const guard = gateway as unknown as RoomGuard;
    const client = {
      userId: '00000000-0000-2001-0000-000000000001',
      role: Role.USER,
      actorType: 'user',
    };

    pg.query.mockResolvedValueOnce([
      {
        user_id: '00000000-0000-2001-0000-000000000001',
        actor_type: 'user',
        actor_id: '00000000-0000-2001-0000-000000000001',
      },
    ]);

    await expect(
      guard.canJoinRoom(client, 'support:00000000-0000-4001-8000-000000000001'),
    ).resolves.toBe(true);
  });
});
