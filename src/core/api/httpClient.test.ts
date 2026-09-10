import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('httpClient Firebase bearer contract', () => {
  it('obtém o token atual do Firebase e não torna localStorage autoridade', () => {
    const source = fs.readFileSync(path.resolve('src/core/api/httpClient.ts'), 'utf8');
    expect(source).toContain('auth.currentUser?.getIdToken()');
    expect(source).toContain("headers.Authorization = `Bearer ${firebaseToken}`");
    expect(source).not.toContain("session.token.startsWith('ey')");
  });
});
