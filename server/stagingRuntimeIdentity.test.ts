import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(fileURLToPath(new URL('../server.ts', import.meta.url)), 'utf8');

describe('staging runtime identity', () => {
  it('uses Firebase Admin for server-side webhook persistence', () => {
    expect(serverSource).toContain("getAdminFirestore().collection('guests')");
    expect(serverSource).not.toContain('from "./services/firebase.ts"');
    expect(serverSource).not.toContain("from \"firebase/firestore\"");
  });

  it('does not auto-create a privileged Firebase Web user from server environment values', () => {
    expect(serverSource).not.toContain('createUserWithEmailAndPassword');
    expect(serverSource).not.toContain('signInWithEmailAndPassword');
  });
});
