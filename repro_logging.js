import { consola } from './packages/core/utils/logging.js'

console.log('Testing fatal logging...')
consola.fatal(new Error('CRITICAL_SYSTEM_FAILURE: Reactor core breach detected!'))
