/**
 * Structured Logger for Skynet Platform
 *
 * Replaces raw console.log/warn/error calls with a structured, level-aware
 * logger. Zero external dependencies — uses JSON output in production and
 * human-readable output in development.
 *
 * Log levels (lowest → highest): debug, info, warn, error
 * Set LOG_LEVEL env var to control minimum output level (default: "info").
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LEVEL_ORDER) return env as LogLevel;
  return "info";
}

const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

interface LogEntry {
  level: LogLevel;
  module: string;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function formatDev(entry: LogEntry): string {
  const { level, module, msg, ts, ...extra } = entry;
  const tag = `[${module}]`;
  const extraStr = Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : "";
  return `${ts} ${level.toUpperCase().padEnd(5)} ${tag} ${msg}${extraStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getMinLevel()];
}

function write(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  if (isDev) {
    const formatted = formatDev(entry);
    if (entry.level === "error") {
      process.stderr.write(formatted + "\n");
    } else if (entry.level === "warn") {
      process.stderr.write(formatted + "\n");
    } else {
      process.stdout.write(formatted + "\n");
    }
  } else {
    // Production: structured JSON to stdout/stderr
    const output = JSON.stringify(entry);
    if (entry.level === "error" || entry.level === "warn") {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  }
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      stack: isDev ? err.stack : undefined,
    };
  }
  return { errorMessage: String(err) };
}

export interface Logger {
  debug(msg: string, extra?: Record<string, unknown>): void;
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, err?: unknown, extra?: Record<string, unknown>): void;
  child(module: string): Logger;
}

function createLoggerForModule(module: string): Logger {
  const log = (level: LogLevel, msg: string, extra?: Record<string, unknown>): void => {
    write({
      level,
      module,
      msg,
      ts: new Date().toISOString(),
      ...extra,
    });
  };

  return {
    debug(msg, extra?) {
      log("debug", msg, extra);
    },
    info(msg, extra?) {
      log("info", msg, extra);
    },
    warn(msg, extra?) {
      log("warn", msg, extra);
    },
    error(msg, err?, extra?) {
      const errorData = err ? serializeError(err) : {};
      log("error", msg, { ...errorData, ...extra });
    },
    child(childModule: string) {
      return createLoggerForModule(`${module}:${childModule}`);
    },
  };
}

/**
 * Create a logger instance for a specific module.
 *
 * @example
 * const log = createLogger("OAuth");
 * log.info("Initialized", { baseURL: url });
 * log.warn("Missing session cookie");
 * log.error("Callback failed", err);
 */
export function createLogger(module: string): Logger {
  return createLoggerForModule(module);
}
