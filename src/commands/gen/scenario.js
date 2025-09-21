#!/usr/bin/env node
// src/commands/gen/scenario.js - Gen scenario verb command

import { defineCommand } from 'citty'
import nunjucks from 'nunjucks'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getEnvironmentPaths } from '../../core/utils/environment-detection.js'

export const scenarioCommand = defineCommand({
  meta: {
    name: 'scenario',
    description: 'Generate scenario template',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name for the generated scenario file',
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
      console.error(`Generating scenario template: ${name}.${format}`)
      console.error(`Output: ${output}`)
      console.error(`Import path: ${importPath}`)
    }

    try {
      // Configure nunjucks
      nunjucks.configure(join(process.cwd(), 'templates'), {
        autoescape: false,
        throwOnUndefined: true,
      })

      // Generate scenario in environment-appropriate directory
      const paths = getEnvironmentPaths({
        output,
        tempPrefix: 'citty-scenario',
        filename: `${name}.scenario.${format}`,
      })

      const outputDir = paths.fullTempDir
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true })
      }

      // Generate scenario file
      const templateFile = 'scenario/custom.scenario.njk'
      const outputFile = join(outputDir, `${name}.scenario.${format}`)
      const templateData = {
        name,
        title: `${name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Scenario`,
        description: description || `Custom scenario for ${name}`,
        format,
        importPath,
        steps: [
          {
            name: 'Execute command',
            type: testType,
            args: "['--help']",
            cwd: '.',
            timeout,
            expectedOutput: 'USAGE|COMMANDS',
            expectations: ['expectSuccess()', 'expectOutput(/USAGE|COMMANDS/)', 'expectNoStderr()'],
          },
        ],
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
        template: 'scenario',
        name,
        output: outputFile,
        format,
        status: 'success',
        message: `Scenario template generated successfully`,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        console.log(`✅ Generated scenario template: ${name}.${format}`)
        console.log(`📁 Location: ${outputFile}`)
        console.log(`🌍 Environment: ${paths.environment}`)

        if (paths.isCleanroom) {
          console.log(`🐳 Note: File created in cleanroom container at ${outputFile}`)
          console.log(`⚠️  File will be cleaned up when container is destroyed`)
        } else {
          console.log(
            `⚠️  Note: This is a temporary directory that will be cleaned up automatically`
          )
          console.log(`🧹 Cleanup scheduled for: ${paths.fullTempDir}`)
        }
        console.log(`📄 Template: ${templateFile}`)
        console.log(`🎯 Status: ${result.status}`)
      }
    } catch (error) {
      const errorResult = {
        template: 'scenario',
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
        console.error(`❌ Failed to generate scenario template: ${name}.${format}`)
        console.error(`Error: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
