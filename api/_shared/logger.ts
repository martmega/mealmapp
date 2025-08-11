export type LogData = Record<string, unknown>;

export function logInfo(message: string, data: LogData = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...data }));
}

export function logError(message: string, data: LogData = {}) {
  console.error(JSON.stringify({ level: 'error', message, ...data }));
}
