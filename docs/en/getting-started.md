# Getting started

## Requirements

- Node.js 20 or newer
- `zod` v4 (peer dependency)

## Install

```bash
npm install agent-toolbelt zod
```

## Define a tool

```ts
import { z } from 'zod';
import { defineTool } from 'agent-toolbelt';

const search = defineTool({
  name: 'search_docs',
  description: 'Search the documentation.',
  input: z.object({ query: z.string(), limit: z.number().int().max(20).default(5) }),
  handler: async ({ query, limit }) => {
    // ...your logic; `query` and `limit` are fully typed
    return { results: [] };
  },
});
```

## Register and expose to a model

```ts
import { ToolRegistry } from 'agent-toolbelt';

const registry = new ToolRegistry().register(search);
const tools = registry.toJSONSchema(); // pass to your LLM's tool/function-calling API
```

Each entry is `{ name, description, parameters }`, where `parameters` is JSON Schema
generated from the zod input.

## Execute a call

When the model returns a tool call, hand the raw arguments to the registry:

```ts
const result = await registry.call('search_docs', modelArgs, { userId: '123' });
```

Arguments are validated against the schema first — invalid input throws
`ToolValidationError` before your handler runs. The third argument is free-form `meta`
(auth, ids, request info) available to middleware and the handler.
