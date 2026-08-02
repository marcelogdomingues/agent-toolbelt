# FAQ & troubleshooting

### Which model providers does it work with?

Any. `toJSONSchema()` returns standard JSON Schema, which you adapt to your SDK's tool format
(Anthropic, OpenAI-style, local). agent-toolbelt is the tool layer; you own the model loop.

### Why zod?

It gives you one source of truth: static types for your handler **and** runtime validation
**and** JSON Schema for the model — no drift between them. zod v4 is a peer dependency.

### A tool call throws instead of returning an error

`call()` throws `UnknownToolError`, `ToolValidationError`, or `ScopeError`. In an agent loop,
catch these and feed the message back to the model as the tool result so it can recover.

### How do scopes work?

Declare `scopes` on a tool and add the `requireScopes` middleware; it checks them against the
scopes the caller passes in `meta`. `"*"` grants everything. Pairs with
[agent-passport](https://github.com/marcelogdomingues/agent-passport).

### Can middleware short-circuit or transform results?

Yes — it's onion-style `(ctx, next)`. Do work before/after `next()`, throw to block, or
transform the returned value. First registered is outermost.

### Is input validated before my handler runs?

Always. Arguments are parsed by the zod schema first; your handler only ever sees valid,
typed input.
