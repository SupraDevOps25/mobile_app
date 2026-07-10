// How a family's monthly subscription payment is divided, realized when the
// family pays at the end of each billing month:
//   • nurse pool     — 60% (split if a second nurse shares the rotation)
//   • coordinator fee —  8%
//   • Supracarer      — 32% (platform margin)
// Keep these as the single source of truth for the revenue split.
export const NURSE_POOL_FRACTION = 0.6;
export const COORDINATOR_FEE_FRACTION = 0.08;
export const SUPRACARER_FRACTION = 0.32;

/** The Care Coordinator's fee for one month of a plan priced at `priceGhs`. */
export function coordinatorFeeGhs(priceGhs: number): number {
  return Math.round(priceGhs * COORDINATOR_FEE_FRACTION);
}
