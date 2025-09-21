#!/usr/bin/env node
// src/commands/generate/project.js - Generate project verb command

import { defineCommand } from 'citty'
import nunjucks from 'nunjucks'
import { writeFile, mkdir, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getEnvironmentPaths } from '../../core/utils/environment-detection.js'

// Enhanced error handling for file operations
async function safeMkdir(dirPath, options = {}) {
  try {
    await mkdir(dirPath, { recursive: true, ...options })
    return true
  } catch (error) {
    if (error.code === 'EEXIST') {
      return true // Directory already exists
    }
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`)
  }
}

async function safeWriteFile(filePath, content, options = {}) {
  try {
    // Check if file exists and we don't want to overwrite
    if (existsSync(filePath) && !options.overwrite) {
      throw new Error(`File ${filePath} already exists. Use --overwrite to replace it.`)
    }
    
    // Check disk space (basic check)
    await access(filePath.substring(0, filePath.lastIndexOf('/')), 'w')
    
    await writeFile(filePath, content, { encoding: 'utf8', ...options })
    return true
  } catch (error) {
    if (error.code === 'ENOSPC') {
      throw new Error(`Insufficient disk space to write ${filePath}`)
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied writing to ${filePath}`)
    }
    if (error.code === 'ENOENT') {
      throw new Error(`Directory does not exist for ${filePath}`)
    }
    throw new Error(`Failed to write file ${filePath}: ${error.message}`)
  }
}

// Template validation
function validateTemplate(templatePath, templateData) {
  const errors = []
  
  if (!existsSync(templatePath)) {
    errors.push(`Template file not found: ${templatePath}`)
    return errors
  }
  
  // Check for required template variables
  const requiredVars = ['name', 'version']
  for (const varName of requiredVars) {
    if (!templateData[varName]) {
      errors.push(`Required template variable missing: ${varName}`)
    }
  }
  
  return errors
}

export const projectCommand = defineCommand({
  meta: {
    name: 'project',
    description: 'Generate complete project structure',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name for the generated project',
      required: true,
    },
    output: {
      type: 'string',
      description: 'Output directory',
      default: '.',
    },
    format: {
      type: 'string',
      description: 'Output format (js, mjs, ts)',
      default: 'mjs',
    },
    version: {
      type: 'string',
      description: 'Version for generated files',
      default: '1.0.0',
    },
    description: {
      type: 'string',
      description: 'Description for generated files',
      default: '',
    },
    overwrite: {
      type: 'boolean',
      description: 'Overwrite existing files',
      default: false,
    },
  },
  run: async (ctx) => {
    const { name, output, format, version, description, overwrite, json, verbose } = ctx.args

    if (verbose) {
      console.error(`Generating project: ${name}`)
      console.error(`Output: ${output}`)
    }

    try {
      // Configure nunjucks
      nunjucks.configure(join(process.cwd(), 'templates'), {
        autoescape: false,
        throwOnUndefined: true,
      })

      // Generate a complete project structure in environment-appropriate directory
      const paths = getEnvironmentPaths({
        output,
        tempPrefix: 'citty-project',
        filename: name,
      })

      const projectDir = join(paths.fullTempDir, name)
      if (!existsSync(projectDir)) {
        await safeMkdir(projectDir)
        await safeMkdir(join(projectDir, 'src'))
        await safeMkdir(join(projectDir, 'tests'))
      }

      // In cleanroom, ensure files stay isolated and don't pollute the main project
      const isCleanroom = paths.isCleanroom
      if (isCleanroom && verbose) {
        console.error(`🐳 Cleanroom detected: Generating in isolated directory ${projectDir}`)
      }

      // Generate package.json
      const packageJsonTemplate = 'config/package.json.njk'
      const packageJsonFile = join(projectDir, 'package.json')
      
      // Validate template
      const templateErrors = validateTemplate(join(process.cwd(), 'templates', packageJsonTemplate), {
        name,
        version,
        description: description || `CLI project: ${name}`,
        format
      })
      if (templateErrors.length > 0) {
        throw new Error(`Template validation failed: ${templateErrors.join(', ')}`)
      }
      
      const packageJsonData = {
        name,
        version,
        description: description || `CLI project: ${name}`,
        main: `src/${name}.${format}`,
        scripts: [
          { name: 'test', command: 'vitest' },
          { name: 'test:watch', command: 'vitest --watch' },
          { name: 'test:coverage', command: 'vitest --coverage' },
          { name: 'dev', command: `node src/${name}.${format}` },
        ],
        dependencies: [
          { name: 'citty', version: '^0.1.6' },
          { name: 'citty-test-utils', version: '^0.2.3' },
        ],
        devDependencies: [
          { name: 'vitest', version: '^1.0.0' },
          { name: '@vitest/coverage-v8', version: '^1.0.0' },
        ],
        keywords: ['cli', 'testing', 'citty'],
        author: 'Generated by citty-test-utils',
        license: 'MIT',
        cittyTestUtils: {
          testEnvironment: 'local',
          timeout: 10000,
          scenarios: ['help', 'version'],
        },
      }

      // Generate CLI file
      const cliTemplate = 'cli/basic.cli.njk'
      const cliFile = join(projectDir, `src/${name}.${format}`)
      const cliData = {
        name: name.replace(/-/g, ''),
        cliName: name,
        version,
        description: description || `CLI project: ${name}`,
        format,
        args: [],
        subCommands: [
          {
            name: 'help',
            description: 'Show help information',
            args: [],
            logic: `const result = {
  message: 'Help for ${name}',
  version: '${version}',
  timestamp: new Date().toISOString(),
}

if (json) {
  console.log(JSON.stringify(result))
} else {
  console.log(result.message)
}`,
          },
        ],
      }

      // Generate test file
      const testTemplate = 'test/basic.test.njk'
      const testFile = join(projectDir, `tests/${name}.test.${format}`)
      const testData = {
        name,
        description: `Tests for ${name}`,
        format,
        importPath: 'citty-test-utils',
        testType: 'local',
        environment: 'local',
        timeout: 10000,
        testName: `should show help`,
        args: "['--help']",
        cwd: '.',
        expectedOutput: 'USAGE|COMMANDS',
        expectations: ['expectSuccess()', 'expectOutput(/USAGE|COMMANDS/)', 'expectNoStderr()'],
      }

      // Generate vitest config
      const vitestTemplate = 'config/vitest.config.njk'
      const vitestFile = join(projectDir, 'vitest.config.mjs')
      const vitestData = {
        environment: 'node',
        timeout: 10000,
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html', 'json'],
          thresholds: [
            { type: 'lines', value: 80 },
            { type: 'functions', value: 80 },
            { type: 'branches', value: 80 },
            { type: 'statements', value: 80 },
          ],
        },
        globals: true,
        include: ['tests/**/*.test.*'],
        exclude: ['node_modules/**', 'dist/**'],
      }

      // Render all templates
      const packageJsonContent = nunjucks.render(packageJsonTemplate, packageJsonData)
      const cliContent = nunjucks.render(cliTemplate, cliData)
      const testContent = nunjucks.render(testTemplate, testData)
      const vitestContent = nunjucks.render(vitestTemplate, vitestData)

      // Write all files
      await safeWriteFile(packageJsonFile, packageJsonContent, { overwrite })
      await safeWriteFile(cliFile, cliContent, { overwrite })
      await safeWriteFile(testFile, testContent, { overwrite })
      await safeWriteFile(vitestFile, vitestContent, { overwrite })

      const result = {
        template: 'project',
        name,
        output: projectDir,
        files: [
          'package.json',
          `src/${name}.${format}`,
          `tests/${name}.test.${format}`,
          'vitest.config.mjs',
        ],
        status: 'success',
        message: `Complete project generated in ${projectDir}`,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        console.log(`✅ Generated complete project: ${name}`)
        console.log(`📁 Location: ${projectDir}`)
        console.log(`🌍 Environment: ${paths.environment}`)

        if (paths.isCleanroom) {
          console.log(`🐳 Note: Files created in cleanroom container at ${projectDir}`)
          console.log(`⚠️  Files will be cleaned up when container is destroyed`)
        } else {
          console.log(
            `⚠️  Note: This is a temporary directory that will be cleaned up automatically`
          )
          console.log(`🧹 Cleanup scheduled for: ${paths.fullTempDir}`)
        }
        console.log(`📄 Files created:`)
        result.files.forEach((file) => console.log(`   - ${file}`))
        console.log(`🚀 Next steps:`)
        console.log(`   cd ${name}`)
        console.log(`   npm install`)
        console.log(`   npm test`)
      }
    } catch (error) {
      const errorResult = {
        template: 'project',
        name,
        output,
        format,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(errorResult))
      } else {
        console.error(`❌ Failed to generate project: ${name}`)
        console.error(`Error: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
