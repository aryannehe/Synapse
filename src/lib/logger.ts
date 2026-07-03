/**
 * Lightweight structured logging utility.
 * Writes JSON-formatted logs to standard output/error streams for tracing.
 */
type LogMeta = Record<string, unknown>;

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },

  warn: (message: string, meta?: LogMeta) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },

  error: (message: string, error?: unknown, meta?: LogMeta) => {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
        ...meta,
      })
    );
  },
};
