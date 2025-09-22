// Cleanroom test utilities - "Let it crash" philosophy
import { runCitty, runLocalCitty } from '../../index.js'

export class CleanroomTestUtils {
  /**
   * Execute cleanroom operation - let it crash if it fails
   */
  static async runCitty(args, options = {}) {
    return await runCitty(args, options)
  }

  /**
   * Execute local operation - let it crash if it fails
   */
  static async runLocalCitty(args, options = {}) {
    return await runLocalCitty(args, options)
  }

  /**
   * Execute multiple concurrent operations - let it crash if any fail
   */
  static async concurrentOperations(operations) {
    return await Promise.all(operations)
  }

  /**
   * Execute scenario - let it crash if it fails
   */
  static async executeScenario(scenarioBuilder) {
    return await scenarioBuilder.execute('cleanroom')
  }

  /**
   * Import module - let it crash if it fails
   */
  static async importModule(modulePath) {
    return await import(modulePath)
  }

  /**
   * Execute cross-environment operations - let it crash if either fails
   */
  static async crossEnvironment(localOperation, cleanroomOperation) {
    const [localResult, cleanroomResult] = await Promise.all([
      localOperation(),
      cleanroomOperation(),
    ])
    return { local: localResult, cleanroom: cleanroomResult }
  }

  /**
   * Validate that a result exists and has expected properties - let it crash if invalid
   */
  static validateResult(result, expectedProperties = [], testName = 'Unknown test') {
    if (!result) {
      throw new Error(`${testName}: Result is null or undefined`)
    }

    if (!result.result) {
      throw new Error(`${testName}: Result.result is null or undefined`)
    }

    expectedProperties.forEach((prop) => {
      if (!(prop in result.result)) {
        throw new Error(`${testName}: Result.result.${prop} is missing`)
      }
    })

    return true
  }
}
