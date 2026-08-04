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

type HttpRequestWithActor = RequestWithActor & {
  method?: string;
  originalUrl?: string;
  url?: string;
};

const LIMITED_PARTNER_STATUSES = new Set(['blocked', 'suspended']);

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

    const request = context.switchToHttp().getRequest<HttpRequestWithActor>();
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
    await this.assertActorAllowed(user, request);

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

  private async assertActorAllowed(
    actor: RequestActor,
    request: HttpRequestWithActor,
  ): Promise<void> {
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
      if (!actor.organizationId) {
        throw new ForbiddenException({
          code: 'PARTNER_ORGANIZATION_REQUIRED',
          message: 'Partner tashkiloti aniqlanmadi',
        });
      }

      const rows = await this.pg.query<{ status: string }>(
        `SELECT status FROM partner_organizations WHERE id = $1 LIMIT 1`,
        [actor.organizationId],
      );

      const status = rows[0]?.status;
      if (!status || status === 'approved') {
        return;
      }

      if (
        LIMITED_PARTNER_STATUSES.has(status) &&
        this.isLimitedPartnerRouteAllowed(request)
      ) {
        return;
      }

      if (status === 'blocked') {
        throw new ForbiddenException({
          code: 'PARTNER_BLOCKED',
          message:
            'Hamkor access bloklangan. Faqat profil va yordam chatidan foydalanish mumkin.',
        });
      }

      if (status === 'suspended') {
        throw new ForbiddenException({
          code: 'PARTNER_SUSPENDED',
          message:
            "Hamkor access vaqtincha to'xtatilgan. Faqat profil va yordam chatidan foydalanish mumkin.",
        });
      }

      throw new ForbiddenException({
        code: 'PARTNER_NOT_ACTIVE',
        message: 'Hamkor tashkilot faol emas',
      });
    }
  }

  private isLimitedPartnerRouteAllowed(request: HttpRequestWithActor): boolean {
    const rawPath = String(request.originalUrl ?? request.url ?? '');
    const path = rawPath
      .split('?')[0]
      .replace(/^\/api\/backend/i, '')
      .replace(/^\/v\d+(?=\/)/i, '');

    return (
      path === '/partners/profile' ||
      path === '/partner/profile' ||
      path === '/partners/application/status' ||
      path === '/partner/application/status' ||
      path.startsWith('/support/tickets') ||
      path === '/auth/logout' ||
      path === '/auth/partner/logout' ||
      path === '/auth/sessions'
    );
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
