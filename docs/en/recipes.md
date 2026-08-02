# Recipes

## Anthropic-style tool loop

```ts
const tools = registry.toJSONSchema().map((t) => ({
  name: t.name, description: t.description, input_schema: t.parameters,
}));

let messages = [{ role: 'user', content: 'Email a@b.com a summary.' }];
while (true) {
  const res = await anthropic.messages.create({ model: 'claude-…', tools, messages });
  const calls = res.content.filter((c) => c.type === 'tool_use');
  if (!calls.length) break;
  for (const call of calls) {
    let output;
    try { output = await registry.call(call.name, call.input, { scopes }); }
    catch (e) { output = { error: (e as Error).message }; }
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(output) }] });
  }
}
```

## OpenAI-style adaptation

```ts
const tools = registry.toJSONSchema().map((t) => ({
  type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters },
}));
// on a tool_call: await registry.call(call.function.name, JSON.parse(call.function.arguments), meta)
```

## Scopes from an agent passport

```ts
import { verifyPassport } from 'agent-passport';
const passport = await verifyPassport(passportJwt);
registry.use(requireScopes(() => passport.agent.scopes));
```

## Custom middleware: timeout

```ts
const withTimeout = (ms: number): Middleware => async (ctx, next) =>
  Promise.race([next(), new Promise((_, r) => setTimeout(() => r(new Error(`${ctx.name} timed out`)), ms))]);

registry.use(withTimeout(10_000));
```

## Handle validation errors gracefully

```ts
import { ToolValidationError } from 'agent-toolbelt';
try { await registry.call(name, args); }
catch (e) { if (e instanceof ToolValidationError) return { error: e.message, issues: e.issues }; throw e; }
```
