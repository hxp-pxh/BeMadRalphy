import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class CostTracker {
  private totalUsd = 0;

  addCost(amountUsd: number): void {
    this.totalUsd += amountUsd;
  }

  getTotal(): number {
    return this.totalUsd;
  }

  async persist(projectRoot: string): Promise<void> {
    const dir = path.join(projectRoot, '.bemadralphy');
    await mkdir(dir, { recursive: true });
    const costPath = path.join(dir, 'cost.log');
    await writeFile(costPath, `${this.totalUsd}\n`, 'utf-8');
  }
}
