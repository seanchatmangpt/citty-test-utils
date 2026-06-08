#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import { consola } from '@un-test/core'
import * as stdEnv from 'std-env'
import { withQuery, joinURL } from 'ufo'
import { hash } from 'ohash'
import { camelCase, kebabCase, pascalCase, snakeCase } from 'scule'
import { parseYAML, parseTOML } from 'confbox'
import { renderUnicode } from 'uqr'
import { destr } from 'destr'
import { loadConfig } from 'c12'

const showcase = defineCommand({
  meta: {
    name: 'ctu-showcase',
    version: '1.0.0',
    description: 'UnJS Ecosystem Showcase - Powered by citty-test-utils',
  },
  subCommands: {
    consola: defineCommand({
      meta: { name: 'consola', description: 'Showcase elegant logging' },
      run() {
        consola.info('This is an info message')
        consola.start('Starting a process...')
        consola.success('Process completed successfully!')
        consola.warn('Warning: something might be wrong')
        consola.error('Error: something went wrong')
        consola.fatal('Fatal error occurred')
        consola.box('Consola can even draw boxes!')
      }
    }),
    env: defineCommand({
      meta: { name: 'env', description: 'Showcase environment detection' },
      run() {
        consola.info('Environment Information:')
        consola.log(`- Platform: ${stdEnv.platform}`)
        consola.log(`- Is CI? ${stdEnv.isCI}`)
        consola.log(`- Is Test? ${stdEnv.isTest}`)
        consola.log(`- Is Debug? ${stdEnv.isDebug}`)
        consola.log(`- Runtime: ${stdEnv.runtime}`)
      }
    }),
    ufo: defineCommand({
      meta: { name: 'ufo', description: 'Showcase URL manipulation' },
      run() {
        const url = joinURL('https://google.com', 'search')
        const withParams = withQuery(url, { q: 'unjs' })
        consola.info(`Joined URL: ${url}`)
        consola.info(`URL with Query: ${withParams}`)
      }
    }),
    ohash: defineCommand({
      meta: { name: 'ohash', description: 'Showcase object hashing' },
      args: { input: { type: 'positional', default: 'unjs' } },
      run({ args }) {
        const h = hash(args.input)
        consola.info(`Input: ${args.input}`)
        consola.info(`Hash: ${h}`)
        
        const objHash = hash({ a: 1, b: 2 })
        consola.info(`Object { a: 1, b: 2 } Hash: ${objHash}`)
      }
    }),
    scule: defineCommand({
      meta: { name: 'scule', description: 'Showcase string case transformation' },
      args: { input: { type: 'positional', default: 'hello-world-unjs' } },
      run({ args }) {
        consola.info(`Original: ${args.input}`)
        consola.log(`- camelCase: ${camelCase(args.input)}`)
        consola.log(`- kebabCase: ${kebabCase(args.input)}`)
        consola.log(`- pascalCase: ${pascalCase(args.input)}`)
        consola.log(`- snakeCase: ${snakeCase(args.input)}`)
      }
    }),
    confbox: defineCommand({
      meta: { name: 'confbox', description: 'Showcase YAML/TOML parsing' },
      run() {
        const yaml = 'name: unjs\ntype: ecosystem'
        const parsedYAML = parseYAML(yaml)
        consola.info('YAML Input:\n' + yaml)
        consola.success('Parsed YAML:', parsedYAML)

        const toml = 'name = "unjs"\ntype = "ecosystem"'
        const parsedTOML = parseTOML(toml)
        consola.info('TOML Input:\n' + toml)
        consola.success('Parsed TOML:', parsedTOML)
      }
    }),
    uqr: defineCommand({
      meta: { name: 'uqr', description: 'Showcase QR code generation' },
      args: { text: { type: 'positional', default: 'https://unjs.io' } },
      run({ args }) {
        consola.info(`Generating QR code for: ${args.text}`)
        consola.log(renderUnicode(args.text))
      }
    }),
    destr: defineCommand({
      meta: { name: 'destr', description: 'Showcase safe JSON parsing' },
      run() {
        const raw = '{"name": "unjs", "__proto__": {"polluted": true}}'
        const parsed = destr(raw)
        consola.info('Input with potential pollution:', raw)
        consola.success('Parsed safely:', parsed)
        consola.info('Value of {}.polluted:', {}.polluted) // Should be undefined
      }
    }),
    config: defineCommand({
      meta: { name: 'config', description: 'Showcase c12 configuration loading' },
      async run() {
        consola.start('Loading ctu config...')
        const { config } = await loadConfig({ name: 'ctu' })
        consola.success('Loaded Configuration:', config)
      }
    })
  }
})

runMain(showcase)
