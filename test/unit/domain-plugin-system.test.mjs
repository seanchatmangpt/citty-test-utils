#!/usr/bin/env node
// test/unit/domain-plugin-system.test.mjs - Domain Plugin System Unit Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DomainPluginSystem,
  builtInPlugins,
} from '../../src/core/discovery/domain-plugin-system.js'
import { writeFile, existsSync } from 'node:fs/promises'
import { resolve } from 'node:path'

describe.skip('Domain Plugin System Unit Tests', () => {
  let pluginSystem
  let testPluginDir
  let testPluginFile

  beforeEach(async () => {
    pluginSystem = new DomainPluginSystem()
    testPluginDir = resolve(process.cwd(), 'test-plugins')
    testPluginFile = resolve(testPluginDir, 'test.plugin.js')
  })

  afterEach(async () => {
    try {
      if (existsSync(testPluginDir)) {
        await import('node:fs').then((fs) =>
          fs.promises.rm(testPluginDir, { recursive: true, force: true })
        )
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Plugin Registration', () => {
    it('should register a valid plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        domains: {
          test: {
            name: 'test',
            displayName: 'Test',
            description: 'Test domain',
            resources: [
              {
                name: 'resource',
                displayName: 'Resource',
                description: 'Test resource',
                actions: ['create', 'list'],
                attributes: ['name'],
                relationships: [],
              },
            ],
          },
        },
      }

      pluginSystem.registerPlugin('test-plugin', plugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getEnabledPlugins()).toHaveLength(1)
      expect(pluginSystem.getPlugins()[0].name).toBe('test-plugin')
    })

    it('should reject invalid plugin without name', () => {
      const invalidPlugin = {
        version: '1.0.0',
        description: 'Invalid plugin',
      }

      expect(() => {
        pluginSystem.registerPlugin('invalid', invalidPlugin)
      }).toThrow('Plugin must be an object with a name property')
    })

    it('should register plugin with hooks', () => {
      const plugin = {
        name: 'hook-plugin',
        hooks: {
          'before-domain-create': (domain) => {
            domain.metadata = { createdBy: 'hook-plugin' }
            return domain
          },
          'after-domain-create': (domain) => {
            console.log(`Created domain: ${domain.name}`)
            return domain
          },
        },
      }

      pluginSystem.registerPlugin('hook-plugin', plugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.hooks.has('before-domain-create')).toBe(true)
      expect(pluginSystem.hooks.has('after-domain-create')).toBe(true)
    })

    it('should register plugin with domain extensions', () => {
      const plugin = {
        name: 'extension-plugin',
        domains: {
          infra: {
            resources: [
              {
                name: 'new-resource',
                displayName: 'New Resource',
                description: 'Additional resource',
                actions: ['create', 'list'],
                attributes: ['name'],
                relationships: [],
              },
            ],
          },
        },
      }

      pluginSystem.registerPlugin('extension-plugin', plugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.domainExtensions.has('infra')).toBe(true)
    })

    it('should handle disabled plugins', () => {
      const plugin = {
        name: 'disabled-plugin',
        enabled: false,
        domains: {
          test: { name: 'test' },
        },
      }

      pluginSystem.registerPlugin('disabled-plugin', plugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getEnabledPlugins()).toHaveLength(0)
    })
  })

  describe('Plugin Management', () => {
    beforeEach(() => {
      const plugin1 = {
        name: 'plugin-1',
        enabled: true,
        domains: { test1: { name: 'test1' } },
      }
      const plugin2 = {
        name: 'plugin-2',
        enabled: false,
        domains: { test2: { name: 'test2' } },
      }

      pluginSystem.registerPlugin('plugin-1', plugin1)
      pluginSystem.registerPlugin('plugin-2', plugin2)
    })

    it('should get all plugins', () => {
      const plugins = pluginSystem.getPlugins()

      expect(plugins).toHaveLength(2)
      expect(plugins.map((p) => p.name)).toContain('plugin-1')
      expect(plugins.map((p) => p.name)).toContain('plugin-2')
    })

    it('should get only enabled plugins', () => {
      const enabledPlugins = pluginSystem.getEnabledPlugins()

      expect(enabledPlugins).toHaveLength(1)
      expect(enabledPlugins[0].name).toBe('plugin-1')
    })

    it('should enable/disable plugins', () => {
      pluginSystem.setPluginEnabled('plugin-2', true)
      expect(pluginSystem.getEnabledPlugins()).toHaveLength(2)

      pluginSystem.setPluginEnabled('plugin-1', false)
      expect(pluginSystem.getEnabledPlugins()).toHaveLength(1)
      expect(pluginSystem.getEnabledPlugins()[0].name).toBe('plugin-2')
    })

    it('should unregister plugins', () => {
      pluginSystem.unregisterPlugin('plugin-1')

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getPlugins()[0].name).toBe('plugin-2')
    })

    it('should get plugin statistics', () => {
      const stats = pluginSystem.getPluginStats()

      expect(stats.total).toBe(2)
      expect(stats.enabled).toBe(1)
      expect(stats.disabled).toBe(1)
      expect(stats.hooks).toBe(0)
      expect(stats.domainExtensions).toBe(0)
    })
  })

  describe('Hook System', () => {
    it('should register and execute hooks', async () => {
      const hook1 = vi.fn().mockReturnValue('result1')
      const hook2 = vi.fn().mockReturnValue('result2')

      pluginSystem.registerHook('test-hook', hook1)
      pluginSystem.registerHook('test-hook', hook2)

      const results = await pluginSystem.executeHooks('test-hook', 'arg1', 'arg2')

      expect(hook1).toHaveBeenCalledWith('arg1', 'arg2')
      expect(hook2).toHaveBeenCalledWith('arg1', 'arg2')
      expect(results).toEqual(['result1', 'result2'])
    })

    it('should handle hook execution errors gracefully', async () => {
      const goodHook = vi.fn().mockReturnValue('good')
      const badHook = vi.fn().mockImplementation(() => {
        throw new Error('Hook failed')
      })

      pluginSystem.registerHook('error-hook', goodHook)
      pluginSystem.registerHook('error-hook', badHook)

      const results = await pluginSystem.executeHooks('error-hook', 'arg')

      expect(goodHook).toHaveBeenCalledWith('arg')
      expect(badHook).toHaveBeenCalledWith('arg')
      expect(results).toEqual(['good'])
    })

    it('should handle non-existent hooks', async () => {
      const results = await pluginSystem.executeHooks('non-existent-hook', 'arg')

      expect(results).toEqual([])
    })
  })

  describe('Domain Extensions', () => {
    it('should register domain extensions', () => {
      const extension = {
        resources: [
          {
            name: 'new-resource',
            displayName: 'New Resource',
            description: 'Additional resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'new-action',
            description: 'New action',
            category: 'Custom',
            requires: [],
            optional: [],
          },
        ],
      }

      pluginSystem.registerDomainExtension('test-domain', extension)

      const extensions = pluginSystem.getDomainExtensions('test-domain')
      expect(extensions).toHaveLength(1)
      expect(extensions[0]).toEqual(extension)
    })

    it('should apply domain extensions', () => {
      const domain = {
        name: 'test',
        resources: [
          {
            name: 'existing-resource',
            displayName: 'Existing Resource',
            description: 'Original resource',
            actions: ['create'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'existing-action',
            description: 'Existing action',
            category: 'Original',
            requires: [],
            optional: [],
          },
        ],
      }

      const extension = {
        resources: [
          {
            name: 'new-resource',
            displayName: 'New Resource',
            description: 'Additional resource',
            actions: ['list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'new-action',
            description: 'New action',
            category: 'Custom',
            requires: [],
            optional: [],
          },
        ],
      }

      pluginSystem.registerDomainExtension('test', extension)

      const extendedDomain = pluginSystem.applyDomainExtensions(domain)

      expect(extendedDomain.resources).toHaveLength(2)
      expect(extendedDomain.resources[0].name).toBe('existing-resource')
      expect(extendedDomain.resources[1].name).toBe('new-resource')
      expect(extendedDomain.actions).toHaveLength(2)
      expect(extendedDomain.actions[0].name).toBe('existing-action')
      expect(extendedDomain.actions[1].name).toBe('new-action')
    })

    it('should apply custom extension function', () => {
      const domain = {
        name: 'test',
        resources: [],
        actions: [],
      }

      const extension = {
        extend: (domain) => ({
          ...domain,
          metadata: { extended: true },
          customProperty: 'custom-value',
        }),
      }

      pluginSystem.registerDomainExtension('test', extension)

      const extendedDomain = pluginSystem.applyDomainExtensions(domain)

      expect(extendedDomain.metadata.extended).toBe(true)
      expect(extendedDomain.customProperty).toBe('custom-value')
    })

    it('should handle multiple extensions for same domain', () => {
      const domain = {
        name: 'test',
        resources: [],
        actions: [],
      }

      const extension1 = {
        resources: [
          {
            name: 'resource1',
            displayName: 'Resource 1',
            description: 'First resource',
            actions: ['create'],
            attributes: ['name'],
            relationships: [],
          },
        ],
      }

      const extension2 = {
        resources: [
          {
            name: 'resource2',
            displayName: 'Resource 2',
            description: 'Second resource',
            actions: ['list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
      }

      pluginSystem.registerDomainExtension('test', extension1)
      pluginSystem.registerDomainExtension('test', extension2)

      const extendedDomain = pluginSystem.applyDomainExtensions(domain)

      expect(extendedDomain.resources).toHaveLength(2)
      expect(extendedDomain.resources[0].name).toBe('resource1')
      expect(extendedDomain.resources[1].name).toBe('resource2')
    })
  })

  describe('Plugin Loading', () => {
    it('should load plugins from directory', async () => {
      // Create plugin directory and file
      await import('node:fs').then((fs) => fs.promises.mkdir(testPluginDir, { recursive: true }))
      await writeFile(
        testPluginFile,
        `export default {
        name: 'loaded-plugin',
        version: '1.0.0',
        description: 'Loaded plugin',
        domains: {
          loaded: {
            name: 'loaded',
            displayName: 'Loaded',
            description: 'Loaded domain',
            resources: [
              {
                name: 'loaded-resource',
                displayName: 'Loaded Resource',
                description: 'Loaded resource',
                actions: ['create', 'list'],
                attributes: ['name'],
                relationships: [],
              },
            ],
          },
        },
      }`,
        'utf8'
      )

      const loadedPlugins = await pluginSystem.loadPlugins({
        directory: testPluginDir,
      })

      expect(loadedPlugins).toHaveLength(1)
      expect(loadedPlugins[0]).toBe('loaded-plugin')
      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getPlugins()[0].name).toBe('loaded-plugin')
    })

    it('should load plugins recursively', async () => {
      const subDir = resolve(testPluginDir, 'subdir')
      const subPluginFile = resolve(subDir, 'sub.plugin.js')

      // Create plugin directory structure
      await import('node:fs').then((fs) => fs.promises.mkdir(testPluginDir, { recursive: true }))
      await import('node:fs').then((fs) => fs.promises.mkdir(subDir, { recursive: true }))

      await writeFile(
        testPluginFile,
        `export default {
        name: 'main-plugin',
        domains: { main: { name: 'main' } },
      }`,
        'utf8'
      )

      await writeFile(
        subPluginFile,
        `export default {
        name: 'sub-plugin',
        domains: { sub: { name: 'sub' } },
      }`,
        'utf8'
      )

      const loadedPlugins = await pluginSystem.loadPlugins({
        directory: testPluginDir,
        recursive: true,
      })

      expect(loadedPlugins).toHaveLength(2)
      expect(loadedPlugins).toContain('main-plugin')
      expect(loadedPlugins).toContain('sub-plugin')
    })

    it('should handle plugin loading errors gracefully', async () => {
      // Create plugin directory and file with syntax error
      await import('node:fs').then((fs) => fs.promises.mkdir(testPluginDir, { recursive: true }))
      await writeFile(testPluginFile, 'invalid javascript syntax', 'utf8')

      const loadedPlugins = await pluginSystem.loadPlugins({
        directory: testPluginDir,
      })

      expect(loadedPlugins).toHaveLength(0)
      expect(pluginSystem.getPlugins()).toHaveLength(0)
    })

    it('should handle missing plugin directory', async () => {
      const loadedPlugins = await pluginSystem.loadPlugins({
        directory: '/nonexistent/plugins',
      })

      expect(loadedPlugins).toHaveLength(0)
    })

    it('should find plugin files matching pattern', async () => {
      // Create plugin directory and files
      await import('node:fs').then((fs) => fs.promises.mkdir(testPluginDir, { recursive: true }))

      const pluginFile1 = resolve(testPluginDir, 'test.plugin.js')
      const pluginFile2 = resolve(testPluginDir, 'test.config.json')
      const pluginFile3 = resolve(testPluginDir, 'other.plugin.js')

      await writeFile(pluginFile1, `export default { name: 'plugin1' }`, 'utf8')
      await writeFile(pluginFile2, JSON.stringify({ name: 'config' }), 'utf8')
      await writeFile(pluginFile3, `export default { name: 'plugin3' }`, 'utf8')

      const files = await pluginSystem.findPluginFiles(testPluginDir, 'test.plugin.js', false)

      expect(files).toHaveLength(1)
      expect(files[0]).toBe(pluginFile1)
    })
  })

  describe('Built-in Plugins', () => {
    it('should have built-in plugins available', () => {
      expect(builtInPlugins.infrastructure).toBeDefined()
      expect(builtInPlugins.development).toBeDefined()
      expect(builtInPlugins.security).toBeDefined()
    })

    it('should load built-in plugins correctly', () => {
      const infraPlugin = builtInPlugins.infrastructure

      expect(infraPlugin.name).toBe('infrastructure')
      expect(infraPlugin.version).toBe('1.0.0')
      expect(infraPlugin.description).toBe('Infrastructure management domain')
      expect(infraPlugin.domains.infra).toBeDefined()
      expect(infraPlugin.domains.infra.resources).toHaveLength(5)
      expect(infraPlugin.domains.infra.resources[0].name).toBe('server')
    })

    it('should have proper domain structure in built-in plugins', () => {
      const devPlugin = builtInPlugins.development
      const devDomain = devPlugin.domains.dev

      expect(devDomain.name).toBe('dev')
      expect(devDomain.displayName).toBe('Development')
      expect(devDomain.description).toBe('Development and testing operations')
      expect(devDomain.category).toBe('development')
      expect(devDomain.compliance).toContain('SOC2')
      expect(devDomain.governance).toContain('RBAC')

      expect(devDomain.resources).toHaveLength(5)
      expect(devDomain.resources[0].name).toBe('project')
      expect(devDomain.resources[0].actions).toContain('create')
      expect(devDomain.resources[0].actions).toContain('list')

      expect(devDomain.actions).toHaveLength(8)
      expect(devDomain.actions[0].name).toBe('create')
      expect(devDomain.actions[0].category).toBe('CRUD')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty plugin', () => {
      const emptyPlugin = {
        name: 'empty-plugin',
      }

      pluginSystem.registerPlugin('empty-plugin', emptyPlugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getPlugins()[0].name).toBe('empty-plugin')
    })

    it('should handle plugin with no domains', () => {
      const noDomainPlugin = {
        name: 'no-domain-plugin',
        hooks: {
          'test-hook': () => 'test',
        },
      }

      pluginSystem.registerPlugin('no-domain-plugin', noDomainPlugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.hooks.has('test-hook')).toBe(true)
    })

    it('should handle domain with no resources', () => {
      const noResourcePlugin = {
        name: 'no-resource-plugin',
        domains: {
          empty: {
            name: 'empty',
            resources: [],
            actions: [],
          },
        },
      }

      pluginSystem.registerPlugin('no-resource-plugin', noResourcePlugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.domainExtensions.has('empty')).toBe(true)
    })

    it('should handle extension with no resources or actions', () => {
      const domain = {
        name: 'test',
        resources: [],
        actions: [],
      }

      const emptyExtension = {
        metadata: { empty: true },
      }

      pluginSystem.registerDomainExtension('test', emptyExtension)

      const extendedDomain = pluginSystem.applyDomainExtensions(domain)

      expect(extendedDomain.metadata.empty).toBe(true)
    })
  })
})
