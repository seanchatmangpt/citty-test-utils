// Global setup for README tests
import { setupCleanroom } from '../../src/core/runners/legacy-compatibility.js'

export default async function setup() {
  console.log('🚀 Setting up README tests...')

  try {
    // Setup cleanroom for tests that need it
    await setupCleanroom({
      rootDir: './playground',
      timeout: 60000,
    })
    console.log('✅ Cleanroom setup complete')
  } catch (error) {
    console.warn('⚠️ Cleanroom setup failed:', error.message)
    console.log('📝 Some tests may be skipped')
  }

  console.log('✅ README test setup complete')
}
