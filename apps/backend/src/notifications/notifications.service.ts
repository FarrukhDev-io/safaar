import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@safaar/types';
import { randomUUID } from 'node:crypto';
import type { RequestActor } from '../common/actor';
import {
  limitOffsetSql,
  parsePagination,
  type QueryLike,
} from '../common/pagination';
import { PostgresService } from '../infrastructure/postgres.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly pg: PostgresService) {}

  async list(actor: RequestActor | undefined, query: QueryLike = {}) {
    const currentActor = this.requireActor(actor);
    const ownerType = this.ownerType(currentActor);
    const pagination = parsePagination(query, 'public', {
      defaultLimit: 20,
      allowedSortBy: ['created_at'],
    });

    const [items, unreadRows] = await Promise.all([
      this.pg.query(
        `SELECT * FROM notifications
         WHERE owner_id = $1::uuid AND owner_type = $2
         ORDER BY created_at DESC
         ${limitOffsetSql(pagination)}`,
        [currentActor.id, ownerType],
      ),
      this.pg.query<{ count: string }>(
        `SELECT count(*)::text as count FROM notifications
         WHERE owner_id = $1::uuid AND owner_type = $2 AND read_at IS NULL`,
        [currentActor.id, ownerType],
      ),
    ]);

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      unread_count: Number(unreadRows[0]?.count ?? 0),
    };
  }

  async read(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);

    const [notification] = await this.pg.query(
      'SELECT * FROM notifications WHERE id = $1',
      [id],
    );

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Xabarnoma topilmadi',
      });
    }

    this.assertOwner(
      currentActor,
      notification.owner_id,
      notification.owner_type,
    );

    const now = new Date().toISOString();
    const [updated] = await this.pg.query(
      'UPDATE notifications SET read_at = $1 WHERE id = $2 RETURNING *',
      [now, id],
    );

    return updated;
  }

  async readAll(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor);
    const ownerType = this.ownerType(currentActor);

    const now = new Date().toISOString();
    await this.pg.query(
      `UPDATE notifications SET read_at = $1
       WHERE owner_id = $2::uuid AND owner_type = $3 AND read_at IS NULL`,
      [now, currentActor.id, ownerType],
    );

    return { owner_id: currentActor.id, read_all: true };
  }

  async pushToken(
    actor: RequestActor | undefined,
    body: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor);
    const now = new Date().toISOString();
    const tokenId = randomUUID();
    const [token] = await this.pg.query(
      `INSERT INTO push_tokens (id, owner_id, owner_type, token, platform, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tokenId,
        currentActor.id,
        this.ownerType(currentActor),
        String(body.token ?? ''),
        String(body.platform ?? 'web'),
        now,
      ],
    );
    return token;
  }

  async deletePushToken(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);
    const [token] = await this.pg.query(
      `UPDATE push_tokens
       SET deleted_at = $1
       WHERE id = $2 AND owner_id = $3 AND owner_type = $4 AND deleted_at IS NULL
       RETURNING *`,
      [
        new Date().toISOString(),
        id,
        currentActor.id,
        this.ownerType(currentActor),
      ],
    );
    if (!token) {
      throw new NotFoundException({
        code: 'PUSH_TOKEN_NOT_FOUND',
        message: 'Push token topilmadi',
      });
    }

    return { id, deleted: true };
  }

  private assertOwner(
    actor: RequestActor,
    ownerId: unknown,
    ownerType: unknown,
  ) {
    if (
      actor.role === Role.SUPER_ADMIN ||
      actor.actorType === 'admin' ||
      (ownerId === actor.id && ownerType === this.ownerType(actor))
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'RESOURCE_FORBIDDEN',
      message: 'Bu resurs sizga tegishli emas',
    });
  }

  private ownerType(actor: RequestActor): string {
    return actor.actorType === 'partner' ? 'partner' : actor.actorType;
  }

  private requireActor(actor: RequestActor | undefined): RequestActor {
    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }
}
