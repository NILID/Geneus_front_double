export type UserRole = 'user' | 'moderator' | 'admin';

export function parseUserRole(raw: unknown): UserRole {
  if (raw === 'admin' || raw === 'moderator' || raw === 'user') {
    return raw;
  }
  return 'user';
}

/** Редактирование персон, древа, медиа, фактов */
export function canEditGenealogy(role: UserRole | undefined): boolean {
  return role === 'moderator' || role === 'admin';
}

export function canAccessAudit(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === 'admin';
}
