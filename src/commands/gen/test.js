#!/usr/bin/env node
// src/commands/gen/test.js - Gen test verb command

import { defineCommand } from 'citty'
import nunjucks from 'nunjucks'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getEnvironmentPaths } from '../../core/utils/environment-detection.js'

export const testCommand = defineCommand({
  meta: {
    name: 'test',
    description: 'Generate test file template',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name for the generated test file',
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
    'import-path': {
      type: 'string',
      description: 'Import path for dependencies',
      default: 'citty-test-utils',
    },
    'test-type': {
      type: 'string',
      description: 'Test type (local, cleanroom, scenario)',
      default: 'local',
    },
    environment: {
      type: 'string',
      description: 'Test environment (local, cleanroom)',
      default: 'local',
    },
    timeout: {
      type: 'number',
      description: 'Test timeout in milliseconds',
      default: 10000,
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
    const {
      name,
      output,
      format,
      'import-path': importPath,
      'test-type': testType,
      environment,
      timeout,
      description,
      overwrite,
      json,
      verbose,
    } = ctx.args

    if (verbose) {
      console.error(`Generating test template: ${name}.${format}`)
      console.error(`Output: ${output}`)
      console.error(`Import path: ${importPath}`)
    }

    try {
      // Configure nunjucks
      nunjucks.configure(join(process.cwd(), 'templates'), {
        autoescape: false,
        throwOnUndefined: true,
      })

      // Generate test in environment-appropriate directory
      const paths = getEnvironmentPaths({ 
        output, 
        tempPrefix: 'citty-test',
        filename: `${name}.test.${format}` 
      })
      
      const outputDir = paths.fullTempDir
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true })
      }

      // Generate test file
      const templateFile = 'test/basic.test.njk'
      const outputFile = join(outputDir, `${name}.test.${format}`)
      const templateData = {
        name,
        description: description || `Test for ${name}`,
        format,
        importPath,
        testType,
        environment,
        timeout,
        testName: `should ${name.replace(/-/g, ' ')}`,
        args: "['--help']",
        cwd: '.',
        expectedOutput: 'USAGE|COMMANDS',
        expectations: ['expectSuccess()', 'expectOutput(/USAGE|COMMANDS/)', 'expectNoStderr()'],
      }

      // Check if file exists and handle overwrite
      if (existsSync(outputFile) && !overwrite) {
        throw new Error(`File ${outputFile} already exists. Use --overwrite to replace it.`)
      }

      // Render template
      const content = nunjucks.render(templateFile, templateData)

      // Write file
      await writeFile(outputFile, content)

      const result = {
        template: 'test',
        name,
        output: outputFile,
        format,
        status: 'success',
        message: `Test template generated successfully`,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        console.log(`✅ Generated test template: ${name}.${format}`)
        console.log(`📁 Location: ${outputFile}`)
        console.log(`🌍 Environment: ${paths.environment}`)
        
        if (paths.isCleanroom) {
          console.log(`🐳 Note: File created in cleanroom container at ${outputFile}`)
          console.log(`⚠️  File will be cleaned up when container is destroyed`)
        } else {
          console.log(`⚠️  Note: This is a temporary directory that will be cleaned up automatically`)
          
          // Schedule cleanup after a delay to allow inspection (only in local environment)
          setTimeout(async () => {
            try {
              const { rm } = await import('node:fs/promises')
              await rm(paths.fullTempDir, { recursive: true, force: true })
              console.log(`🧹 Cleaned up temporary directory: ${paths.fullTempDir}`)
            } catch (error) {
              console.warn(`⚠️  Could not clean up temporary directory: ${error.message}`)
            }
          }, 30000) // Clean up after 30 seconds
        }
        console.log(`📄 Template: ${templateFile}`)
        console.log(`🎯 Status: ${result.status}`)
      }
    } catch (error) {
      const errorResult = {
        template: 'test',
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
        console.error(`❌ Failed to generate test template: ${name}.${format}`)
        console.error(`Error: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
