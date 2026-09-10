import { describe, expect, it } from 'vitest';
import { canMutateCalendarFromBrowser } from './calendarRuntimePolicy.ts';

describe('Calendar live mutation policy', () => {
  it('disables browser drag, resize and selection in staging/production', () => {
    expect(canMutateCalendarFromBrowser(true)).toBe(false);
  });

  it('preserves fixture interaction only in the explicit demo runtime', () => {
    expect(canMutateCalendarFromBrowser(false)).toBe(true);
  });
});
