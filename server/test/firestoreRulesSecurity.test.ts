import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

describe('Firestore staff privilege-escalation guard', () => {
  const staffBlock = rules.match(/match \/staff\/\{staffId\} \{([\s\S]*?)\n    \}/)?.[1] || '';

  it('prevents a user from creating their own staff record in another organization', () => {
    expect(staffBlock).toContain('isTenantAdmin()');
    expect(staffBlock).toContain('staffId != request.auth.uid');
    expect(staffBlock).toContain('isAllowedTenantCreate()');
  });

  it('prevents a staff member from assigning themselves a privileged role or arbitrary permissions', () => {
    expect(staffBlock).toContain('isSafeSelfStaffProfileUpdate()');
    expect(rules).toContain("hasOnly(['name', 'email', 'phone', 'avatarUrl', 'photoURL', 'updatedAt'])");
  });

  it('keeps legitimate same-tenant administration available to an existing administrator', () => {
    expect(rules).toContain("staffDoc().role in ['Admin', 'Super Administrador', 'owner']");
    expect(staffBlock).toContain('isTenantAdmin() && isStaffOfTenant(resource.data) && isTenantMatch()');
  });
});
