import type { CallContext, Middleware } from './registry.js';
import type { CallMeta } from './tool.js';

export class ScopeError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly missing: string[],
  ) {
    super(`Tool "${toolName}" requires scope(s): ${missing.join(', ')}`);
    this.name = 'ScopeError';
  }
}

/**
 * Enforces a tool's declared `scopes` against the scopes the caller grants.
 * Pairs naturally with an agent passport (see agent-passport). `"*"` grants all.
 */
export function requireScopes(getGranted: (meta: CallMeta) => string[]): Middleware {
  return async (ctx, next) => {
    const required = ctx.tool.scopes ?? [];
    if (required.length === 0) return next();
    const granted = getGranted(ctx.meta) ?? [];
    if (granted.includes('*')) return next();
    const missing = required.filter((s) => !granted.includes(s));
    if (missing.length) throw new ScopeError(ctx.name, missing);
    return next();
  };
}

export interface Logger {
  info: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
}

/** Logs each call's name, duration and success/failure. */
export function logging(logger: Logger = defaultLogger): Middleware {
  return async (ctx: CallContext, next) => {
    const start = Date.now();
    try {
      const result = await next();
      logger.info(`tool ${ctx.name} ok`, { ms: Date.now() - start });
      return result;
    } catch (err) {
      logger.error(`tool ${ctx.name} failed`, { ms: Date.now() - start, err });
      throw err;
    }
  };
}

const defaultLogger: Logger = {
  info: (m, d) => console.error(m, d ?? ''),
  error: (m, d) => console.error(m, d ?? ''),
};
