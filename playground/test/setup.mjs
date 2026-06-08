import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
process.env.TEST_CLI_PATH = resolve(__dirname, '../src/cli.mjs')
process.env.TEST_CWD = resolve(__dirname, '..')