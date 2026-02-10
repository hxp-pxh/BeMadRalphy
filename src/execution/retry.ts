export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  classifyError?: (error: Error) => 'retryable' | 'fatal';
};

const DEFAULT_RETRYABLE_PATTERNS = [
  'rate limit',
  'timeout',
  'timed out',
  'econnreset',
  'network',
  'temporarily unavailable',
  'quota',
];

const DEFAULT_FATAL_PATTERNS = ['unauthorized', 'authentication', 'invalid api key', 'not found'];

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 60_000;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      const classification = options.classifyError?.(err) ?? classifyError(err);
      if (classification === 'fatal') {
        throw err;
      }
      attempt += 1;
      if (attempt > maxRetries) {
        throw err;
      }
      const delay = computeDelay(baseDelayMs, maxDelayMs, attempt);
      await sleep(delay);
    }
  }
}

function classifyError(error: Error): 'retryable' | 'fatal' {
  const message = error.message.toLowerCase();
  if (DEFAULT_FATAL_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'fatal';
  }
  if (DEFAULT_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'retryable';
  }
  return 'fatal';
}

function computeDelay(baseDelayMs: number, maxDelayMs: number, attempt: number): number {
  const raw = baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(raw, maxDelayMs);
  const jitter = capped * (Math.random() * 0.25);
  return Math.floor(capped + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
