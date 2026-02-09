export class BeMadRalphyError extends Error {
  override name = 'BeMadRalphyError';
}

export class PlanningError extends BeMadRalphyError {
  override name = 'PlanningError';
}

export class BeadsError extends BeMadRalphyError {
  override name = 'BeadsError';
}

export class EngineError extends BeMadRalphyError {
  override name = 'EngineError';
}
