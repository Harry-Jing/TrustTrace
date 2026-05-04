import type {
  CheckPhaseDto,
  CheckProgressDto,
  CheckStatusDto,
  DiscoveryStrategyDto,
} from "@trusttrace/contracts/checks";

// Re-export the wire DTO types under their view-side names so the contract
// schema stays the single source of truth — adding a status / phase /
// strategy on the backend lights up TS errors at every consumer here.
export type DiscoveryStrategy = DiscoveryStrategyDto;
export type CheckStatus = CheckStatusDto;
export type CheckPhase = CheckPhaseDto;
export type CheckProgress = CheckProgressDto;

// `ActiveCheckPhase` is the view-side narrowing of `CheckPhase` that excludes
// the terminal phases — it matches the phases the loading-page stepper can
// surface as "currently happening", not the states reached after the run is
// over. Derived from the contract enum so a new active phase added to the
// backend automatically widens the union.
export type ActiveCheckPhase = Exclude<CheckPhaseDto, "completed" | "failed">;
