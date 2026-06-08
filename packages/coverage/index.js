/**
 * @fileoverview Consolidated AST-Based CLI Coverage Analyzer with Caching
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'pathe'
import { parse } from 'acorn'
import { simple as walk } from 'acorn-walk'
import { consola } from '@un-test/core'
import { hash } from 'ohash'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { defu } from 'defu'

export class ASTAnalyzer {
  constructor(options = {}) {
    this.options = defu(options, { cliPath: 'src/cli.mjs', testDir: 'test', cacheDir: '.ctu/cache/ast', includePatterns: ['.test.mjs', '.test.js', '.spec.mjs', '.spec.js'], excludePatterns: ['node_modules', '.git', 'coverage'], verbose: false })
    this.storage = createStorage({ driver: fsDriver({ base: this.options.cacheDir }) })
  }

  async analyze(options = {}) {
    const opts = defu(options, this.options)
    try {
      const cliHierarchy = await this.getCachedCLIHierarchy(opts)
      const testPatterns = await this.getCachedTestPatterns(opts, cliHierarchy)
      const coverage = this.calculateCoverage(cliHierarchy, testPatterns)
      return this.generateReport(cliHierarchy, testPatterns, coverage, opts)
    } catch (error) {
      consola.error(`AST analysis failed: ${error.message}`)
      throw error
    }
  }

  async getCachedCLIHierarchy(opts) {
    const cliPath = resolve(opts.cliPath)
    if (!existsSync(cliPath)) throw new Error(`CLI not found: ${cliPath}`)
    const content = readFileSync(cliPath, 'utf8')
    const key = `hierarchy:${hash(content)}`
    const cached = await this.storage.getItem(key)
    if (cached) return cached
    const hierarchy = this.discoverCLIStructure(content, cliPath)
    await this.storage.setItem(key, hierarchy)
    return hierarchy
  }

  async getCachedTestPatterns(opts, cliHierarchy) {
    const testFiles = this.findTestFiles(opts.testDir, opts)
    if (testFiles.length === 0) return {}
    const key = `test-patterns:${hash(testFiles.join(','))}:${hash(cliHierarchy)}`
    const cached = await this.storage.getItem(key)
    if (cached) return cached
    const patterns = await this.discoverTestPatterns(testFiles, cliHierarchy)
    await this.storage.setItem(key, patterns)
    return patterns
  }

  discoverCLIStructure(content, cliPath) {
    const ast = this.parseSafe(content, cliPath)
    if (!ast) throw new Error(`Could not parse: ${cliPath}`)
    const h = { mainCommand: { name: 'ctu', description: '', options: [] }, subcommands: {} }
    const node = this.findMainCLIVariable(ast) || this.findLargestCommand(ast) || this.findDefaultExport(ast)
    if (node) {
      h.mainCommand.name = this.extractCommandName(node) || 'ctu'
      h.mainCommand.description = this.extractDescription(node) || ''
      this.buildSubcommandTree(node, h, h.mainCommand.name)
    }
    return h
  }

  calculateCoverage(h, p) {
    const name = h?.mainCommand?.name || 'ctu'
    const subs = h?.subcommands || {}
    const stats = {
      mainCommand: { tested: !!p[name], total: 1, percentage: 0 },
      subcommands: { tested: 0, total: Object.keys(subs).length, percentage: 0 },
      overall: { tested: 0, total: 0, percentage: 0 },
      flags: { tested: 0, total: 0, percentage: 0 },
      options: { tested: 0, total: 0, percentage: 0 }
    }
    for (const path of Object.keys(subs)) if (p[path]) stats.subcommands.tested++
    const c = (m) => { if (m) m.percentage = m.total > 0 ? (m.tested / m.total) * 100 : 0; return m }
    c(stats.mainCommand); c(stats.subcommands)
    stats.overall.total = stats.mainCommand.total + stats.subcommands.total
    stats.overall.tested = stats.mainCommand.tested + stats.subcommands.tested
    c(stats.overall)
    return { summary: stats, details: { untestedSubcommands: Object.keys(subs).filter(x => !p[x]), untestedCommands: [], untestedFlags: [], untestedOptions: [] } }
  }

  generateReport(h, p, coverage, opts) {
    return {
      metadata: { analyzedAt: new Date().toISOString(), cliPath: opts.cliPath, testDir: opts.testDir, analysisMethod: 'Optimized AST with Caching', totalTestFiles: this.findTestFiles(opts.testDir, opts).length, totalCommands: 1, totalSubcommands: Object.keys(h?.subcommands || {}).length, totalFlags: 0, totalOptions: 0 },
      coverage, recommendations: [], commands: h?.subcommands || {}
    }
  }

  generateTextReport(report) {
    const s = report.coverage.summary
    return [
      '🚀 Optimized AST-Based CLI Test Coverage Analysis',
      '='.repeat(50),
      '',
      '📈 Summary:',
      `  Main Command: ${s.mainCommand.tested ? '✅' : '❌'} (${s.mainCommand.percentage.toFixed(1)}%)`,
      `  Subcommands:  ${s.subcommands.tested}/${s.subcommands.total} (${s.subcommands.percentage.toFixed(1)}%)`,
      `  Overall:      ${s.overall.tested}/${s.overall.total} (${s.overall.percentage.toFixed(1)}%)`,
      '',
      'ℹ️  Analysis Info:',
      `  CLI Path: ${report.metadata.cliPath}`,
      `  Test Dir: ${report.metadata.testDir}`
    ].join('\n')
  }

  async formatReport(report, opts = {}) { return opts.format === 'json' ? JSON.stringify(report, null, 2) : this.generateTextReport(report) }

  parseSafe(c, p) { try { const sc = c.startsWith('#!') ? c.substring(c.indexOf('\n')+1) : c; return parse(sc, { ecmaVersion: 2022, sourceType: 'module', allowReturnOutsideFunction: true, allowImportExportEverywhere: true, allowAwaitOutsideFunction: true }) } catch { return null } }
  findTestFiles(d, o) {
    if (!existsSync(d)) return []
    let res = []
    try { for (const f of readdirSync(d)) { const p = join(d, f), s = statSync(p); if (s.isDirectory()) { if (!o.excludePatterns.some(x => p.includes(x))) res = res.concat(this.findTestFiles(p, o)) } else if (o.includePatterns.some(x => f.endsWith(x))) res.push(p) } } catch {}
    return res
  }

  async discoverTestPatterns(files, h) {
    const patterns = new Map()
    for (const f of files) {
      try {
        const c = readFileSync(f, 'utf8'), a = this.parseSafe(c, f)
        if (!a) continue
        walk(a, { CallExpression: (n) => {
          const p = this.recognizeTestPattern(n, h)
          if (p?.commandPath) { if (!patterns.has(p.commandPath)) patterns.set(p.commandPath, { testFiles: new Set() }); patterns.get(p.commandPath).testFiles.add(f) }
        }})
      } catch {}
    }
    const res = {}
    for (const [p, d] of patterns) res[p] = { testFiles: Array.from(d.testFiles) }
    return res
  }

  recognizeTestPattern(n, h) {
    const name = n.callee?.name || n.callee?.property?.name
    if (!['runCitty', 'runLocalCitty', 'runLocalCittySafe'].includes(name)) return null
    let args = []
    const first = n.arguments[0]
    if (first?.type === 'ArrayExpression') args = first.elements.filter(e => e?.type === 'Literal').map(e => String(e.value))
    else if (first?.type === 'Literal' && typeof first.value === 'string') args = first.value.trim().split(/\s+/)
    else if (first?.type === 'ObjectExpression') {
      const ap = first.properties.find(p => (p.key.name || p.key.value) === 'args')
      if (ap?.value?.type === 'ArrayExpression') args = ap.value.elements.filter(e => e?.type === 'Literal').map(e => String(e.value))
    }
    const main = h?.mainCommand?.name || 'ctu'
    if (args.length === 0) return { commandPath: main }
    if (args.length >= 2 && h?.subcommands && h.subcommands[`${main} ${args[0]} ${args[1]}`]) return { commandPath: `${main} ${args[0]} ${args[1]}` }
    if (args.length >= 1 && h?.subcommands && h.subcommands[`${main} ${args[0]}`]) return { commandPath: `${main} ${args[0]}` }
    return { commandPath: main }
  }

  getPropertyKey(p) { return p.key?.name || p.key?.value }
  isDefineCommand(n) { return n?.type === 'CallExpression' && n.callee.name === 'defineCommand' }
  findMainCLIVariable(a) { let node = null; walk(a, { VariableDeclaration: (n) => { for (const d of n.declarations) if (d.init && this.isDefineCommand(d.init)) node = d.init } }); return node }
  findLargestCommand(a) { let node = null, max = -1; walk(a, { CallExpression: (n) => { if (this.isDefineCommand(n)) { const sub = n.arguments?.[0]?.properties?.find(p => this.getPropertyKey(p) === 'subCommands'); const c = sub?.value?.properties?.length || 0; if (c > max) { max = c; node = n } } } }); return node }
  findDefaultExport(a) { let node = null; walk(a, { ExportDefaultDeclaration: (d) => { if (this.isDefineCommand(d.declaration)) node = d.declaration } }); return node }
  extractCommandName(n) { return n.arguments?.[0]?.properties?.find(p => this.getPropertyKey(p) === 'meta')?.value?.properties?.find(p => this.getPropertyKey(p) === 'name')?.value?.value }
  extractDescription(n) { return n.arguments?.[0]?.properties?.find(p => this.getPropertyKey(p) === 'meta')?.value?.properties?.find(p => this.getPropertyKey(p) === 'description')?.value?.value }
  buildSubcommandTree(n, h, parent) {
    const sub = n.arguments?.[0]?.properties?.find(p => this.getPropertyKey(p) === 'subCommands')
    if (sub?.value?.properties) {
      for (const p of sub.value.properties) {
        const name = this.getPropertyKey(p), path = `${parent} ${name}`
        h.subcommands[path] = { name, description: this.extractDescription(p.value) || '' }
        if (this.isDefineCommand(p.value)) this.buildSubcommandTree(p.value, h, path)
      }
    }
  }
}

/**
 * AST Cache Layer with content-based invalidation (Unstorage version)
 */
export class ASTCacheLayer {
  constructor(options = {}) {
    this.options = defu(options, {
      cacheDir: '.ctu/cache/ast',
      ttl: 3600000,
      enabled: true,
      maxSize: 100,
      verbose: false
    })

    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0
    }

    if (this.options.enabled) {
      this.storage = createStorage({
        driver: fsDriver({ base: this.options.cacheDir })
      })
    }
  }

  getCacheKey(filePath, content) {
    if (filePath === null || content === null) {
       throw new Error('Invalid input')
    }
    const contentHash = hash(content).slice(0, 16)
    const normalizedPath = String(filePath).replace(/[^a-z0-9]/gi, '_')
    return `${normalizedPath}_${contentHash}`
  }

  async get(filePath, content) {
    if (!this.options.enabled) return null
    const key = this.getCacheKey(filePath, content)
    
    try {
      const cached = await this.storage.getItem(key)
      if (cached) {
        if (Date.now() - cached.timestamp < this.options.ttl) {
          this.stats.hits++
          return cached.ast
        } else {
          await this.storage.removeItem(key)
          this.stats.size--
        }
      }
    } catch (error) {
       // Corrupted or other error
    }
    
    this.stats.misses++
    return null
  }

  async set(filePath, content, ast) {
    if (!this.options.enabled) return
    const key = this.getCacheKey(filePath, content)
    
    const cacheData = {
      timestamp: Date.now(),
      filePath,
      ast
    }
    
    const alreadyExists = await this.storage.hasItem(key)
    if (!alreadyExists) {
      await this.enforceMaxSize()
    }
    
    await this.storage.setItem(key, cacheData)
    if (!alreadyExists) {
      this.stats.size++
    }
  }

  async enforceMaxSize() {
    const keys = await this.storage.getKeys()
    if (keys.length >= this.options.maxSize) {
      const items = await Promise.all(keys.map(async k => {
        try {
          const item = await this.storage.getItem(k)
          return { key: k, timestamp: item?.timestamp || 0 }
        } catch {
          return { key: k, timestamp: 0 }
        }
      }))
      
      items.sort((a, b) => a.timestamp - b.timestamp)
      
      while (items.length >= this.options.maxSize) {
        const oldest = items.shift()
        await this.storage.removeItem(oldest.key)
        this.stats.evictions++
        this.stats.size--
      }
    }
  }

  async clear() {
    if (this.storage) {
      await this.storage.clear()
    }
    this.stats = { hits: 0, misses: 0, size: 0, evictions: 0 }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0
      ? (this.stats.hits / total * 100).toFixed(1)
      : "0.0"

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      enabled: this.options.enabled
    }
  }

  printStats() {
    const stats = this.getStats()
    console.log('\n📊 AST Cache Statistics:')
    console.log(`   Hits: ${stats.hits}`)
    console.log(`   Misses: ${stats.misses}`)
    console.log(`   Hit Rate: ${stats.hitRate}`)
    console.log(`   Cached ASTs: ${stats.size}`)
    console.log(`   Enabled: ${stats.enabled}`)
    console.log('')
  }
}

export * from './helpers.js'
export { CLCoverageAnalyzer } from './cli-coverage-analyzer.js'

