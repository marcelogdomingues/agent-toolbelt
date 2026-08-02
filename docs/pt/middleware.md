# Middleware & o loop do agente

## Middleware

O middleware envolve cada `call()` em ordem de cebola (o primeiro registado é o mais
exterior):

```ts
import type { Middleware } from 'agent-toolbelt';

const timing: Middleware = async (ctx, next) => {
  const start = Date.now();
  try {
    return await next();
  } finally {
    console.error(`${ctx.name} demorou ${Date.now() - start}ms`);
  }
};

registry.use(timing);
```

O `ctx` é `{ name, input, meta, tool }`. O `input` já está validado.

### Middleware embutido

- **`logging(logger?)`** — regista nome, duração e sucesso/falha de cada chamada.
- **`requireScopes(getGranted)`** — impõe os `scopes` declarados de cada ferramenta contra
  os scopes que o chamador concede via `meta`. `"*"` concede tudo. Combina com o
  [agent-passport](https://github.com/marcelogdomingues/agent-passport):

  ```ts
  registry.use(requireScopes((meta) => (meta.scopes as string[]) ?? []));
  await registry.call('send_email', args, { scopes: passport.agent.scopes });
  ```

## O loop do agente

O agent-toolbelt é a camada de ferramentas; o loop do modelo é teu:

```ts
const tools = registry.toJSONSchema();
let messages = [/* system + user */];

while (true) {
  const res = await model.chat({ messages, tools });      // o teu SDK de LLM
  if (!res.toolCalls?.length) return res.text;

  for (const tc of res.toolCalls) {
    let output;
    try {
      output = await registry.call(tc.name, tc.arguments, { scopes });
    } catch (err) {
      output = { error: (err as Error).message };          // devolve os erros ao modelo
    }
    messages.push(toolResultMessage(tc.id, output));
  }
}
```

Como a validação e a autorização vivem no `call()`, o loop mantém-se igual seja qual for o
modelo ou SDK que uses.
