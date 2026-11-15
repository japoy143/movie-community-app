// Minimal structured logger. One JSON line per event on the server, so logs
// stay greppable locally and parseable by hosting platforms.

type Level = "debug" | "info" | "warn" | "error";
type Context = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    // Drizzle's DrizzleQueryError message embeds the SQL *parameters*
    // (comment bodies, visitor ids, session tokens). Log the driver's cause
    // and Postgres error code instead.
    if ("params" in error && "query" in error) {
      const cause = error.cause as { message?: string; code?: string } | undefined;
      return {
        name: "DrizzleQueryError",
        message: cause?.message ?? "query failed",
        code: cause?.code,
        stack: error.stack?.split("\n").slice(1).join("\n"),
      };
    }
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

// Wall-clock time without `new Date()` / `Date.now()`: with cacheComponents,
// Next.js rejects those during prerendering (logs can fire while a page
// prerenders). `performance` is the telemetry API Next.js recommends.
function timestamp(): string {
  return new Date(performance.timeOrigin + performance.now()).toISOString();
}

function write(level: Level, scope: string, message: string, context?: Context) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const { error, ...rest } = context ?? {};
  const entry = {
    time: timestamp(),
    level,
    scope,
    message,
    ...rest,
    ...(error !== undefined && { error: serializeError(error) }),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: Context) =>
      write("debug", scope, message, context),
    info: (message: string, context?: Context) =>
      write("info", scope, message, context),
    warn: (message: string, context?: Context) =>
      write("warn", scope, message, context),
    error: (message: string, context?: Context) =>
      write("error", scope, message, context),
  };
}
