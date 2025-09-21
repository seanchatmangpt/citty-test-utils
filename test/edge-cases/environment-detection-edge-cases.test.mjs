#!/usr/bin/env node
// test/edge-cases/environment-detection-edge-cases.test.mjs - Comprehensive edge case testing

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  detectCleanroomEnvironment,
  isCleanroomEnvironment,
  getWorkingDirectoryInfo,
  getTempDirectoryInfo,
  getEnvironmentPaths,
  validateContainerHealth,
  createSafeTempDirName,
  sanitizeFilename,
} from '../../src/core/utils/enhanced-environment-detection.js'

describe('Environment Detection Edge Cases', () => {
  let originalEnv
  let originalPlatform
  let originalArch

  beforeEach(() => {
    originalEnv = { ...process.env }
    originalPlatform = process.platform
    originalArch = process.arch
  })

  afterEach(() => {
    process.env = originalEnv
    Object.defineProperty(process, 'platform', { value: originalPlatform })
    Object.defineProperty(process, 'arch', { value: originalArch })
  })

  describe('Container Runtime Detection', () => {
    it('should detect Docker containers', () => {
      process.env.CITTY_DISABLE_DOMAIN_DISCOVERY = 'true'

      const detection = detectCleanroomEnvironment()

      expect(detection.isCleanroom).toBe(true)
      expect(detection.confidence).toBeGreaterThan(30)
      expect(detection.indicators).toContain('CITTY_DISABLE_DOMAIN_DISCOVERY=true')
    })

    it('should detect Podman containers', () => {
      process.env.PODMAN_CONTAINER = 'true'

      const detection = detectCleanroomEnvironment()

      expect(detection.isCleanroom).toBe(true)
      expect(detection.runtime).toBe('podman')
      expect(detection.indicators).toContain('PODMAN_CONTAINER=true')
    })

    it('should detect Kubernetes pods', () => {
      process.env.KUBERNETES_SERVICE_HOST = '10.96.0.1'

      const detection = detectCleanroomEnvironment()

      expect(detection.isCleanroom).toBe(true)
      expect(detection.indicators).toContain('KUBERNETES_SERVICE_HOST=10.96.0.1')
    })

    it('should handle false positives in development', () => {
      process.env.CITTY_DISABLE_DOMAIN_DISCOVERY = 'true'
      process.env.NODE_ENV = 'development'

      const detection = detectCleanroomEnvironment()

      expect(detection.warnings).toContain(
        'Environment variable detected in development/CI - may be false positive'
      )
      expect(detection.confidence).toBeLessThan(30)
    })

    it('should handle CI environment edge case', () => {
      process.env.CITTY_DISABLE_DOMAIN_DISCOVERY = 'true'
      process.env.CI = 'true'

      const detection = detectCleanroomEnvironment()

      expect(detection.warnings).toContain(
        'Environment variable detected in development/CI - may be false positive'
      )
    })
  })

  describe('Platform-Specific Edge Cases', () => {
    it('should handle Windows containers', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })

      const detection = detectCleanroomEnvironment()

      expect(detection.platform).toBe('win32')
      expect(detection.architecture).toBeDefined()
    })

    it('should handle ARM64 architecture', () => {
      Object.defineProperty(process, 'arch', { value: 'arm64' })

      const detection = detectCleanroomEnvironment()

      expect(detection.architecture).toBe('arm64')
    })
  })

  describe('File System Edge Cases', () => {
    it('should handle read-only filesystems', () => {
      // Mock filesystem access
      const mockAccessSync = vi.fn().mockImplementation((path, mode) => {
        if (path === '/app' && mode === 2) {
          // W_OK
          throw new Error('EACCES: permission denied')
        }
      })

      vi.doMock('node:fs', () => ({
        accessSync: mockAccessSync,
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue(''),
      }))

      const workingDirInfo = getWorkingDirectoryInfo()

      expect(workingDirInfo.warnings).toContain('Cleanroom path /app is not writable')
      expect(workingDirInfo.path).toBe('/tmp')
    })

    it('should handle missing temp directories', () => {
      const mockAccessSync = vi.fn().mockImplementation((path, mode) => {
        if (path === '/tmp' && mode === 2) {
          // W_OK
          throw new Error('ENOENT: no such file or directory')
        }
      })

      vi.doMock('node:fs', () => ({
        accessSync: mockAccessSync,
        existsSync: vi.fn().mockReturnValue(false),
        readFileSync: vi.fn().mockReturnValue(''),
      }))

      const tempDirInfo = getTempDirectoryInfo()

      expect(tempDirInfo.warnings).toContain('Cleanroom /tmp is not writable')
      expect(tempDirInfo.path).toBe('/var/tmp')
    })
  })

  describe('Filename Sanitization Edge Cases', () => {
    it('should handle special characters in filenames', () => {
      const problematicNames = [
        'file<>:"/\\|?*.txt',
        'file with spaces.mjs',
        'file-with-dashes.js',
        'file.with.dots.ts',
        'file_with_underscores.json',
        'file-with-very-long-name-that-exceeds-normal-limits-and-should-be-truncated-appropriately-with-extension.txt',
        '',
        null,
        undefined,
        123,
        {},
        [],
      ]

      for (const name of problematicNames) {
        const sanitized = sanitizeFilename(name)
        expect(sanitized).toBeDefined()
        expect(typeof sanitized).toBe('string')
        expect(sanitized.length).toBeGreaterThan(0)
        expect(sanitized.length).toBeLessThanOrEqual(200)
        expect(sanitized).not.toMatch(/[<>:"/\\|?*]/)
      }
    })

    it('should handle Unicode filenames', () => {
      const unicodeNames = [
        'файл.txt',
        '文件.js',
        'ファイル.mjs',
        'café.js',
        'naïve.txt',
        'résumé.json',
      ]

      for (const name of unicodeNames) {
        const sanitized = sanitizeFilename(name)
        expect(sanitized).toBeDefined()
        expect(sanitized.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Resource Constraint Edge Cases', () => {
    it('should detect low memory scenarios', () => {
      const mockReadFileSync = vi.fn().mockImplementation((path) => {
        if (path === '/proc/meminfo') {
          return 'MemTotal: 500000 kB\nMemAvailable: 50000 kB'
        }
        return ''
      })

      vi.doMock('node:fs', () => ({
        readFileSync: mockReadFileSync,
        existsSync: vi.fn().mockReturnValue(true),
        accessSync: vi.fn(),
      }))

      const detection = detectCleanroomEnvironment()

      expect(detection.indicators).toContain('Limited memory: 0.5GB')
    })

    it('should handle memory info read failures', () => {
      const mockReadFileSync = vi.fn().mockImplementation((path) => {
        if (path === '/proc/meminfo') {
          throw new Error('ENOENT: no such file or directory')
        }
        return ''
      })

      vi.doMock('node:fs', () => ({
        readFileSync: mockReadFileSync,
        existsSync: vi.fn().mockReturnValue(true),
        accessSync: vi.fn(),
      }))

      const detection = detectCleanroomEnvironment()

      expect(detection.warnings).toContain('Could not read memory status')
    })
  })

  describe('Container Health Validation', () => {
    it('should validate healthy container', () => {
      const mockAccessSync = vi.fn() // All paths accessible
      const mockReadFileSync = vi.fn().mockReturnValue('MemAvailable: 1000000 kB')

      vi.doMock('node:fs', () => ({
        accessSync: mockAccessSync,
        readFileSync: mockReadFileSync,
        existsSync: vi.fn().mockReturnValue(true),
      }))

      const health = validateContainerHealth()

      expect(health.healthy).toBe(true)
      expect(health.message).toBe('Container appears healthy')
    })

    it('should detect unhealthy container', () => {
      const mockAccessSync = vi.fn().mockImplementation((path) => {
        if (path === '/app') {
          throw new Error('EACCES: permission denied')
        }
      })

      vi.doMock('node:fs', () => ({
        accessSync: mockAccessSync,
        readFileSync: vi.fn().mockReturnValue(''),
        existsSync: vi.fn().mockReturnValue(true),
      }))

      const health = validateContainerHealth()

      expect(health.healthy).toBe(false)
      expect(health.message).toBe('Critical path /app is not accessible')
    })

    it('should detect low memory warnings', () => {
      const mockReadFileSync = vi.fn().mockImplementation((path) => {
        if (path === '/proc/meminfo') {
          return 'MemAvailable: 50000 kB' // Very low memory
        }
        return ''
      })

      vi.doMock('node:fs', () => ({
        readFileSync: mockReadFileSync,
        accessSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
      }))

      const health = validateContainerHealth()

      expect(health.warnings).toContain('Low memory available: 48.8MB')
    })
  })

  describe('Concurrent Operations Edge Cases', () => {
    it('should handle concurrent environment detection', async () => {
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(detectCleanroomEnvironment())
      )

      const results = await Promise.all(promises)

      // All results should be consistent
      const firstResult = results[0]
      for (const result of results) {
        expect(result.isCleanroom).toBe(firstResult.isCleanroom)
        expect(result.confidence).toBe(firstResult.confidence)
      }
    })

    it('should generate unique temp directory names', () => {
      const names = Array.from({ length: 100 }, () => createSafeTempDirName())
      const uniqueNames = new Set(names)

      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle filesystem errors gracefully', () => {
      const mockReadFileSync = vi.fn().mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory')
      })

      vi.doMock('node:fs', () => ({
        readFileSync: mockReadFileSync,
        existsSync: vi.fn().mockReturnValue(false),
        accessSync: vi.fn(),
      }))

      const detection = detectCleanroomEnvironment()

      expect(detection.warnings).toContain('Could not read cgroup information')
      expect(detection.warnings).toContain('Could not read mount information')
      expect(detection.isCleanroom).toBe(false)
    })

    it('should handle permission errors gracefully', () => {
      const mockAccessSync = vi.fn().mockImplementation(() => {
        throw new Error('EACCES: permission denied')
      })

      vi.doMock('node:fs', () => ({
        accessSync: mockAccessSync,
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue(''),
      }))

      const workingDirInfo = getWorkingDirectoryInfo()

      expect(workingDirInfo.warnings).toContain('Local path . is not writable')
      expect(workingDirInfo.path).toBeDefined()
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with isCleanroomEnvironment', () => {
      process.env.CITTY_DISABLE_DOMAIN_DISCOVERY = 'true'

      const legacyResult = isCleanroomEnvironment()
      const enhancedResult = detectCleanroomEnvironment()

      expect(legacyResult).toBe(enhancedResult.isCleanroom)
    })

    it('should work with existing getEnvironmentPaths calls', () => {
      const paths = getEnvironmentPaths({
        output: '.',
        tempPrefix: 'test',
        filename: 'test-file.mjs',
      })

      expect(paths.isCleanroom).toBeDefined()
      expect(paths.workingDir).toBeDefined()
      expect(paths.tempDir).toBeDefined()
      expect(paths.fullTempDir).toBeDefined()
      expect(paths.filename).toBeDefined()
      expect(paths.environment).toBeDefined()
    })
  })
})

