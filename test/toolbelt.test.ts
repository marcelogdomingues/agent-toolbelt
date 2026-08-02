import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  defineTool,
  ToolRegistry,
  ToolValidationError,
  UnknownToolError,
  requireScopes,
  logging,
  ScopeError,
  type Logger,
} from '../src/index.js';

function weatherTool() {
  return defineTool({
    name: 'get_weather',
    description: 'Get weather for a city.',
    input: z.object({ city: z.string() }),
    handler: ({ city }) => ({ city, tempC: 20 }),
  });
}

test('defineTool + call validates and runs the handler', async () => {
  const registry = new ToolRegistry().register(weatherTool());
  const result = await registry.call('get_weather', { city: 'Porto' });
  assert.deepEqual(result, { city: 'Porto', tempC: 20 });
});

test('invalid arguments throw ToolValidationError', async () => {
  const registry = new ToolRegistry().register(weatherTool());
  await assert.rejects(() => registry.call('get_weather', { city: 123 }), ToolValidationError);
});

test('unknown tool throws UnknownToolError', async () => {
  const registry = new ToolRegistry();
  await assert.rejects(() => registry.call('nope', {}), UnknownToolError);
});

test('duplicate registration throws', () => {
  const registry = new ToolRegistry().register(weatherTool());
  assert.throws(() => registry.register(weatherTool()), /already registered/);
});

test('toJSONSchema produces function-calling definitions', () => {
  const registry = new ToolRegistry().register(weatherTool());
  const [schema] = registry.toJSONSchema();
  assert.equal(schema!.name, 'get_weather');
  assert.equal(schema!.description, 'Get weather for a city.');
  const params = schema!.parameters as { type: string; properties: Record<string, unknown> };
  assert.equal(params.type, 'object');
  assert.ok('city' in params.properties);
});

test('requireScopes blocks calls missing a scope', async () => {
  const tool = defineTool({
    name: 'send_email',
    description: 'Send email.',
    scopes: ['email:send'],
    input: z.object({ to: z.string() }),
    handler: () => 'sent',
  });
  const registry = new ToolRegistry()
    .register(tool)
    .use(requireScopes((meta) => (meta.scopes as string[]) ?? []));

  await assert.rejects(() => registry.call('send_email', { to: 'a' }, { scopes: [] }), ScopeError);
  assert.equal(await registry.call('send_email', { to: 'a' }, { scopes: ['email:send'] }), 'sent');
  assert.equal(await registry.call('send_email', { to: 'a' }, { scopes: ['*'] }), 'sent');
});

test('middleware runs in onion order around the handler', async () => {
  const order: string[] = [];
  const mw = (label: string) => async (_ctx: unknown, next: () => Promise<unknown>) => {
    order.push(`>${label}`);
    const r = await next();
    order.push(`<${label}`);
    return r;
  };
  const registry = new ToolRegistry()
    .register(weatherTool())
    .use(mw('a'))
    .use(mw('b'));
  await registry.call('get_weather', { city: 'X' });
  assert.deepEqual(order, ['>a', '>b', '<b', '<a']);
});

test('logging middleware records success', async () => {
  const logs: string[] = [];
  const logger: Logger = { info: (m) => logs.push(`info:${m}`), error: (m) => logs.push(`error:${m}`) };
  const registry = new ToolRegistry().register(weatherTool()).use(logging(logger));
  await registry.call('get_weather', { city: 'X' });
  assert.ok(logs.some((l) => l.startsWith('info:tool get_weather ok')));
});
