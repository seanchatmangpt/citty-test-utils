
import { runLocalCitty } from './src/core/runners/local-runner.js';
import { resolve } from 'path';

async function test() {
  process.env.TEST_CLI_PATH = './playground/src/cli.mjs';
  const result = await runLocalCitty({
    args: ['--help'],
    env: { TEST_CLI: 'true' },
  });
  console.log('Result:', JSON.stringify(result, null, 2));
}

test();
