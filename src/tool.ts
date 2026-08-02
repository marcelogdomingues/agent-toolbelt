import { z } from 'zod';

/** Arbitrary per-call context supplied by the caller (auth, ids, request info…). */
export type CallMeta = Record<string, unknown>;

export interface Tool<I = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<I>;
  /** Scopes required to call this tool (enforced by the scope middleware). */
  scopes?: string[];
  handler: (input: I, meta: CallMeta) => unknown | Promise<unknown>;
}

export interface DefineToolConfig<S extends z.ZodType> {
  name: string;
  description: string;
  input: S;
  scopes?: string[];
  handler: (input: z.infer<S>, meta: CallMeta) => unknown | Promise<unknown>;
}

/**
 * Defines a typed tool. The handler's `input` is inferred from the zod schema,
 * so you get end-to-end type safety with runtime validation.
 */
export function defineTool<S extends z.ZodType>(config: DefineToolConfig<S>): Tool<z.infer<S>> {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.input as unknown as z.ZodType<z.infer<S>>,
    ...(config.scopes ? { scopes: config.scopes } : {}),
    handler: config.handler,
  };
}
