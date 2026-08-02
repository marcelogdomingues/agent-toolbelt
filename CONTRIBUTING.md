# Contributing to agent-toolbelt

Thanks for helping! agent-toolbelt stays tiny and framework-agnostic.

## Setup

```bash
npm install
npm test
npm run demo
```

## Guidelines

- Keep the surface small: `defineTool`, `ToolRegistry`, a couple of middlewares.
- The only runtime dependency is `zod` — don't add more.
- Add a test for every behaviour change (`test/*.test.ts`).
- Middleware must be composable and not swallow errors silently.

## Good first contributions

- Adapters that convert `toJSONSchema()` output to a specific SDK's tool format.
- More middleware (rate limiting, timeouts, retries).
- Examples wiring it into a real model loop.
