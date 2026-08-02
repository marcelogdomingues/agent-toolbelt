# Começar

## Requisitos

- Node.js 20 ou superior
- `zod` v4 (peer dependency)

## Instalação

```bash
npm install agent-toolbelt zod
```

## Definir uma ferramenta

```ts
import { z } from 'zod';
import { defineTool } from 'agent-toolbelt';

const search = defineTool({
  name: 'search_docs',
  description: 'Search the documentation.',
  input: z.object({ query: z.string(), limit: z.number().int().max(20).default(5) }),
  handler: async ({ query, limit }) => {
    // ...a tua lógica; `query` e `limit` são totalmente tipados
    return { results: [] };
  },
});
```

## Registar e expor a um modelo

```ts
import { ToolRegistry } from 'agent-toolbelt';

const registry = new ToolRegistry().register(search);
const tools = registry.toJSONSchema(); // passa à API de tool/function calling do teu LLM
```

Cada entrada é `{ name, description, parameters }`, em que `parameters` é JSON Schema
gerado a partir do input zod.

## Executar uma chamada

Quando o modelo devolve uma tool call, entrega os argumentos em bruto ao registry:

```ts
const result = await registry.call('search_docs', modelArgs, { userId: '123' });
```

Os argumentos são validados contra o schema primeiro — input inválido lança
`ToolValidationError` antes de o teu handler correr. O terceiro argumento é `meta` livre
(auth, ids, info do pedido) disponível ao middleware e ao handler.
