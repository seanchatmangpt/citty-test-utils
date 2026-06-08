import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const filesToParse = [
  'packages/core/src/utils/logging.js',
  'packages/core/src/assertions/snapshot.js',
  'packages/core/src/assertions/assertions.js',
  'packages/core/src/utils/environment-detection.js'
]

/**
 * Extracts JSDoc comments and associated declarations
 */
function parseFile(filePath) {
  const fullPath = resolve(rootDir, filePath)
  if (!existsSync(fullPath)) {
    console.warn(`File not found: ${filePath}`)
    return []
  }

  const content = readFileSync(fullPath, 'utf8')
  const results = []

  // Match JSDoc blocks
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g
  let match
  while ((match = jsdocRegex.exec(content)) !== null) {
    const comment = match[1]
      .split('\n')
      .map(line => line.trim().replace(/^\* ?/, '').replace(/\*\/$/, ''))
      .filter(line => line.length > 0 && line !== '/')
      .join(' ')
      .trim()

    // Look at what follows the JSDoc
    const afterComment = content.slice(jsdocRegex.lastIndex)
    const declarationMatch = afterComment.match(/^\s*(?:export\s+)?(?:async\s+)?(function|class|const|let)\s+(\w+)/)

    if (declarationMatch) {
      const type = declarationMatch[1]
      const name = declarationMatch[2]
      results.push({ name, type, description: comment, file: filePath })
    }
  }

  return results
}

// Add some placeholder docs if we don't find enough
const placeholders = [
  {
    name: 'runCitty',
    type: 'function',
    description: 'The main entry point for running CLI tests. Automatically detects the environment and chooses between local and cleanroom (Docker) execution.',
    file: 'packages/core/src/index.js'
  },
  {
    name: 'scenario',
    type: 'function',
    description: 'Creates a new multi-step test scenario with a fluent API for defining steps and assertions.',
    file: 'packages/core/src/index.js'
  }
]

console.log('Generating API Reference...')
const extractedDocs = filesToParse.flatMap(parseFile)
const allDocs = [...placeholders, ...extractedDocs]

// Deduplicate by name
const seen = new Set()
const uniqueDocs = allDocs.filter(doc => {
  if (seen.has(doc.name)) return false
  seen.add(doc.name)
  return true
})

let apiRef = '## API Reference\n\n'
apiRef += 'This section provides an overview of the core API functions and classes. These docs are partially generated from source JSDoc comments.\n\n'

for (const doc of uniqueDocs) {
  apiRef += `### \`${doc.name}\` (${doc.type})\n\n`
  apiRef += `${doc.description}\n\n`
  if (doc.file) {
    apiRef += `*Defined in: \`${doc.file}\`*\n\n`
  }
}

const readmePath = resolve(rootDir, 'README.md')
if (existsSync(readmePath)) {
  let readmeContent = readFileSync(readmePath, 'utf8')

  // Remove existing API Reference if any
  const apiRefRegex = /## API Reference[\s\S]*?(?=## |$)/
  if (apiRefRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(apiRefRegex, apiRef)
    console.log('Updated existing API Reference section.')
  } else {
    // Append before Acknowledgments or at the end
    const ackRegex = /## 🙏 Acknowledgments/
    if (ackRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(ackRegex, `${apiRef}\n## 🙏 Acknowledgments`)
      console.log('Inserted API Reference before Acknowledgments.')
    } else {
      readmeContent += `\n${apiRef}`
      console.log('Appended API Reference to the end of README.md.')
    }
  }

  writeFileSync(readmePath, readmeContent)
  console.log('Successfully updated README.md')
} else {
  console.error('README.md not found')
}
