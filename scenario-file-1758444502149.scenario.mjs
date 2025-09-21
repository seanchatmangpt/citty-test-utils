#!/usr/bin/env node
// scenario-file-1758444502149.scenario.mjs - Custom scenario for scenario-file-1758444502149

import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { runLocalCitty, runCitty } from 'citty-test-utils'

export const scenario-file-1758444502149Scenario = scenario('Scenario File 1758444502149 Scenario')
  
  .step('Execute command', async (ctx) => {
    
    const result = await runLocalCitty(['--help'], {
      cwd: '.',
      env: { TEST_CLI: 'true' },
      timeout: 10000
    })
    

    
    
    result.expectSuccess()
    
    result.expectOutput(/USAGE|COMMANDS/)
    
    result.expectNoStderr()
    
    

    return result
  })
  

// Export for easy testing
export async function runScenario-file-1758444502149Scenario(environment = 'local') {
  return await scenario-file-1758444502149Scenario.execute()
}

// Export scenario builder for customization
export { scenario-file-1758444502149Scenario as scenario }
