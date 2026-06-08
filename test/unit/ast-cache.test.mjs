import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ASTCacheLayer } from '@un-test/coverage'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

/**
 * Unit Tests for AST Cache Layer (Updated for Async Unstorage)
 * Tests caching functionality, invalidation, and performance optimizations
 */

describe.sequential('ASTCacheLayer (Unit)', () => {
  const testCacheDir = join(process.cwd(), '.test-ast-cache')
  let cache

  beforeEach(async () => {
    // Clean up before each test
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true })
    }

    cache = new ASTCacheLayer({
      cacheDir: testCacheDir,
      ttl: 3600000, // 1 hour
      enabled: true,
      maxSize: 10,
      verbose: false,
    })
  })

  afterEach(async () => {
    // Clean up after each test
    if (cache) {
      await cache.clear()
    }
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true })
    }
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same content', () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'

      const key1 = cache.getCacheKey(filePath, content)
      const key2 = cache.getCacheKey(filePath, content)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different content', () => {
      const filePath = '/test/file.js'
      const content1 = 'const x = 1;'
      const content2 = 'const y = 2;'

      const key1 = cache.getCacheKey(filePath, content1)
      const key2 = cache.getCacheKey(filePath, content2)

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different file paths', () => {
      const content = 'const x = 1;'
      const filePath1 = '/test/file1.js'
      const filePath2 = '/test/file2.js'

      const key1 = cache.getCacheKey(filePath1, content)
      const key2 = cache.getCacheKey(filePath2, content)

      expect(key1).not.toBe(key2)
    })

    it('should normalize file paths in keys', () => {
      const content = 'const x = 1;'
      const key = cache.getCacheKey('/test/file.js', content)

      expect(key).toMatch(/^[a-z0-9_]+_[a-z0-9]+$/i)
    })
  })

  describe('Cache Hit/Miss Scenarios', () => {
    it('should return null on cache miss', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'

      const result = await cache.get(filePath, content)

      expect(result).toBeNull()
      expect(cache.stats.misses).toBe(1)
      expect(cache.stats.hits).toBe(0)
    })

    it('should return cached AST on cache hit', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program', body: [] }

      await cache.set(filePath, content, ast)
      const result = await cache.get(filePath, content)

      expect(result).toEqual(ast)
      expect(cache.stats.hits).toBe(1)
      expect(cache.stats.misses).toBe(0)
    })

    it('should handle multiple cache entries', async () => {
      const files = [
        { path: '/test/file1.js', content: 'const x = 1;', ast: { type: 'File1' } },
        { path: '/test/file2.js', content: 'const y = 2;', ast: { type: 'File2' } },
        { path: '/test/file3.js', content: 'const z = 3;', ast: { type: 'File3' } },
      ]

      for (const { path, content, ast } of files) {
        await cache.set(path, content, ast)
      }

      for (const { path, content, ast } of files) {
        const result = await cache.get(path, content)
        expect(result).toEqual(ast)
      }

      expect(cache.stats.hits).toBe(3)
    })
  })

  describe('TTL Expiration', () => {
    it('should expire cached entries after TTL', async () => {
      const shortTTLCache = new ASTCacheLayer({
        cacheDir: join(testCacheDir, 'short-ttl'),
        ttl: 100, // 100ms TTL
        enabled: true,
      })

      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      await shortTTLCache.set(filePath, content, ast)

      // Immediate get should hit
      let result = await shortTTLCache.get(filePath, content)
      expect(result).toEqual(ast)

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should miss after expiration
      result = await shortTTLCache.get(filePath, content)
      expect(result).toBeNull()
    })

    it('should not expire entries within TTL', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      await cache.set(filePath, content, ast)

      // Wait a bit but not past TTL
      await new Promise(resolve => setTimeout(resolve, 50))

      const result = await cache.get(filePath, content)
      expect(result).toEqual(ast)
    })
  })

  describe('Cache Size Limits', () => {
    it('should enforce maximum cache size', async () => {
      const maxSize = 3
      const maxSizeCache = new ASTCacheLayer({
        cacheDir: join(testCacheDir, 'max-size'),
        maxSize: maxSize,
        enabled: true,
      })

      // Add more entries than max size
      for (let i = 0; i < 5; i++) {
        await maxSizeCache.set(`/test/file${i}.js`, `const x = ${i};`, { type: `File${i}` })
      }

      // Check that size is exactly maxSize
      const stats = maxSizeCache.getStats()
      expect(stats.size).toBe(maxSize)
      expect(stats.evictions).toBe(2)
    })

    it('should evict oldest entries first', async () => {
      const smallCache = new ASTCacheLayer({
        cacheDir: join(testCacheDir, 'small'),
        maxSize: 2,
        enabled: true,
      })

      const file1 = { path: '/test/file1.js', content: 'const x = 1;', ast: { type: 'File1' } }
      const file2 = { path: '/test/file2.js', content: 'const y = 2;', ast: { type: 'File2' } }
      const file3 = { path: '/test/file3.js', content: 'const z = 3;', ast: { type: 'File3' } }

      await smallCache.set(file1.path, file1.content, file1.ast)
      await new Promise(resolve => setTimeout(resolve, 100))

      await smallCache.set(file2.path, file2.content, file2.ast)
      await new Promise(resolve => setTimeout(resolve, 100))

      await smallCache.set(file3.path, file3.content, file3.ast)

      // file1 should be evicted (oldest)
      const result1 = await smallCache.get(file1.path, file1.content)
      const result2 = await smallCache.get(file2.path, file2.content)
      const result3 = await smallCache.get(file3.path, file3.content)

      expect(result1).toBeNull()
      expect(result2).not.toBeNull()
      expect(result3).not.toBeNull()
      expect(smallCache.getStats().evictions).toBe(1)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      // Miss
      await cache.get(filePath, content)
      expect(cache.stats.misses).toBe(1)
      expect(cache.stats.hits).toBe(0)

      // Set and hit
      await cache.set(filePath, content, ast)
      await cache.get(filePath, content)
      expect(cache.stats.hits).toBe(1)
      expect(cache.stats.misses).toBe(1)
    })

    it('should calculate hit rate correctly', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      await cache.set(filePath, content, ast)

      // 3 hits, 2 misses = 60% hit rate
      await cache.get(filePath, content) // hit
      await cache.get(filePath, content) // hit
      await cache.get(filePath, content) // hit
      await cache.get('/other/file.js', 'other') // miss
      await cache.get('/another/file.js', 'another') // miss

      const stats = cache.getStats()
      expect(stats.hitRate).toBe('60.0%')
    })

    it('should provide complete statistics', () => {
      const stats = cache.getStats()

      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('evictions')
      expect(stats).toHaveProperty('enabled')
    })
  })

  describe('Cache Clear', () => {
    it('should clear all cached entries', async () => {
      await cache.set('/test/file1.js', 'content1', { type: 'File1' })
      await cache.set('/test/file2.js', 'content2', { type: 'File2' })

      await cache.clear()

      const result1 = await cache.get('/test/file1.js', 'content1')
      const result2 = await cache.get('/test/file2.js', 'content2')

      expect(result1).toBeNull()
      expect(result2).toBeNull()
      expect(cache.stats.hits).toBe(0)
      expect(cache.stats.misses).toBe(2)
    })

    it('should reset statistics on clear', async () => {
      await cache.set('/test/file.js', 'content', { type: 'File' })
      await cache.get('/test/file.js', 'content')

      await cache.clear()

      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  describe('Disabled Cache', () => {
    it('should not cache when disabled', async () => {
      const disabledCache = new ASTCacheLayer({
        enabled: false,
      })

      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      await disabledCache.set(filePath, content, ast)
      const result = await disabledCache.get(filePath, content)

      expect(result).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => cache.getCacheKey(null, null)).toThrow()
    })

    it('should handle empty strings', async () => {
      const result = await cache.get('', '')
      expect(result).toBeNull()

      await cache.set('', '', { type: 'Empty' })
      const cached = await cache.get('', '')
      expect(cached).toEqual({ type: 'Empty' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long file paths', async () => {
      const longPath = '/test/' + 'a'.repeat(100) + '.js'
      const content = 'const x = 1;'
      const ast = { type: 'Program' }

      await cache.set(longPath, content, ast)
      const result = await cache.get(longPath, content)

      expect(result).toEqual(ast)
    })

    it('should handle very large AST objects', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = 1;'
      const largeAST = {
        type: 'Program',
        body: Array(100).fill({ type: 'Node', value: 'test' }),
      }

      await cache.set(filePath, content, largeAST)
      const result = await cache.get(filePath, content)

      expect(result).toEqual(largeAST)
    })

    it('should handle special characters in content', async () => {
      const filePath = '/test/file.js'
      const content = 'const x = "😀🎉\\n\\t\\"special\\""'
      const ast = { type: 'Program' }

      await cache.set(filePath, content, ast)
      const result = await cache.get(filePath, content)

      expect(result).toEqual(ast)
    })
  })
})
