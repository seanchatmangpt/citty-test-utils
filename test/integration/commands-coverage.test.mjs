import { describe, it, expect } from 'vitest'
import { runLocalCitty } from '@un-test/runners-local'
import { resolve } from 'pathe'
import { existsSync, rmSync } from 'node:fs'

describe('CLI Commands Comprehensive Coverage', () => {
  const env = { TEST_CLI: 'true' }

  describe('Gen Commands', () => {
    it('should generate a project successfully', async () => {
      const name = `test-project-${Date.now()}`
      const result = await runLocalCitty(['gen', 'project', name], { env })
      
      result.expectSuccess()
        .expectOutput('Generated complete project')
        .expectOutput(name)

      // Cleanup
      const projectDir = result.stdout.match(/Location: (.*)/)?.[1]?.trim()
      if (projectDir && existsSync(projectDir)) {
        // rmSync(projectDir, { recursive: true, force: true })
      }
    })

    it('should generate a test template', async () => {
      const name = 'my-test'
      const result = await runLocalCitty(['gen', 'test', name], { env })
      result.expectSuccess().expectOutput('Generated test template')
    })

    it('should generate a scenario template', async () => {
      const name = 'my-scenario'
      const result = await runLocalCitty(['gen', 'scenario', name], { env })
      result.expectSuccess().expectOutput('Generated scenario template')
    })

    it('should generate a CLI template', async () => {
      const name = 'my-cli'
      const result = await runLocalCitty(['gen', 'cli', name], { env })
      result.expectSuccess().expectOutput('Generated CLI template')
    })
  })

  describe('Runner Commands', () => {
    it('should execute a command via runner', async () => {
      const result = await runLocalCitty(['runner', 'execute', 'echo "hello"'], { env })
      result.expectSuccess()
        .expectOutput('Command: echo "hello"')
        .expectOutput('hello')
    })
  })

  describe('Info Commands', () => {
    it('should show version information', async () => {
      const result = await runLocalCitty(['info', 'version'], { env })
      result.expectSuccess().expectOutput(/Version: \d+\.\d+\.\d+/)
    })

    it('should show features information', async () => {
      const result = await runLocalCitty(['info', 'features'], { env })
      result.expectSuccess().expectOutput('features information: pending')
    })

  describe('Analysis Commands', () => {
    it('should show analysis stats', async () => {
      const result = await runLocalCitty(['analysis', 'stats'], { env })
      result.expectSuccess()
      const output = result.stdout + result.stderr
      expect(output).toContain('Main Command')
      expect(output).toContain('Subcommands')
    })

    it('should generate analysis report', async () => {
      const result = await runLocalCitty(['analysis', 'report'], { env })
      result.expectSuccess()
      const output = result.stdout + result.stderr
      expect(output).toContain('Summary')
      expect(output).toContain('Overall')
    })

    it('should export analysis in JSON format', async () => {
      const outputPath = resolve('.ctu/coverage-test.json')
      const result = await runLocalCitty(['analysis', 'export', '--output', outputPath, '--format', 'json'], { env })
      result.expectSuccess()
      expect(existsSync(outputPath)).toBe(true)
    })
  })
  })
})
