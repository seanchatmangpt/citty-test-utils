import { scenario, concurrentScenario, localScenario, cleanroomScenario } from 'citty-test-utils'

export { scenario, concurrentScenario, localScenario, cleanroomScenario }

export const scenarios = {
  help: (env = 'local') => {
    const s = env === 'local' ? localScenario('Help') : cleanroomScenario('Help')
    return s.step('Help', '--show-help').expectSuccess()
  },
  version: (env = 'local') => {
    const s = env === 'local' ? localScenario('Version') : cleanroomScenario('Version')
    return s.step('Version', '--show-version').expectSuccess()
  },
  invalidCommand: (cmd, env = 'local') => {
    const s = env === 'local' ? localScenario('Invalid Command') : cleanroomScenario('Invalid Command')
    return s.step('Invalid', cmd).expectFailure()
  },
  jsonOutput: (args, env = 'local') => {
    const s = env === 'local' ? localScenario('JSON Output') : cleanroomScenario('JSON Output')
    return s.step('JSON', args).expectSuccess().expectJson()
  },
  subcommand: (verb, args, env = 'local') => {
    const s = env === 'local' ? localScenario('Subcommand') : cleanroomScenario('Subcommand')
    return s.step('Subcommand', [verb, ...args]).expectSuccess()
  },
  idempotent: (args, env = 'local') => {
    const s = env === 'local' ? localScenario('Idempotent') : cleanroomScenario('Idempotent')
    return s.step('Run 1', args).expectSuccess().step('Run 2', args).expectSuccess()
  },
  concurrent: (runs, env = 'local') => {
    const s = env === 'local' ? localScenario('Concurrent') : cleanroomScenario('Concurrent')
    s.concurrentMode = true
    runs.forEach((r, i) => {
      const args = Array.isArray(r) ? r : r.args
      const opts = r.opts || {}
      s.step(`Run ${i}`, args, opts).expectSuccess()
    })
    return s
  },
  errorCase: (args, pattern, env = 'local') => {
    const s = env === 'local' ? localScenario('Error Case') : cleanroomScenario('Error Case')
    return s.step('Error', args).expectFailure().expectStderr(pattern)
  }
}
