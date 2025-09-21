#!/usr/bin/env node
// test/unit/cli-analyzer.test.mjs - CLI Analyzer Unit Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CLIAnalyzer } from '../../src/core/discovery/cli-analyzer.js'
import { writeFile, existsSync } from 'node:fs/promises'
import { resolve } from 'node:path'

describe('CLI Analyzer Unit Tests', () => {
  let analyzer
  let testCLIPath

  beforeEach(async () => {
    analyzer = new CLIAnalyzer()
    testCLIPath = resolve(process.cwd(), 'test-cli-analyzer.js')
  })

  afterEach(async () => {
    try {
      if (existsSync(testCLIPath)) {
        await import('node:fs').then(fs => fs.promises.unlink(testCLIPath))
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Command Pattern Parsing', () => {
    it('should parse three-part commands correctly', () => {
      const result = analyzer.parseCommandLine('infra server create <name> [options]')
      
      expect(result.domain).toBe('infra')
      expect(result.resource).toBe('server')
      expect(result.action).toBe('create')
      expect(result.fullCommand).toBe('infra')
    })

    it('should parse two-part commands correctly', () => {
      const result = analyzer.parseCommandLine('infra server [options]')
      
      expect(result.domain).toBe('infra')
      expect(result.resource).toBe('server')
      expect(result.action).toBe(null)
    })

    it('should parse single-part commands correctly', () => {
      const result = analyzer.parseCommandLine('infra [options]')
      
      expect(result.domain).toBe('infra')
      expect(result.resource).toBe(null)
      expect(result.action).toBe(null)
    })

    it('should handle resource-action patterns', () => {
      const result = analyzer.parseCommandLine('server create <name>')
      
      expect(result.domain).toBe(null)
      expect(result.resource).toBe('server')
      expect(result.action).toBe('create')
    })

    it('should return null for unrecognized patterns', () => {
      const result = analyzer.parseCommandLine('invalid command pattern')
      
      expect(result).toBe(null)
    })
  })

  describe('Action Detection', () => {
    it('should identify common CRUD actions', () => {
      expect(analyzer.isLikelyAction('create')).toBe(true)
      expect(analyzer.isLikelyAction('list')).toBe(true)
      expect(analyzer.isLikelyAction('show')).toBe(true)
      expect(analyzer.isLikelyAction('update')).toBe(true)
      expect(analyzer.isLikelyAction('delete')).toBe(true)
    })

    it('should identify operational actions', () => {
      expect(analyzer.isLikelyAction('start')).toBe(true)
      expect(analyzer.isLikelyAction('stop')).toBe(true)
      expect(analyzer.isLikelyAction('restart')).toBe(true)
      expect(analyzer.isLikelyAction('deploy')).toBe(true)
      expect(analyzer.isLikelyAction('backup')).toBe(true)
    })

    it('should identify configuration actions', () => {
      expect(analyzer.isLikelyAction('configure')).toBe(true)
      expect(analyzer.isLikelyAction('setup')).toBe(true)
      expect(analyzer.isLikelyAction('init')).toBe(true)
    })

    it('should not identify resource names as actions', () => {
      expect(analyzer.isLikelyAction('server')).toBe(false)
      expect(analyzer.isLikelyAction('database')).toBe(false)
      expect(analyzer.isLikelyAction('network')).toBe(false)
      expect(analyzer.isLikelyAction('user')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(analyzer.isLikelyAction('CREATE')).toBe(true)
      expect(analyzer.isLikelyAction('Create')).toBe(true)
      expect(analyzer.isLikelyAction('SERVER')).toBe(false)
    })
  })

  describe('Description Extraction', () => {
    it('should extract descriptions after double spaces', () => {
      const description = analyzer.extractDescription('infra server create <name>    Create a new server')
      expect(description).toBe('Create a new server')
    })

    it('should extract descriptions after dashes', () => {
      const description = analyzer.extractDescription('infra server create <name> - Create a new server')
      expect(description).toBe('Create a new server')
    })

    it('should return empty string when no description found', () => {
      const description = analyzer.extractDescription('infra server create <name>')
      expect(description).toBe('')
    })
  })

  describe('Help Output Parsing', () => {
    it('should parse standard help output format', () => {
      const helpOutput = `USAGE:
  cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  dev project create <name> [options]     Create a new project
  dev project list [options]              List projects
`

      const result = analyzer.parseHelpOutput(helpOutput)
      
      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.dev).toContain('project')
      expect(result.actions).toContain('create')
      expect(result.actions).toContain('list')
    })

    it('should handle alternative command section headers', () => {
      const helpOutput = `USAGE:
  cli <command> [options]

AVAILABLE COMMANDS:
  infra server create <name> [options]    Create a new server
  dev project create <name> [options]     Create a new project
`

      const result = analyzer.parseHelpOutput(helpOutput)
      
      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
    })

    it('should ignore lines before commands section', () => {
      const helpOutput = `This is a CLI tool for managing infrastructure.

USAGE:
  cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
`

      const result = analyzer.parseHelpOutput(helpOutput)
      
      expect(result.domains).toContain('infra')
      expect(result.domains).not.toContain('This')
      expect(result.domains).not.toContain('USAGE')
    })

    it('should handle empty help output', () => {
      const result = analyzer.parseHelpOutput('')
      
      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
      expect(result.actions).toHaveLength(0)
      expect(result.commands).toEqual({})
    })

    it('should handle help output without commands section', () => {
      const helpOutput = `This is a CLI tool.
No commands section here.
`

      const result = analyzer.parseHelpOutput(helpOutput)
      
      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
      expect(result.actions).toHaveLength(0)
    })
  })

  describe('CLI Analysis', () => {
    it('should analyze CLI from help output', async () => {
      const helpOutput = `USAGE:
  cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  dev project create <name> [options]     Create a new project
`

      const result = await analyzer.analyzeFromCLI(null, helpOutput)
      
      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.dev).toContain('project')
    })

    it('should analyze CLI from file', async () => {
      await writeFile(testCLIPath, `#!/usr/bin/env node
console.log(\`USAGE:
  cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
\`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
`, 'utf8')

      const result = await analyzer.analyzeFromCLI(testCLIPath)
      
      expect(result.domains).toContain('infra')
      expect(result.resources.infra).toContain('server')
    })

    it('should handle CLI analysis errors gracefully', async () => {
      const result = await analyzer.analyzeFromCLI('/nonexistent/cli.js')
      
      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
      expect(result.actions).toHaveLength(0)
    })
  })

  describe('Package.json Analysis', () => {
    it('should analyze package.json scripts', async () => {
      const packageJsonPath = resolve(process.cwd(), 'test-package.json')
      
      await writeFile(packageJsonPath, JSON.stringify({
        name: 'test-cli',
        scripts: {
          'infra:server:create': 'echo "Creating server"',
          'infra:server:list': 'echo "Listing servers"',
          'dev:project:create': 'echo "Creating project"',
          'dev:project:list': 'echo "Listing projects"',
        },
      }, null, 2), 'utf8')

      try {
        const result = await analyzer.analyzeFromPackageJson(packageJsonPath)
        
        expect(result.domains).toContain('infra')
        expect(result.domains).toContain('dev')
        expect(result.commands['infra:server:create']).toBeDefined()
        expect(result.commands['dev:project:create']).toBeDefined()
      } finally {
        await import('node:fs').then(fs => fs.promises.unlink(packageJsonPath))
      }
    })

    it('should handle package.json without scripts', async () => {
      const packageJsonPath = resolve(process.cwd(), 'test-package-empty.json')
      
      await writeFile(packageJsonPath, JSON.stringify({
        name: 'test-cli',
      }, null, 2), 'utf8')

      try {
        const result = await analyzer.analyzeFromPackageJson(packageJsonPath)
        
        expect(result.domains).toHaveLength(0)
        expect(result.commands).toEqual({})
      } finally {
        await import('node:fs').then(fs => fs.promises.unlink(packageJsonPath))
      }
    })

    it('should handle invalid package.json gracefully', async () => {
      const result = await analyzer.analyzeFromPackageJson('/nonexistent/package.json')
      
      expect(result.domains).toHaveLength(0)
      expect(result.commands).toEqual({})
    })
  })

  describe('Configuration Analysis', () => {
    it('should analyze configuration file', async () => {
      const configPath = resolve(process.cwd(), 'test-config.json')
      
      await writeFile(configPath, JSON.stringify({
        domains: {
          infra: {
            resources: ['server', 'network'],
          },
          dev: {
            resources: ['project', 'app'],
          },
        },
        actions: ['create', 'list', 'show'],
      }, null, 2), 'utf8')

      try {
        const result = await analyzer.analyzeFromConfig(configPath)
        
        expect(result.domains).toContain('infra')
        expect(result.domains).toContain('dev')
        expect(result.resources.infra).toContain('server')
        expect(result.resources.infra).toContain('network')
        expect(result.actions).toContain('create')
        expect(result.actions).toContain('list')
        expect(result.actions).toContain('show')
      } finally {
        await import('node:fs').then(fs => fs.promises.unlink(configPath))
      }
    })

    it('should handle configuration without domains', async () => {
      const configPath = resolve(process.cwd(), 'test-config-empty.json')
      
      await writeFile(configPath, JSON.stringify({
        name: 'test-config',
      }, null, 2), 'utf8')

      try {
        const result = await analyzer.analyzeFromConfig(configPath)
        
        expect(result.domains).toHaveLength(0)
        expect(result.resources).toEqual({})
      } finally {
        await import('node:fs').then(fs => fs.promises.unlink(configPath))
      }
    })

    it('should handle invalid configuration gracefully', async () => {
      const result = await analyzer.analyzeFromConfig('/nonexistent/config.json')
      
      expect(result.domains).toHaveLength(0)
      expect(result.resources).toEqual({})
    })
  })

  describe('Caching', () => {
    it('should cache analysis results', async () => {
      const helpOutput = `COMMANDS:
  infra server create <name> [options]    Create a new server
`

      // First call
      const result1 = await analyzer.analyzeFromCLI(null, helpOutput)
      
      // Second call should use cache
      const result2 = await analyzer.analyzeFromCLI(null, helpOutput)
      
      expect(result1).toEqual(result2)
      expect(analyzer.getCacheStats().size).toBeGreaterThan(0)
    })

    it('should clear cache', async () => {
      const helpOutput = `COMMANDS:
  infra server create <name> [options]    Create a new server
`

      await analyzer.analyzeFromCLI(null, helpOutput)
      expect(analyzer.getCacheStats().size).toBeGreaterThan(0)
      
      analyzer.clearCache()
      expect(analyzer.getCacheStats().size).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed command lines', () => {
      const result = analyzer.parseCommandLine('')
      expect(result).toBe(null)
    })

    it('should handle commands with special characters', () => {
      const result = analyzer.parseCommandLine('infra server create <name> [options] --verbose')
      
      expect(result.domain).toBe('infra')
      expect(result.resource).toBe('server')
      expect(result.action).toBe('create')
    })

    it('should handle very long command lines', () => {
      const longCommand = 'infra server create ' + 'a'.repeat(1000) + ' [options]'
      const result = analyzer.parseCommandLine(longCommand)
      
      expect(result.domain).toBe('infra')
      expect(result.resource).toBe('server')
      expect(result.action).toBe('create')
    })

    it('should handle help output with mixed case', () => {
      const helpOutput = `COMMANDS:
  INFRA SERVER CREATE <name> [options]    Create a new server
  Dev Project Create <name> [options]      Create a new project
`

      const result = analyzer.parseHelpOutput(helpOutput)
      
      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
    })
  })
})
