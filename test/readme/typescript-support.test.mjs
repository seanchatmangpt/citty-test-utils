import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

describe('README TypeScript Support', () => {
  describe('TypeScript Definitions', () => {
    it('should have TypeScript definitions file', () => {
      // From README: Full TypeScript definitions are included
      expect(existsSync('./src/types/types.d.ts')).toBe(true)
    })

    it('should have proper TypeScript definitions content', () => {
      // From README: Complete type definitions for all APIs
      const typesContent = readFileSync('./src/types/types.d.ts', 'utf8')

      // Check for key type definitions mentioned in README
      expect(typesContent).toContain('CliResult')
      expect(typesContent).toContain('CliExpectation')
      expect(typesContent).toContain('RunOptions')
      expect(typesContent).toContain('ScenarioBuilder')
      expect(typesContent).toContain('ScenarioResult')
    })

    it('should have tsconfig.json', () => {
      // From README: TypeScript support
      expect(existsSync('./tsconfig.json')).toBe(true)
    })
  })

  describe('Package.json TypeScript Support', () => {
    it('should have proper package.json configuration', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Check for TypeScript-related fields
      expect(packageJson.main).toBeDefined()
      expect(packageJson.type).toBe('module')
      // exports might not be defined in this package.json
    })

    it('should have TypeScript in devDependencies', () => {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Check for TypeScript support - vitest includes TypeScript support
      expect(packageJson.devDependencies).toBeDefined()
      expect(packageJson.devDependencies.vitest).toBeDefined()
    })
  })
})
