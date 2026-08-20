import { Role } from '@safaar/types';
import type { RequestActor } from './actor';
import { Permission, actorHasPermissions } from './permissions';

function admin(role: Role): RequestActor {
  return {
    id: 'admin-1',
    actorType: 'admin',
    role,
    roles: [role],
  };
}

describe('actorHasPermissions (admin RBAC matrix)', () => {
  it('denies CONTENT_ADMIN access to finance (regression: admin-like role collapse bypassed @Permissions)', () => {
    expect(
      actorHasPermissions(admin(Role.CONTENT_ADMIN), [Permission.FinanceRead]),
    ).toBe(false);
  });

  it('allows CONTENT_ADMIN access to CMS', () => {
    expect(
      actorHasPermissions(admin(Role.CONTENT_ADMIN), [Permission.CmsWrite]),
    ).toBe(true);
  });

  it('allows FINANCE_ADMIN access to finance', () => {
    expect(
      actorHasPermissions(admin(Role.FINANCE_ADMIN), [Permission.FinanceRead]),
    ).toBe(true);
    expect(
      actorHasPermissions(admin(Role.FINANCE_ADMIN), [Permission.FinanceWrite]),
    ).toBe(true);
  });

  it('denies MODERATOR access to finance', () => {
    expect(
      actorHasPermissions(admin(Role.MODERATOR), [Permission.FinanceRead]),
    ).toBe(false);
  });

  it('denies SUPPORT_ADMIN access to finance', () => {
    expect(
      actorHasPermissions(admin(Role.SUPPORT_ADMIN), [Permission.FinanceRead]),
    ).toBe(false);
  });

  it('denies plain ADMIN access to audit logs and finance writes (read-only admin tier)', () => {
    expect(
      actorHasPermissions(admin(Role.ADMIN), [Permission.FinanceWrite]),
    ).toBe(false);
    expect(
      actorHasPermissions(admin(Role.ADMIN), [Permission.AuditLogsRead]),
    ).toBe(true);
  });

  it('SUPER_ADMIN bypasses every permission check', () => {
    for (const permission of Object.values(Permission)) {
      expect(actorHasPermissions(admin(Role.SUPER_ADMIN), [permission])).toBe(
        true,
      );
    }
  });
});
