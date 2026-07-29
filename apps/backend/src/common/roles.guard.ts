import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@safaar/types';
import { PostgresService } from '../infrastructure/postgres.service';
import { authSessionStore } from '../auth/session-store';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { actorHasPermissions } from './permissions';
import { ROLES_KEY } from './roles.decorator';
import {
  buildActorFromHeaders,
  type RequestActor,
  type RequestWithActor,
} from './actor';

/**
 * Rol asosidagi himoya (RBAC).
 *
 * Rol va permission asosidagi himoya (RBAC).
 * Real JWT access token asosiy manba.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly pg: PostgresService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const user = request.user ?? buildActorFromHeaders(request.headers);

    if (user) {
      request.user = user;
    }

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }

    await this.assertSessionActive(user);
    await this.assertActorAllowed(user);

    if (requiredRoles?.length && !hasRole(user, requiredRoles)) {
      throw new ForbiddenException('Bu amal uchun ruxsatingiz yoq.');
    }

    if (
      requiredPermissions?.length &&
      !actorHasPermissions(user, requiredPermissions)
    ) {
      throw new ForbiddenException({
        code: 'AUTH_PERMISSION_DENIED',
        message: 'Bu amal uchun permission yetarli emas.',
      });
    }

    return true;
  }

  private async assertSessionActive(actor: RequestActor) {
    if (!actor.sessionId) {
      return;
    }

    if (!(await authSessionStore.isActive(actor.sessionId))) {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_REVOKED',
        message: 'Sessiya bekor qilingan yoki muddati tugagan',
      });
    }
  }

  private async assertActorAllowed(actor: RequestActor): Promise<void> {
    if (actor.actorType === 'user') {
      const rows = await this.pg.query<{ status: string }>(
        `SELECT status FROM users WHERE id = $1 LIMIT 1`,
        [actor.id],
      );

      if (rows.length > 0 && ['blocked', 'deleted'].includes(rows[0].status)) {
        throw new ForbiddenException({
          code: 'USER_BLOCKED',
          message: 'Foydalanuvchi bloklangan',
        });
      }
    }

    if (actor.actorType === 'partner') {
      const rows = await this.pg.query<{ status: string }>(
        `SELECT status FROM partner_organizations WHERE id = $1 LIMIT 1`,
        [actor.organizationId],
      );

      if (rows.length > 0 && rows[0].status !== 'approved') {
        throw new ForbiddenException({
          code: 'PARTNER_NOT_ACTIVE',
          message: 'Hamkor tashkilot faol emas',
        });
      }
    }
  }
}

function hasRole(actor: RequestActor, requiredRoles: Role[]): boolean {
  if (actor.role === Role.SUPER_ADMIN) {
    return true;
  }

  if (requiredRoles.includes(actor.role)) {
    return true;
  }

  const adminLikeRoles = [
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.CONTENT_ADMIN,
    Role.SUPPORT_ADMIN,
    Role.MODERATOR,
  ];

  if (
    adminLikeRoles.includes(actor.role) &&
    requiredRoles.includes(Role.ADMIN)
  ) {
    return true;
  }

  return actor.roles.some((role) => requiredRoles.includes(role));
}
