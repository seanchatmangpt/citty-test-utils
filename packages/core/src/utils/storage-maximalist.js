import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'
import { createTarGzip } from 'nanotar'
import { writeFileSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { resolve, relative } from 'pathe'

/**
 * StorageMaximalist - A unified storage and archival utility.
 * Combines unstorage for multi-driver persistence and nanotar for environment packaging.
 */
export class StorageMaximalist {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.base] - Base directory for the fs driver
   */
  constructor(options = {}) {
    this.storage = createStorage()
    
    // Mount memory driver for ephemeral data
    this.storage.mount('memory', memoryDriver())
    
    // Mount fs driver for persistent data
    this.storage.mount('fs', fsDriver({
      base: options.base || process.cwd()
    }))
  }

  /**
   * Reads a directory recursively and creates a gzipped tarball.
   * @param {string} dir - Source directory to package
   * @param {string} outPath - Destination path for the .tar.gz file
   */
  async packageEnvironment(dir, outPath) {
    const files = []
    const absoluteDir = resolve(dir)

    const scan = (currentDir) => {
      const entries = readdirSync(currentDir)
      for (const entry of entries) {
        const fullPath = resolve(currentDir, entry)
        const stats = statSync(fullPath)
        
        if (stats.isDirectory()) {
          scan(fullPath)
        } else if (stats.isFile()) {
          files.push({
            name: relative(absoluteDir, fullPath),
            data: readFileSync(fullPath)
          })
        }
      }
    }

    scan(absoluteDir)
    const tarData = await createTarGzip(files)
    writeFileSync(resolve(outPath), tarData)
    
    return {
      path: resolve(outPath),
      fileCount: files.length,
      size: tarData.length
    }
  }
}
