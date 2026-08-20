import {
  canAccessAudit,
  canDeleteIdeas,
  canEditGenealogy,
  canManageUsers,
  canSendAdminDigest,
  canSendInvitations,
} from './roles';

describe('canEditGenealogy', () => {
  it('allows moderator and admin', () => {
    expect(canEditGenealogy('moderator')).toBe(true);
    expect(canEditGenealogy('admin')).toBe(true);
  });

  it('denies user and missing role', () => {
    expect(canEditGenealogy('user')).toBe(false);
    expect(canEditGenealogy(undefined)).toBe(false);
  });
});

describe('other role helpers', () => {
  it('scopes admin-only actions', () => {
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('moderator')).toBe(false);
    expect(canSendAdminDigest('admin')).toBe(true);
    expect(canSendAdminDigest('moderator')).toBe(false);
    expect(canAccessAudit('admin')).toBe(true);
    expect(canDeleteIdeas('admin')).toBe(true);
    expect(canDeleteIdeas('moderator')).toBe(false);
  });

  it('allows invitations for moderator and admin', () => {
    expect(canSendInvitations('moderator')).toBe(true);
    expect(canSendInvitations('user')).toBe(false);
  });
});
