#!/usr/bin/env node
// test/unit/domain-loader.test.mjs - Domain Loader Unit Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DomainLoader } from '../../src/core/discovery/domain-loader.js'
import { writeFile, existsSync } from 'node:fs/promises'
import { resolve } from 'node:path'

describe.skip('Domain Loader Unit Tests', () => {
  let loader
  let testConfigPath
  let testPackageJsonPath
  let testCLIPath

  beforeEach(async () => {
    loader = new DomainLoader()
    testConfigPath = resolve(process.cwd(), 'test-domain-loader-config.json')
    testPackageJsonPath = resolve(process.cwd(), 'test-domain-loader-package.json')
    testCLIPath = resolve(process.cwd(), 'test-domain-loader-cli.js')
  })

  afterEach(async () => {
    try {
      if (existsSync(testConfigPath)) {
        await import('node:fs').then((fs) => fs.promises.unlink(testConfigPath))
      }
      if (existsSync(testPackageJsonPath)) {
        await import('node:fs').then((fs) => fs.promises.unlink(testPackageJsonPath))
      }
      if (existsSync(testCLIPath)) {
        await import('node:fs').then((fs) => fs.promises.unlink(testCLIPath))
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Source Registration', () => {
    it('should register and manage sources', () => {
      const testSource = {
        loader: async () => ({
          domains: ['test'],
          resources: { test: ['resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: (result) => result.domains && result.domains.length > 0,
        priority: 10,
      }

      loader.registerSource('test-source', testSource)

      // Source should be registered
      expect(loader.sourceRegistry.has('test-source')).toBe(true)
    })

    it('should handle source priority ordering', () => {
      const source1 = {
        loader: async () => ({ domains: ['test1'] }),
        validator: () => true,
        priority: 5,
      }
      const source2 = {
        loader: async () => ({ domains: ['test2'] }),
        validator: () => true,
        priority: 10,
      }

      loader.registerSource('source1', source1)
      loader.registerSource('source2', source2)

      const sortedSources = loader.getSortedSources(['source1', 'source2'])

      expect(sortedSources[0].name).toBe('source2') // Higher priority first
      expect(sortedSources[1].name).toBe('source1')
    })

    it('should filter out disabled sources', () => {
      const enabledSource = {
        loader: async () => ({ domains: ['enabled'] }),
        validator: () => true,
        priority: 10,
        enabled: true,
      }
      const disabledSource = {
        loader: async () => ({ domains: ['disabled'] }),
        validator: () => true,
        priority: 10,
        enabled: false,
      }

      loader.registerSource('enabled', enabledSource)
      loader.registerSource('disabled', disabledSource)

      const sortedSources = loader.getSortedSources(['enabled', 'disabled'])

      expect(sortedSources).toHaveLength(1)
      expect(sortedSources[0].name).toBe('enabled')
    })
  })

  describe('CLI Loading', () => {
    it('should load domains from CLI analysis', async () => {
      await writeFile(
        testCLIPath,
        `#!/usr/bin/env node
console.log(\`COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  dev project create <name> [options]     Create a new project
\`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
`,
        'utf8'
      )

      const result = await loader.loadFromCLI({
        cliPath: testCLIPath,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.dev).toContain('project')
    })

    it('should load domains from help output', async () => {
      const helpOutput = `COMMANDS:
  infra server create <name> [options]    Create a new server
  dev project create <name> [options]     Create a new project
`

      const result = await loader.loadFromCLI({
        helpOutput,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
    })

    it('should handle CLI loading errors gracefully', async () => {
      const result = await loader.loadFromCLI({
        cliPath: '/nonexistent/cli.js',
      })

      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
    })
  })

  describe('Configuration Loading', () => {
    it('should load domains from configuration file', async () => {
      await writeFile(
        testConfigPath,
        JSON.stringify(
          {
            domains: {
              infra: {
                resources: ['server', 'network'],
              },
              dev: {
                resources: ['project', 'app'],
              },
            },
            actions: ['create', 'list', 'show'],
          },
          null,
          2
        ),
        'utf8'
      )

      const result = await loader.loadFromConfig({
        configPath: testConfigPath,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.infra).toContain('network')
      expect(result.actions).toContain('create')
    })

    it('should load domains from configuration object', async () => {
      const config = {
        domains: {
          test: {
            resources: ['resource1', 'resource2'],
          },
        },
        actions: ['create', 'list'],
      }

      const result = await loader.loadFromConfig({
        config,
      })

      expect(result.domains).toContain('test')
      expect(result.resources.test).toContain('resource1')
      expect(result.resources.test).toContain('resource2')
      expect(result.actions).toContain('create')
    })

    it('should handle missing configuration file', async () => {
      const result = await loader.loadFromConfig({
        configPath: '/nonexistent/config.json',
      })

      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
    })
  })

  describe('Package.json Loading', () => {
    it('should load domains from package.json scripts', async () => {
      await writeFile(
        testPackageJsonPath,
        JSON.stringify(
          {
            name: 'test-cli',
            scripts: {
              'infra:server:create': 'echo "Creating server"',
              'infra:server:list': 'echo "Listing servers"',
              'infra:network:create': 'echo "Creating network"',
              'dev:project:create': 'echo "Creating project"',
              'dev:app:create': 'echo "Creating app"',
            },
          },
          null,
          2
        ),
        'utf8'
      )

      const result = await loader.loadFromPackageJson({
        packageJsonPath: testPackageJsonPath,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.commands['infra:server:create']).toBeDefined()
      expect(result.commands['dev:project:create']).toBeDefined()
    })

    it('should handle package.json without scripts', async () => {
      await writeFile(
        testPackageJsonPath,
        JSON.stringify(
          {
            name: 'test-cli',
          },
          null,
          2
        ),
        'utf8'
      )

      const result = await loader.loadFromPackageJson({
        packageJsonPath: testPackageJsonPath,
      })

      expect(result.domains).toHaveLength(0)
      expect(result.commands).toEqual({})
    })

    it('should handle missing package.json', async () => {
      const result = await loader.loadFromPackageJson({
        packageJsonPath: '/nonexistent/package.json',
      })

      expect(result.domains).toHaveLength(0)
      expect(result.commands).toEqual({})
    })
  })

  describe('Environment Loading', () => {
    it('should load domains from environment variables', async () => {
      // Set environment variables
      process.env.CITTY_DOMAIN_TEST = JSON.stringify({
        resources: ['resource1', 'resource2'],
        actions: ['create', 'list'],
      })
      process.env.CITTY_DOMAIN_DEMO = 'simple-domain'

      const result = await loader.loadFromEnvironment({
        prefix: 'CITTY_DOMAIN_',
      })

      expect(result.domains).toContain('test')
      expect(result.domains).toContain('demo')

      // Clean up
      delete process.env.CITTY_DOMAIN_TEST
      delete process.env.CITTY_DOMAIN_DEMO
    })

    it('should handle invalid JSON in environment variables', async () => {
      process.env.CITTY_DOMAIN_INVALID = 'invalid-json'

      const result = await loader.loadFromEnvironment({
        prefix: 'CITTY_DOMAIN_',
      })

      expect(result.domains).toContain('invalid')

      // Clean up
      delete process.env.CITTY_DOMAIN_INVALID
    })

    it('should handle no environment variables', async () => {
      const result = await loader.loadFromEnvironment({
        prefix: 'NONEXISTENT_PREFIX_',
      })

      expect(result.domains).toHaveLength(0)
    })
  })

  describe('Plugin Loading', () => {
    it('should load domains from plugins', async () => {
      const pluginDir = resolve(process.cwd(), 'test-plugins')
      const pluginFile = resolve(pluginDir, 'test.plugin.js')

      // Create plugin directory and file
      await import('node:fs').then((fs) => fs.promises.mkdir(pluginDir, { recursive: true }))
      await writeFile(
        pluginFile,
        `export default async () => [
        {
          name: 'plugin-domain',
          resources: [
            {
              name: 'plugin-resource',
              actions: ['create', 'list'],
            },
          ],
        },
      ]`,
        'utf8'
      )

      try {
        const result = await loader.loadFromPlugins({
          pluginDirectory: pluginDir,
        })

        expect(result.domains).toContain('plugin-domain')
      } finally {
        // Clean up
        await import('node:fs').then((fs) =>
          fs.promises.rm(pluginDir, { recursive: true, force: true })
        )
      }
    })

    it('should handle missing plugin directory', async () => {
      const result = await loader.loadFromPlugins({
        pluginDirectory: '/nonexistent/plugins',
      })

      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
    })

    it('should handle plugin loading errors gracefully', async () => {
      const pluginDir = resolve(process.cwd(), 'test-plugins-error')
      const pluginFile = resolve(pluginDir, 'error.plugin.js')

      // Create plugin directory and file with syntax error
      await import('node:fs').then((fs) => fs.promises.mkdir(pluginDir, { recursive: true }))
      await writeFile(pluginFile, 'invalid javascript syntax', 'utf8')

      try {
        const result = await loader.loadFromPlugins({
          pluginDirectory: pluginDir,
        })

        expect(result.domains).toHaveLength(0)
      } finally {
        // Clean up
        await import('node:fs').then((fs) =>
          fs.promises.rm(pluginDir, { recursive: true, force: true })
        )
      }
    })
  })

  describe('Directory Loading', () => {
    it('should load domains from directory', async () => {
      const domainDir = resolve(process.cwd(), 'test-domains')
      const domainFile = resolve(domainDir, 'test.domain.js')

      // Create domain directory and file
      await import('node:fs').then((fs) => fs.promises.mkdir(domainDir, { recursive: true }))
      await writeFile(
        domainFile,
        `export default {
        name: 'directory-domain',
        resources: [
          {
            name: 'directory-resource',
            actions: ['create', 'list'],
          },
        ],
      }`,
        'utf8'
      )

      try {
        const result = await loader.loadFromDirectory({
          directory: domainDir,
        })

        expect(result.domains).toContain('directory-domain')
      } finally {
        // Clean up
        await import('node:fs').then((fs) =>
          fs.promises.rm(domainDir, { recursive: true, force: true })
        )
      }
    })

    it('should handle missing directory', async () => {
      const result = await loader.loadFromDirectory({
        directory: '/nonexistent/domains',
      })

      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
    })

    it('should find files matching pattern', async () => {
      const domainDir = resolve(process.cwd(), 'test-domains-pattern')
      const domainFile1 = resolve(domainDir, 'test.domain.js')
      const domainFile2 = resolve(domainDir, 'test.config.json')

      // Create domain directory and files
      await import('node:fs').then((fs) => fs.promises.mkdir(domainDir, { recursive: true }))
      await writeFile(domainFile1, `export default { name: 'domain1' }`, 'utf8')
      await writeFile(domainFile2, JSON.stringify({ name: 'domain2' }), 'utf8')

      try {
        const files = await loader.findDomainFiles(domainDir, '*.domain.js', false)

        expect(files).toHaveLength(1)
        expect(files[0]).toBe(domainFile1)
      } finally {
        // Clean up
        await import('node:fs').then((fs) =>
          fs.promises.rm(domainDir, { recursive: true, force: true })
        )
      }
    })
  })

  describe('Multi-Source Loading', () => {
    it('should load from multiple sources', async () => {
      // Register test sources
      loader.registerSource('test-source-1', {
        loader: async () => ({
          domains: ['domain1'],
          resources: { domain1: ['resource1'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 10,
      })

      loader.registerSource('test-source-2', {
        loader: async () => ({
          domains: ['domain2'],
          resources: { domain2: ['resource2'] },
          actions: ['list'],
          commands: {},
        }),
        validator: () => true,
        priority: 5,
      })

      const result = await loader.loadAll({
        sources: ['test-source-1', 'test-source-2'],
      })

      expect(result.domains).toContain('domain1')
      expect(result.domains).toContain('domain2')
      expect(result.resources.domain1).toContain('resource1')
      expect(result.resources.domain2).toContain('resource2')
      expect(result.actions).toContain('create')
      expect(result.actions).toContain('list')
    })

    it('should handle source loading errors gracefully', async () => {
      loader.registerSource('error-source', {
        loader: async () => {
          throw new Error('Source loading failed')
        },
        validator: () => true,
        priority: 10,
      })

      loader.registerSource('success-source', {
        loader: async () => ({
          domains: ['success'],
          resources: { success: ['resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 5,
      })

      const result = await loader.loadAll({
        sources: ['error-source', 'success-source'],
      })

      expect(result.domains).toContain('success')
      expect(result.metadata.errors).toHaveLength(1)
      expect(result.metadata.errors[0].source).toBe('error-source')
    })

    it('should respect source priorities', async () => {
      loader.registerSource('low-priority', {
        loader: async () => ({
          domains: ['domain'],
          resources: { domain: ['low-resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 1,
      })

      loader.registerSource('high-priority', {
        loader: async () => ({
          domains: ['domain'],
          resources: { domain: ['high-resource'] },
          actions: ['list'],
          commands: {},
        }),
        validator: () => true,
        priority: 10,
      })

      const result = await loader.loadAll({
        sources: ['low-priority', 'high-priority'],
      })

      // High priority source should be processed first
      expect(result.metadata.sources[0].name).toBe('high-priority')
      expect(result.metadata.sources[1].name).toBe('low-priority')
    })
  })

  describe('Caching', () => {
    it('should cache results when enabled', async () => {
      loader.options.cacheEnabled = true

      loader.registerSource('cache-test', {
        loader: async () => ({
          domains: ['cached'],
          resources: { cached: ['resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 10,
      })

      // First call
      const result1 = await loader.loadAll({
        sources: ['cache-test'],
      })

      // Second call should use cache
      const result2 = await loader.loadAll({
        sources: ['cache-test'],
      })

      expect(result1).toEqual(result2)
      expect(loader.getCacheStats().size).toBeGreaterThan(0)
    })

    it('should not cache when disabled', async () => {
      loader.options.cacheEnabled = false

      loader.registerSource('no-cache-test', {
        loader: async () => ({
          domains: ['no-cache'],
          resources: { 'no-cache': ['resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 10,
      })

      await loader.loadAll({
        sources: ['no-cache-test'],
      })

      expect(loader.getCacheStats().size).toBe(0)
    })

    it('should clear cache', async () => {
      loader.options.cacheEnabled = true

      loader.registerSource('clear-cache-test', {
        loader: async () => ({
          domains: ['clear-cache'],
          resources: { 'clear-cache': ['resource'] },
          actions: ['create'],
          commands: {},
        }),
        validator: () => true,
        priority: 10,
      })

      await loader.loadAll({
        sources: ['clear-cache-test'],
      })

      expect(loader.getCacheStats().size).toBeGreaterThan(0)

      loader.clearCache()
      expect(loader.getCacheStats().size).toBe(0)
    })
  })

  describe('Result Normalization', () => {
    it('should normalize results correctly', async () => {
      loader.registerSource('normalize-test', {
        loader: async () => ({
          domains: ['domain1', 'domain2'],
          resources: {
            domain1: ['resource1', 'resource2'],
            domain2: ['resource3'],
          },
          actions: ['create', 'list', 'show'],
          commands: {
            'domain1 resource1 create': {
              domain: 'domain1',
              resource: 'resource1',
              action: 'create',
            },
          },
        }),
        validator: () => true,
        priority: 10,
      })

      const result = await loader.loadAll({
        sources: ['normalize-test'],
      })

      expect(result.domains).toEqual(['domain1', 'domain2'])
      expect(result.resources.domain1).toEqual(['resource1', 'resource2'])
      expect(result.resources.domain2).toEqual(['resource3'])
      expect(result.actions).toEqual(['create', 'list', 'show'])
      expect(result.commands['domain1 resource1 create']).toBeDefined()
      expect(result.metadata.totalDomains).toBe(2)
      expect(result.metadata.totalResources).toBe(3)
      expect(result.metadata.totalActions).toBe(3)
      expect(result.metadata.totalCommands).toBe(1)
    })
  })
})
