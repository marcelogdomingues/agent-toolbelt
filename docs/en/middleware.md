# Middleware & the agent loop

## Middleware

Middleware wraps every `call()` in onion order (first registered is outermost):

```ts
import type { Middleware } from 'agent-toolbelt';

const timing: Middleware = async (ctx, next) => {
  const start = Date.now();
  try {
    return await next();
  } finally {
    console.error(`${ctx.name} took ${Date.now() - start}ms`);
  }
};

registry.use(timing);
```

`ctx` is `{ name, input, meta, tool }`. `input` is already validated.

### Built-in middleware

- **`logging(logger?)`** — logs each call's name, duration and success/failure.
- **`requireScopes(getGranted)`** — enforces each tool's declared `scopes` against the
  scopes the caller grants via `meta`. `"*"` grants everything. Pairs with
  [agent-passport](https://github.com/marcelogdomingues/agent-passport):

  ```ts
  registry.use(requireScopes((meta) => (meta.scopes as string[]) ?? []));
  await registry.call('send_email', args, { scopes: passport.agent.scopes });
  ```

## The agent loop

agent-toolbelt is the tool layer; you own the model loop:

```ts
const tools = registry.toJSONSchema();
let messages = [/* system + user */];

while (true) {
  const res = await model.chat({ messages, tools });      // your LLM SDK
  if (!res.toolCalls?.length) return res.text;

  for (const tc of res.toolCalls) {
    let output;
    try {
      output = await registry.call(tc.name, tc.arguments, { scopes });
    } catch (err) {
      output = { error: (err as Error).message };          // feed errors back to the model
    }
    messages.push(toolResultMessage(tc.id, output));
  }
}
```

Because validation and authorization live in `call()`, the loop stays the same no matter
which model or SDK you use.
