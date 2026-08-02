/**
 * Demo: define tools, expose their JSON Schema to an "LLM", then execute a
 * validated, scope-checked call — the loop an agent runs.
 *
 * Run with: `npm run demo`
 */
import { z } from 'zod';
import { defineTool, ToolRegistry, requireScopes, logging } from './index.js';

const getWeather = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city.',
  input: z.object({ city: z.string() }),
  handler: ({ city }) => ({ city, tempC: 21, summary: 'sunny' }),
});

const sendEmail = defineTool({
  name: 'send_email',
  description: 'Send an email.',
  scopes: ['email:send'],
  input: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }),
  handler: ({ to }) => ({ delivered: true, to }),
});

async function main() {
  const registry = new ToolRegistry()
    .register(getWeather, sendEmail)
    .use(logging())
    .use(requireScopes((meta) => (meta.scopes as string[]) ?? []));

  // 1. What you'd hand to the model for tool/function calling:
  console.log('Tool schema for the LLM:');
  console.log(JSON.stringify(registry.toJSONSchema(), null, 2).slice(0, 400) + '…\n');

  // 2. A validated call with the right scope:
  const weather = await registry.call('get_weather', { city: 'Lisbon' });
  console.log('get_weather →', weather);

  const email = await registry.call(
    'send_email',
    { to: 'a@b.com', subject: 'Hi', body: 'Hello' },
    { scopes: ['email:send'] },
  );
  console.log('send_email →', email);

  // 3. Missing scope is blocked:
  try {
    await registry.call('send_email', { to: 'a@b.com', subject: 'Hi', body: 'Hello' }, { scopes: [] });
  } catch (err) {
    console.log('blocked:', (err as Error).message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
