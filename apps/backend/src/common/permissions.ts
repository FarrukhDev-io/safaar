import { Role } from '@safaar/types';
import type { RequestActor } from './actor';

export const Permission = {
  UsersRead: 'users:read',
  UsersWrite: 'users:write',
  PartnersRead: 'partners:read',
  PartnersWrite: 'partners:write',
  BookingsRead: 'bookings:read',
  BookingsWrite: 'bookings:write',
  FinanceRead: 'finance:read',
  FinanceWrite: 'finance:write',
  CmsRead: 'cms:read',
  CmsWrite: 'cms:write',
  SupportRead: 'support:read',
  SupportWrite: 'support:write',
  SettingsWrite: 'settings:write',
  AdminUsersWrite: 'admin-users:write',
  AuditLogsRead: 'audit-logs:read',
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

const adminPermissions: PermissionValue[] = [
  Permission.UsersRead,
  Permission.PartnersRead,
  Permission.BookingsRead,
  Permission.FinanceRead,
  Permission.CmsRead,
  Permission.SupportRead,
  Permission.AuditLogsRead,
];

const rolePermissions: Record<Role, PermissionValue[]> = {
  [Role.USER]: [],
  [Role.PARTNER]: [
    Permission.BookingsRead,
    Permission.BookingsWrite,
    Permission.FinanceRead,
  ],
  [Role.ADMIN]: adminPermissions,
  [Role.FINANCE_ADMIN]: [
    Permission.FinanceRead,
    Permission.FinanceWrite,
    Permission.BookingsRead,
  ],
  [Role.CONTENT_ADMIN]: [Permission.CmsRead, Permission.CmsWrite],
  [Role.SUPPORT_ADMIN]: [
    Permission.SupportRead,
    Permission.SupportWrite,
    Permission.UsersRead,
    Permission.BookingsRead,
  ],
  [Role.MODERATOR]: [
    Permission.UsersRead,
    Permission.PartnersRead,
    Permission.PartnersWrite,
    Permission.BookingsRead,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};

export function actorHasPermissions(
  actor: RequestActor,
  requiredPermissions: string[],
): boolean {
  if (!requiredPermissions.length || actor.role === Role.SUPER_ADMIN) {
    return true;
  }

  const granted = new Set<PermissionValue>();
  for (const role of actor.roles.length ? actor.roles : [actor.role]) {
    for (const permission of rolePermissions[role] ?? []) {
      granted.add(permission);
    }
  }

  return requiredPermissions.every((permission) =>
    granted.has(permission as PermissionValue),
  );
}
