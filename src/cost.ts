import { logInfo } from './utils/logging.js';

export class CostTracker {
  private totalUsd = 0;

  addCost(amountUsd: number): void {
    this.totalUsd += amountUsd;
  }

  getTotal(): number {
    return this.totalUsd;
  }

  async persist(): Promise<void> {
    logInfo('cost persist not implemented yet');
  }
}
