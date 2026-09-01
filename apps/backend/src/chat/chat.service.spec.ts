import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import type { PostgresService } from '../infrastructure/postgres.service';
import { ChatService, type ChatRoomRow } from './chat.service';

/**
 * PHASE 14G security regression testlari — PHASE 14F'da aniqlangan
 * MEDIUM topilma ("chat room authorization: partner/admin uchun
 * ownership/organization scoping yo'q") uchun.
 *
 * `chat_rooms`da tashkilot ustuni yo'qligi sababli qabul qilingan qaror:
 * faqat xona egasi ('user') va admin/SUPER_ADMIN operatorlar kira oladi;
 * 'partner' actorType HECH QANDAY xonaga (hatto o'ziniki bo'lmagan holda
 * ham — chunki xonalar partnerlarga umuman tegishli emas) kira olmaydi.
 */
describe('ChatService.assertRoomAccess — authorization boundary', () => {
  let service: ChatService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;

  const room: ChatRoomRow = {
    id: 'room-1',
    user_id: 'user-owner',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    pg = { query: jest.fn().mockResolvedValue([room]) };
    service = new ChatService(pg as unknown as PostgresService);
  });

  function actor(overrides: Partial<RequestActor>): RequestActor {
    return {
      id: 'actor-1',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
      ...overrides,
    };
  }

  it('USER: own room → PASS', async () => {
    const result = await service.assertRoomAccess(
      actor({ id: 'user-owner', actorType: 'user', role: Role.USER }),
      'room-1',
    );
    expect(result.id).toBe('room-1');
  });

  it("USER: other user's room → DENY", async () => {
    await expect(
      service.assertRoomAccess(
        actor({ id: 'someone-else', actorType: 'user', role: Role.USER }),
        'room-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('PARTNER: any room (including unrelated) → DENY (PHASE 14G fix — no organization scoping exists in schema)', async () => {
    await expect(
      service.assertRoomAccess(
        actor({
          id: 'partner-1',
          actorType: 'partner',
          role: Role.PARTNER,
          organizationId: 'org-1',
        }),
        'room-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ADMIN: any room → PASS (centralized support-inbox policy)', async () => {
    const result = await service.assertRoomAccess(
      actor({ id: 'admin-1', actorType: 'admin', role: Role.ADMIN }),
      'room-1',
    );
    expect(result.id).toBe('room-1');
  });

  it('SUPER_ADMIN role (any actorType) → PASS', async () => {
    const result = await service.assertRoomAccess(
      actor({ id: 'super-1', actorType: 'user', role: Role.SUPER_ADMIN }),
      'room-1',
    );
    expect(result.id).toBe('room-1');
  });

  it('nonexistent room → NotFoundException', async () => {
    pg.query.mockResolvedValueOnce([]);
    await expect(
      service.assertRoomAccess(
        actor({ id: 'admin-1', actorType: 'admin', role: Role.ADMIN }),
        'missing-room',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
