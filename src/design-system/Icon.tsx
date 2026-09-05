/**
 * Canonical icon primitive for NEW modules (auth/admin UI and beyond).
 * `App.tsx` keeps its own local `Icon` function for its existing screens —
 * consolidating the two is a documented Phase-2 cleanup (see
 * docs/architecture/OVERVIEW.md), not done here to avoid a large,
 * risk-for-no-benefit diff across App.tsx's ~100+ existing call sites.
 *
 * Start minimal: add paths here as new modules need them, keyed by name.
 */
const PATHS: Record<string, string> = {
  users: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z",
  shield: "M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4Z",
  key: "M14 2a6 6 0 0 0-5.9 7.1L2 15.2V20h4.8l1-1v-1.8h1.8l1.4-1.4a6 6 0 1 0 2.9-11.8Zm2 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z",
  close: "M6 6l12 12M18 6L6 18",
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
