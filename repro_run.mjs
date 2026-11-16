import { runLocalCitty } from './src/core/runners/local-runner.js';

async function test() {
  const result = await runLocalCitty(['--version'], {
    env: { TEST_CLI: 'true' }
  });
  console.log('Result:', JSON.stringify(result, null, 2));
}

test();
