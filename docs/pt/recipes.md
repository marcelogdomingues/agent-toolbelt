# Receitas

## Loop de tools estilo Anthropic

```ts
const tools = registry.toJSONSchema().map((t) => ({
  name: t.name, description: t.description, input_schema: t.parameters,
}));

let messages = [{ role: 'user', content: 'Envia um resumo por email a a@b.com.' }];
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

## Adaptação estilo OpenAI

```ts
const tools = registry.toJSONSchema().map((t) => ({
  type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters },
}));
// numa tool_call: await registry.call(call.function.name, JSON.parse(call.function.arguments), meta)
```

## Scopes a partir de um passaporte de agente

```ts
import { verifyPassport } from 'agent-passport';
const passport = await verifyPassport(passportJwt);
registry.use(requireScopes(() => passport.agent.scopes));
```

## Middleware personalizado: timeout

```ts
const withTimeout = (ms: number): Middleware => async (ctx, next) =>
  Promise.race([next(), new Promise((_, r) => setTimeout(() => r(new Error(`${ctx.name} expirou`)), ms))]);

registry.use(withTimeout(10_000));
```

## Tratar erros de validação com elegância

```ts
import { ToolValidationError } from 'agent-toolbelt';
try { await registry.call(name, args); }
catch (e) { if (e instanceof ToolValidationError) return { error: e.message, issues: e.issues }; throw e; }
```
