import { defineUntypedSchema } from 'untyped'

export default defineUntypedSchema({
  cliPath: {
    $default: './src/cli.mjs',
    $schema: {
      description: 'Path to the CLI executable.',
      type: 'string'
    }
  },
  cwd: {
    $default: '.',
    $schema: {
      description: 'Current working directory for the CLI execution.',
      type: 'string'
    }
  },
  env: {
    $default: {},
    $schema: {
      description: 'Environment variables to pass to the CLI.',
      type: 'object'
    }
  },
  timeout: {
    $default: 30000,
    $schema: {
      description: 'Execution timeout in milliseconds.',
      type: 'number'
    }
  },
  failFast: {
    $default: false,
    $schema: {
      description: 'Whether to fail fast on command failure.',
      type: 'boolean'
    }
  }
})
