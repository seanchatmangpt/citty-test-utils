#!/usr/bin/env node
// src/commands/gen/cli.js - Gen cli verb command

import { defineCommand } from 'citty'
import nunjucks from 'nunjucks'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const cliCommand = defineCommand({
  meta: {
    name: 'cli',
    description: 'Generate CLI template',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name for the generated CLI file',
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
    'cli-name': {
      type: 'string',
      description: 'CLI name for CLI templates',
      default: '',
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
    const {
      name,
      output,
      format,
      'cli-name': cliName,
      version,
      description,
      overwrite,
      json,
      verbose,
    } = ctx.args

    if (verbose) {
      console.error(`Generating CLI template: ${name}.${format}`)
      console.error(`Output: ${output}`)
      console.error(`CLI name: ${cliName || name}`)
    }

    try {
      // Configure nunjucks
      nunjucks.configure(join(process.cwd(), 'templates'), {
        autoescape: false,
        throwOnUndefined: true,
      })

      // Ensure output directory exists
      const outputDir = join(process.cwd(), output)
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true })
      }

      // Generate CLI file
      const templateFile = 'cli/basic.cli.njk'
      const outputFile = join(outputDir, `${name}.cli.${format}`)
      const templateData = {
        name: name.replace(/-/g, ''),
        cliName: cliName || name,
        version,
        description: description || `CLI for ${name}`,
        format,
        args: [],
        subCommands: [
          {
            name: 'help',
            description: 'Show help information',
            args: [],
            logic: `const result = {
  message: 'Help for ${cliName || name}',
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

      // Check if file exists and handle overwrite
      if (existsSync(outputFile) && !overwrite) {
        throw new Error(`File ${outputFile} already exists. Use --overwrite to replace it.`)
      }

      // Render template
      const content = nunjucks.render(templateFile, templateData)

      // Write file
      await writeFile(outputFile, content)

      const result = {
        template: 'cli',
        name,
        output: outputFile,
        format,
        status: 'success',
        message: `CLI template generated successfully`,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        console.log(`✅ Generated CLI template: ${name}.${format}`)
        console.log(`📁 Location: ${outputFile}`)
        console.log(`📄 Template: ${templateFile}`)
        console.log(`🎯 Status: ${result.status}`)
      }
    } catch (error) {
      const errorResult = {
        template: 'cli',
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
        console.error(`❌ Failed to generate CLI template: ${name}.${format}`)
        console.error(`Error: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
