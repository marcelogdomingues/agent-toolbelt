import { z } from 'zod';
import type { CallMeta, Tool } from './tool.js';

/** The context each middleware receives. */
export interface CallContext {
  name: string;
  input: unknown;
  meta: CallMeta;
  tool: Tool<any>;
}

export type Middleware = (ctx: CallContext, next: () => Promise<unknown>) => Promise<unknown>;

/** A tool-call function schema, ready for LLM function/tool calling. */
export interface ToolSchema {
  name: string;
  description: string;
  parameters: unknown; // JSON Schema
}

export class ToolValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Invalid arguments for tool "${toolName}": ${z.prettifyError(new z.ZodError(issues))}`);
    this.name = 'ToolValidationError';
  }
}

export class UnknownToolError extends Error {
  constructor(public readonly toolName: string) {
    super(`Unknown tool "${toolName}"`);
    this.name = 'UnknownToolError';
  }
}

/**
 * A framework-agnostic registry of typed tools for LLM agents: register tools,
 * export their JSON Schema for function calling, and execute validated calls
 * through a middleware chain.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool<any>>();
  private readonly middleware: Middleware[] = [];

  register(...tools: Tool<any>[]): this {
    for (const tool of tools) {
      if (this.tools.has(tool.name)) throw new Error(`Tool "${tool.name}" already registered`);
      this.tools.set(tool.name, tool);
    }
    return this;
  }

  use(...mw: Middleware[]): this {
    this.middleware.push(...mw);
    return this;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  get(name: string): Tool<any> | undefined {
    return this.tools.get(name);
  }

  list(): Tool<any>[] {
    return [...this.tools.values()];
  }

  /** JSON-Schema tool definitions for an LLM's function/tool-calling API. */
  toJSONSchema(): ToolSchema[] {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: z.toJSONSchema(t.inputSchema),
    }));
  }

  /**
   * Validates `rawArgs` against the tool's schema and runs it through the
   * middleware chain. Throws UnknownToolError / ToolValidationError as needed.
   */
  async call(name: string, rawArgs: unknown, meta: CallMeta = {}): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new UnknownToolError(name);

    const parsed = tool.inputSchema.safeParse(rawArgs);
    if (!parsed.success) throw new ToolValidationError(name, parsed.error.issues);

    const ctx: CallContext = { name, input: parsed.data, meta, tool };
    const run = (i: number): Promise<unknown> => {
      if (i < this.middleware.length) return this.middleware[i]!(ctx, () => run(i + 1));
      return Promise.resolve(tool.handler(parsed.data, meta));
    };
    return run(0);
  }
}
