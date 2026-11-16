import { setupCleanroom, runCitty, teardownCleanroom } from '../packages/runners-cleanroom/index.js'

async function main() {
  console.log('Setting up cleanroom...')
  await setupCleanroom({ rootDir: '.' })
  console.log('Running command...')
  const result = await runCitty(['--version'])
  console.log('Result:', JSON.stringify(result, null, 2))
  console.log('Tearing down cleanroom...')
  await teardownCleanroom()
}

main().catch(err => {
  console.error('Error:', err)
})
