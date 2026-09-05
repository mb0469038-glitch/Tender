/**
 * Thin re-export of the existing formatting helpers so new modules import from
 * `shared/kernel` rather than reaching into `domain/calculations.ts` directly.
 * The originals stay put — see docs/architecture/OVERVIEW.md for why.
 */
export { number, money } from "../../domain/calculations";
