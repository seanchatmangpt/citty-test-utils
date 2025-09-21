import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

describe('README Installation and Requirements', () => {
  describe('Package Installation', () => {
    it('should have proper package.json', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // From README: npm install citty-test-utils
      expect(packageJson.name).toBe('citty-test-utils')
      expect(packageJson.version).toBeDefined()
      expect(packageJson.description).toBeDefined()
      expect(packageJson.license).toBe('MIT')
    })

    it('should have proper npm configuration', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Check npm-specific fields
      expect(packageJson.main).toBeDefined()
      expect(packageJson.type).toBe('module')
      expect(packageJson.engines).toBeDefined()
      expect(packageJson.engines.node).toBeDefined()
    })

    it('should have proper scripts', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // From README: Testing configuration
      expect(packageJson.scripts.test).toBeDefined()
      expect(packageJson.scripts['test:unit']).toBeDefined()
      expect(packageJson.scripts['test:integration']).toBeDefined()
      expect(packageJson.scripts['test:bdd']).toBeDefined()
      expect(packageJson.scripts['test:coverage']).toBeDefined()
    })
  })

  describe('Node.js Requirements', () => {
    it('should specify Node.js version requirement', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // From README: Node.js: >= 18.0.0
      expect(packageJson.engines.node).toBeDefined()
      expect(packageJson.engines.node).toMatch(/>=?\s*18/)
    })

    it('should have proper Node.js version in badges', () => {
      const readmeContent = readFileSync('./README.md', 'utf8')

      // From README: Node.js Version badge
      expect(readmeContent).toContain('node/v/citty-test-utils')
    })
  })

  describe('Docker Requirements', () => {
    it('should mention Docker requirement in README', () => {
      const readmeContent = readFileSync('./README.md', 'utf8')

      // From README: Docker: Required for cleanroom testing
      expect(readmeContent).toContain('Docker')
      expect(readmeContent).toContain('cleanroom')
    })

    it('should have Docker-related dependencies', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Check for Docker-related packages
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }

      // Should have testcontainers or similar Docker testing library
      const hasDockerTesting = Object.keys(allDeps).some(
        (dep) =>
          dep.includes('testcontainers') || dep.includes('docker') || dep.includes('container')
      )

      expect(hasDockerTesting).toBe(true)
    })
  })

  describe('Citty Requirements', () => {
    it('should mention Citty requirement in README', () => {
      const readmeContent = readFileSync('./README.md', 'utf8')

      // From README: Citty Project: Required for CLI testing
      expect(readmeContent).toContain('Citty')
      expect(readmeContent).toContain('CLI testing')
    })

    it('should have Citty as dependency', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Should have citty as a dependency (it's in devDependencies)
      expect(packageJson.devDependencies.citty).toBeDefined()
    })
  })

  describe('Testing Configuration', () => {
    it('should have vitest configuration', () => {
      // From README: Testing configuration with Vitest
      expect(existsSync('./vitest.config.mjs')).toBe(true)
    })

    it('should have proper test scripts', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // From README: Testing configuration
      expect(packageJson.scripts.test).toContain('vitest')
      expect(packageJson.scripts['test:unit']).toContain('vitest')
      expect(packageJson.scripts['test:integration']).toContain('vitest')
      expect(packageJson.scripts['test:bdd']).toContain('vitest')
    })

    it('should have coverage configuration', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // From README: Run with coverage
      expect(packageJson.scripts['test:coverage']).toContain('coverage')
    })
  })

  describe('Project Structure Requirements', () => {
    it('should have required directories', () => {
      // From README: Project setup
      expect(existsSync('./src')).toBe(true)
      expect(existsSync('./test')).toBe(true)
      expect(existsSync('./docs')).toBe(true)
      expect(existsSync('./playground')).toBe(true)
    })

    it('should have required files', () => {
      // From README: Project setup
      expect(existsSync('./package.json')).toBe(true)
      expect(existsSync('./README.md')).toBe(true)
      expect(existsSync('./LICENSE')).toBe(true)
      expect(existsSync('./CHANGELOG.md')).toBe(true)
    })
  })
})
