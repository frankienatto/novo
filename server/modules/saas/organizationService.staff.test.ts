import { beforeEach, describe, expect, it, vi } from 'vitest';
const repository = vi.hoisted(() => ({ getUserById: vi.fn(), getPropertyById: vi.fn(), saveUser: vi.fn() }));
vi.mock('./organizationRepository', () => ({ organizationRepository: repository }));
import { organizationService } from './organizationService.ts';

const target = { userId: 'target', organizationId: 'org-a', propertyIds: ['prop-a'], name: 'Target', email: 'target@test', role: 'receptionist', permissions: ['view_pos'], status: 'active', createdAt: '', updatedAt: '' } as any;
const actor = { userId: 'actor', organizationId: 'org-a', propertyIds: ['prop-a'], name: 'Actor', email: 'actor@test', role: 'manager', permissions: ['manage_staff', 'view_staff'], status: 'active', createdAt: '', updatedAt: '' } as any;
beforeEach(() => { vi.clearAllMocks(); repository.getUserById.mockResolvedValue(target); repository.getPropertyById.mockResolvedValue({ propertyId: 'prop-a', organizationId: 'org-a' }); repository.saveUser.mockImplementation(async (value: any) => value); });
describe('canonical staff anti-escalation', () => {
  it('rejects self promotion', async () => await expect(organizationService.updateOperationalUser({ ...actor, userId: 'target' }, 'target', 'org-a', { role: 'admin' }, true)).rejects.toThrow('SELF_PERMISSION_ESCALATION_DENIED'));
  it('rejects granting a permission actor lacks', async () => await expect(organizationService.updateOperationalUser(actor, 'target', 'org-a', { permissions: ['manage_staff_permissions'] as any }, true)).rejects.toThrow('CANNOT_GRANT_UNHELD_PERMISSION'));
  it('rejects foreign property access', async () => { repository.getPropertyById.mockResolvedValue({ propertyId: 'foreign', organizationId: 'org-b' }); await expect(organizationService.updateOperationalUser({ ...actor, role: 'owner', permissions: ['manage_staff', 'manage_staff_permissions'] }, 'target', 'org-a', { propertyIds: ['foreign'] }, true)).rejects.toThrow('FOREIGN_PROPERTY_DENIED'); });
});
