import { describe, expect, it } from 'vitest';
import { executiveApi } from './executiveApi';

describe('executiveApi tenant authority', () => {
  it('não serializa orgId/propertyId em rotas Executive ou Copilot', () => {
    const source = Object.values(executiveApi).map(fn => fn.toString()).join('\n');
    expect(source).not.toMatch(/orgId=.*propertyId=|propertyId=.*orgId=/);
  });
});
