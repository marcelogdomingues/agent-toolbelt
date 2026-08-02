# agent-toolbelt

**A tiny, framework-agnostic tool registry for LLM agents.** Define typed tools once with
[zod](https://zod.dev), export their **JSON Schema for function/tool calling**, and run
**validated, scope-checked** calls through composable middleware. No agent framework
required — bring your own model loop.

🌍 **[English](README.md)** · [Português](README.pt.md) · 📚 [Documentation](docs/README.md)

[![CI](https://github.com/marcelogdomingues/agent-toolbelt/actions/workflows/ci.yml/badge.svg)](https://github.com/marcelogdomingues/agent-toolbelt/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/agent-toolbelt.svg)](https://www.npmjs.com/package/agent-toolbelt)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Why

Every agent project rebuilds the same plumbing: define a tool, generate its JSON Schema
for the model, validate the arguments the model sends back, then execute it — with logging
and authorization bolted on. agent-toolbelt is exactly that plumbing, and nothing else, so
it drops into any model loop (Anthropic, OpenAI-style, local).

## Install

```bash
npm install agent-toolbelt zod
```

## Quick start

```ts
import { z } from 'zod';
import { defineTool, ToolRegistry, requireScopes, logging } from 'agent-toolbelt';

const getWeather = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city.',
  input: z.object({ city: z.string() }),
  handler: ({ city }) => ({ city, tempC: 21 }),
});

const registry = new ToolRegistry()
  .register(getWeather)
  .use(logging())
  .use(requireScopes((meta) => (meta.scopes as string[]) ?? []));

// 1. Hand this to your model for tool/function calling:
const schema = registry.toJSONSchema();

// 2. Execute what the model asks for — arguments are validated first:
const result = await registry.call('get_weather', { city: 'Lisbon' });
```

## Features

- **Typed tools** — `defineTool` infers the handler's input from the zod schema.
- **JSON Schema export** — `registry.toJSONSchema()` for any function-calling API.
- **Runtime validation** — bad arguments throw `ToolValidationError`, never reach your handler.
- **Middleware** — `logging()`, `requireScopes()`, or your own onion-style middleware.
- **Scopes** — declare `scopes` per tool; pairs with
  [agent-passport](https://github.com/marcelogdomingues/agent-passport).
- **Tiny** — one small dependency (zod).

## Errors

- `UnknownToolError` — no tool with that name.
- `ToolValidationError` — arguments failed the zod schema (`.issues` for details).
- `ScopeError` — caller lacks a required scope.

## License

MIT © Marcelo Domingues
