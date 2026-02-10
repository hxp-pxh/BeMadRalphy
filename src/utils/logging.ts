export type OutputFormat = 'text' | 'json';

type LoggerContext = {
  outputFormat: OutputFormat;
  runId?: string;
};

type LogEvent = {
  ts: string;
  level: 'info' | 'error';
  event: string;
  message: string;
  runId?: string;
  data?: Record<string, unknown>;
};

const context: LoggerContext = {
  outputFormat: 'text',
};

export function configureLogger(options: Partial<LoggerContext>): void {
  context.outputFormat = options.outputFormat ?? context.outputFormat;
  context.runId = options.runId ?? context.runId;
}

export function logInfo(message: string, data?: Record<string, unknown>): void {
  emit({
    ts: new Date().toISOString(),
    level: 'info',
    event: 'log',
    message,
    runId: context.runId,
    data,
  });
}

export function logError(message: string, data?: Record<string, unknown>): void {
  emit({
    ts: new Date().toISOString(),
    level: 'error',
    event: 'log',
    message,
    runId: context.runId,
    data,
  });
}

export function logProgress(
  stage: 'run' | 'phase' | 'task',
  status: 'start' | 'progress' | 'done' | 'failed',
  message: string,
  data?: Record<string, unknown>,
): void {
  emit({
    ts: new Date().toISOString(),
    level: status === 'failed' ? 'error' : 'info',
    event: `${stage}.${status}`,
    message,
    runId: context.runId,
    data,
  });
}

export function logSummary(summary: Record<string, unknown>): void {
  if (context.outputFormat === 'json') {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'summary',
        runId: context.runId,
        ...summary,
      }),
    );
    return;
  }
  logInfo(`summary: ${JSON.stringify(summary)}`);
}

function emit(event: LogEvent): void {
  if (context.outputFormat === 'json') {
    console.log(JSON.stringify(event));
    return;
  }
  const level = event.level === 'error' ? 'ERROR' : 'INFO';
  console.log(`[bemadralphy] [${level}] ${event.message}`);
}
