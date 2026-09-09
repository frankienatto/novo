import { describe, expect, it } from 'vitest';
import {
  cloneDevelopmentFixture,
  mayClientProvisionPrivilegedRecords,
  mayUseLegacyDemoLogin,
  resolveEmptyCollectionState,
} from './clientProvisioningPolicy.ts';

describe('client provisioning policy', () => {
  it('never permits privileged client-side provisioning', () => {
    expect(mayClientProvisionPrivilegedRecords()).toBe(false);
  });

  it('returns empty production state instead of a fixture', () => {
    const fixture = [{ id: 'S00', role: 'Super Administrador' }];

    expect(cloneDevelopmentFixture(fixture, false)).toEqual({});
    expect(resolveEmptyCollectionState(fixture, false, false)).toEqual([]);
    expect(resolveEmptyCollectionState({ id: 'main' }, true, false)).toEqual({});
    expect(mayUseLegacyDemoLogin(false)).toBe(false);
  });

  it('keeps development fixtures local and cloned, never as persistence intent', () => {
    const fixture = [{ id: 'S00' }];
    const localState = resolveEmptyCollectionState(fixture, false, true);

    expect(localState).toEqual(fixture);
    expect(localState).not.toBe(fixture);
    expect(mayUseLegacyDemoLogin(true)).toBe(true);
  });
});
