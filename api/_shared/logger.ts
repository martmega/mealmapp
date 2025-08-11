export interface LogEntry {
  level?: 'info' | 'error';
  message: string;
  userId?: string;
  recipeId?: string;
  durationMs?: number;
  error?: string;
  [key: string]: any;
}

export function log(entry: LogEntry) {
  const { level = 'info', ...rest } = entry;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    ...rest,
  };
  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
  } else {
    console.log(serialized);
  }
}
