/** A browser cannot alter stays in live runtimes until it has a canonical,
 * lock-aware reservation mutation boundary. */
export const canMutateCalendarFromBrowser = (isLiveRuntime: boolean) => !isLiveRuntime;
