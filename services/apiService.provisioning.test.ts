import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const apiServiceSource = readFileSync(
  fileURLToPath(new URL('./apiService.ts', import.meta.url)),
  'utf8',
);

describe('apiService privileged provisioning boundary', () => {
  it('does not auto-seed Firestore collections during client initialization', () => {
    expect(apiServiceSource).not.toContain('Firebase Seed: Populando');
    expect(apiServiceSource).not.toContain('Auto-seeding');
    expect(apiServiceSource).not.toContain('saveToFirestore(c.path, id, item)');
  });

  it('never writes legacy privileged demo staff records from the browser', () => {
    expect(apiServiceSource).not.toContain("saveToFirestore('staff', adminUser.id, adminUser)");
    expect(apiServiceSource).not.toContain("saveToFirestore('staff', saasAdmin.id, saasAdmin)");
    expect(apiServiceSource).not.toContain("saveToFirestore('integrationSettings', 'INT02', alohaItem)");
  });

  it('keeps reset fixtures local in development and disables the reset path in production', () => {
    expect(apiServiceSource).toContain("throw new Error('CLIENT_PROVISIONING_DISABLED')");
    expect(apiServiceSource).not.toContain("setDoc(doc(firestore, collectionPath, 'main'), defaultData)");
    expect(apiServiceSource).not.toContain('deleteDoc(doc(firestore, collectionPath, item.id))');
  });
});
