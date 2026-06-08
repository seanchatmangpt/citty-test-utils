import { defineUntypedSchema } from 'untyped'

export default defineUntypedSchema({
  rootDir: {
    $default: '.',
    $schema: {
      description: 'Root directory of the project to be used in the cleanroom.',
      type: 'string'
    }
  },
  nodeImage: {
    $default: 'node:20-alpine',
    $schema: {
      description: 'Docker image to use for the cleanroom container.',
      type: 'string'
    }
  },
  memoryLimit: {
    $default: '512m',
    $schema: {
      description: 'Memory limit for the cleanroom container.',
      type: 'string'
    }
  },
  cpuLimit: {
    $default: '1.0',
    $schema: {
      description: 'CPU limit for the cleanroom container.',
      type: 'string'
    }
  },
  timeout: {
    $default: 60000,
    $schema: {
      description: 'Startup timeout for the cleanroom container in milliseconds.',
      type: 'number'
    }
  }
})
