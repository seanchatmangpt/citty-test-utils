#!/usr/bin/env node
/**
 * @fileoverview Discover CLI structure subcommand
 * @description Discover and analyze CLI structure using AST parsing for accurate results
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { SmartCLIDetector } from '../../core/utils/smart-cli-detector.js'
import {
  validateCLIPath,
  buildAnalysisMetadata,
  formatCLIDetection,
  buildReportHeader,
} from '../../core/utils/analysis-report-utils.js'
import { writeFileSync, existsSync } from 'fs'

export const discoverCommand = defineCommand({
  meta: {
    name: 'discover',
    description: '🔍 Discover CLI structure using AST parsing for accurate command extraction',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to CLI file to analyze',
      default: 'src/cli.mjs',
    },
    format: {
      type: 'string',
      description: 'Output format (text, json, yaml)',
      default: 'text',
    },
    output: {
      type: 'string',
      description: 'Output file path (optional)',
    },
    'include-imports': {
      type: 'boolean',
      description: 'Include detailed import analysis',
      default: true,
    },
    validate: {
      type: 'boolean',
      description: 'Validate CLI structure integrity',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable detailed output',
      default: false,
    },
    'include-patterns': {
      type: 'string',
      description: 'Comma-separated file patterns to include',
      default: '.test.mjs,.test.js,.spec.mjs,.spec.js',
    },
    'exclude-patterns': {
      type: 'string',
      description: 'Comma-separated patterns to exclude',
      default: 'node_modules,.git,coverage',
    },
  },
  run: async (ctx) => {
    const {
      'cli-path': cliPath,
      format,
      output,
      'include-imports': includeImports,
      validate,
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
    } = ctx.args

    try {
      // Smart CLI detection
      const detector = new SmartCLIDetector({ verbose })
      let detectedCLI = null
      let finalCLIPath = cliPath

      if (verbose) {
        console.log('🔍 Starting smart CLI detection...')
      }

      // If no CLI path specified, try to detect it
      if (!cliPath || cliPath === 'src/cli.mjs') {
        detectedCLI = await detector.detectCLI()

        if (detectedCLI && detectedCLI.cliPath) {
          finalCLIPath = detectedCLI.cliPath

          if (verbose) {
            console.log(`✅ Auto-detected CLI: ${finalCLIPath}`)
            console.log(`   Detection method: ${detectedCLI.detectionMethod}`)
            console.log(`   Confidence: ${detectedCLI.confidence}`)
            if (detectedCLI.packageName) {
              console.log(`   Package: ${detectedCLI.packageName}`)
            }
            if (detectedCLI.binName) {
              console.log(`   Bin name: ${detectedCLI.binName}`)
            }
          }
        } else {
          console.log('⚠️ No CLI auto-detected, using default path')
        }
      }

      // Validate final CLI path exists using shared utility
      validateCLIPath(finalCLIPath)

      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: finalCLIPath,
        testDir: 'test', // Not used for discovery, but required by analyzer
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        verbose,
      })

      if (verbose) {
        console.log('🔍 Starting CLI structure discovery...')
        console.log(`CLI Path: ${finalCLIPath}`)
        console.log(`Format: ${format}`)
        console.log(`Include Imports: ${includeImports}`)
        console.log(`Validate: ${validate}`)
      }

      // Discover CLI structure
      const cliHierarchy = await analyzer.discoverCLIStructureEnhanced({
        cliPath: finalCLIPath,
        verbose,
        includeImports,
        validate,
      })

      // Wrap in expected structure for report generation
      const cliStructure = {
        cliHierarchy: cliHierarchy,
        commands: new Map(), // Empty for backward compatibility
        globalOptions: new Map(), // Empty for backward compatibility
      }

      // Generate discovery report
      const discoveryReport = generateDiscoveryReport(cliStructure, {
        cliPath: finalCLIPath,
        format,
        includeImports,
        validate,
        verbose,
        detectedCLI,
      })

      if (output) {
        writeFileSync(output, discoveryReport)
        console.log(`✅ CLI structure discovery saved to: ${output}`)
      } else {
        console.log(discoveryReport)
      }
    } catch (error) {
      console.error(`❌ CLI structure discovery failed: ${error.message}`)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})

/**
 * Generate discovery report
 * @param {Object} cliStructure - Discovered CLI structure
 * @param {Object} options - Report options
 * @returns {string} Formatted discovery report
 */
function generateDiscoveryReport(cliStructure, options) {
  const { format, includeImports, validate, verbose, detectedCLI } = options

  switch (format.toLowerCase()) {
    case 'json':
      return generateJSONReport(cliStructure, options)
    case 'yaml':
      return generateYAMLReport(cliStructure, options)
    case 'text':
    default:
      return generateTextReport(cliStructure, options)
  }
}

/**
 * Generate text format discovery report
 * @param {Object} cliStructure - Discovered CLI structure
 * @param {Object} options - Report options
 * @returns {string} Text discovery report
 */
function generateTextReport(cliStructure, options) {
  const { cliPath, includeImports, validate, verbose, detectedCLI } = options
  const lines = []

  lines.push('🔍 CLI Structure Discovery Report')
  lines.push('='.repeat(40))
  lines.push('')

  // CLI Detection Info
  if (detectedCLI) {
    lines.push('🎯 CLI Detection:')
    lines.push(`  Method: ${detectedCLI.detectionMethod}`)
    lines.push(`  Confidence: ${detectedCLI.confidence}`)
    if (detectedCLI.packageName) {
      lines.push(`  Package: ${detectedCLI.packageName}`)
    }
    if (detectedCLI.binName) {
      lines.push(`  Bin Name: ${detectedCLI.binName}`)
    }
    lines.push('')
  }

  // Summary
  lines.push('📊 Discovery Summary:')
  lines.push(`  CLI Path: ${cliPath}`)
  
  // Handle new hierarchy structure
  if (cliStructure.cliHierarchy) {
    lines.push(`  Main Command: ${cliStructure.cliHierarchy.mainCommand.name}`)
    lines.push(`  Subcommands: ${cliStructure.cliHierarchy.subcommands.size}`)
    lines.push(`  Global Options: ${cliStructure.cliHierarchy.globalOptions.size}`)
  } else {
    // Handle old structure for backward compatibility
    lines.push(`  Commands: ${cliStructure.commands?.size || 0}`)
    lines.push(`  Global Options: ${cliStructure.globalOptions?.size || 0}`)
  }
  
  if (includeImports && cliStructure.imports) {
    lines.push(`  Imports: ${cliStructure.imports.size}`)
  }
  lines.push('')

  // Commands
  if (cliStructure.cliHierarchy) {
    // New hierarchy structure
    lines.push('📋 Discovered Commands:')
    lines.push(`  ${cliStructure.cliHierarchy.mainCommand.name}: ${cliStructure.cliHierarchy.mainCommand.description}`)
    
    if (cliStructure.cliHierarchy.subcommands.size > 0) {
      for (const [subPath, subCommand] of cliStructure.cliHierarchy.subcommands) {
        lines.push(`    ${subPath}: ${subCommand.description}`)
      }
    }
    lines.push('')
  } else if (cliStructure.commands && cliStructure.commands.size > 0) {
    lines.push('📋 Discovered Commands:')
    for (const [name, command] of cliStructure.commands) {
      const status = command.tested ? '✅' : '❌'
      lines.push(`  ${status} ${name}: ${command.description || 'No description'}`)

      // Subcommands
      if (command.subcommands && command.subcommands.size > 0) {
        for (const [subName, subcommand] of command.subcommands) {
          const subStatus = subcommand.tested ? '✅' : '❌'
          const imported = subcommand.imported ? ' (imported)' : ''
          lines.push(
            `    ${subStatus} ${name} ${subName}: ${
              subcommand.description || 'No description'
            }${imported}`
          )
        }
      }

      // Flags
      if (command.flags && command.flags.size > 0) {
        lines.push(`    Flags: ${command.flags.size}`)
        for (const [flagName, flag] of command.flags) {
          const flagStatus = flag.tested ? '✅' : '❌'
          lines.push(`      ${flagStatus} --${flagName}: ${flag.description || 'No description'}`)
        }
      }

      // Options
      if (command.options && command.options.size > 0) {
        lines.push(`    Options: ${command.options.size}`)
        for (const [optionName, option] of command.options) {
          const optionStatus = option.tested ? '✅' : '❌'
          lines.push(
            `      ${optionStatus} --${optionName}: ${option.description || 'No description'}`
          )
        }
      }
    }
    lines.push('')
  }

  // Global Options
  if (cliStructure.globalOptions.size > 0) {
    lines.push('🌐 Global Options:')
    for (const [name, option] of cliStructure.globalOptions) {
      const status = option.tested ? '✅' : '❌'
      const type = option.isFlag ? 'flag' : 'option'
      lines.push(`  ${status} --${name} (${type}): ${option.description || 'No description'}`)
    }
    lines.push('')
  }

  // Imports Analysis
  if (includeImports && cliStructure.imports) {
    lines.push('📦 Import Analysis:')
    for (const [localName, importInfo] of cliStructure.imports) {
      lines.push(`  ${localName}: ${importInfo.sourcePath}`)
      if (importInfo.commandName) {
        lines.push(`    → Command: ${importInfo.commandName}`)
      }
    }
    lines.push('')
  }

  // Validation Results
  if (validate && cliStructure.validation) {
    lines.push('✅ Validation Results:')
    lines.push(
      `  Structure Integrity: ${cliStructure.validation.integrity ? '✅ Passed' : '❌ Failed'}`
    )
    lines.push(
      `  Import Resolution: ${cliStructure.validation.imports ? '✅ Passed' : '❌ Failed'}`
    )
    lines.push(
      `  Command Consistency: ${cliStructure.validation.consistency ? '✅ Passed' : '❌ Failed'}`
    )
    if (cliStructure.validation.issues && cliStructure.validation.issues.length > 0) {
      lines.push('  Issues Found:')
      cliStructure.validation.issues.forEach((issue, index) => {
        lines.push(`    ${index + 1}. ${issue}`)
      })
    }
    lines.push('')
  }

  // Discovery Metadata
  if (verbose) {
    lines.push('ℹ️  Discovery Metadata:')
    lines.push(`  Analysis Method: AST-based`)
    lines.push(`  Discovered At: ${new Date().toISOString()}`)
    lines.push(`  CLI Path: ${cliPath}`)
    lines.push(`  Include Imports: ${includeImports}`)
    lines.push(`  Validation: ${validate}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate JSON format discovery report
 * @param {Object} cliStructure - Discovered CLI structure
 * @param {Object} options - Report options
 * @returns {string} JSON discovery report
 */
function generateJSONReport(cliStructure, options) {
  const { cliPath, includeImports, validate, verbose, detectedCLI } = options

  const report = {
    metadata: buildAnalysisMetadata({
      cliPath,
      additionalFields: {
        includeImports,
        validation: validate,
        verbose,
      },
    }),
    cliDetection: formatCLIDetection(detectedCLI),
    summary: {
      commands: cliStructure.commands.size,
      globalOptions: cliStructure.globalOptions.size,
      imports: includeImports && cliStructure.imports ? cliStructure.imports.size : 0,
    },
    commands: Object.fromEntries(cliStructure.commands),
    globalOptions: Object.fromEntries(cliStructure.globalOptions),
  }

  if (includeImports && cliStructure.imports) {
    report.imports = Object.fromEntries(cliStructure.imports)
  }

  if (validate && cliStructure.validation) {
    report.validation = cliStructure.validation
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Generate YAML format discovery report
 * @param {Object} cliStructure - Discovered CLI structure
 * @param {Object} options - Report options
 * @returns {string} YAML discovery report
 */
function generateYAMLReport(cliStructure, options) {
  const { cliPath, includeImports, validate, verbose } = options

  const report = {
    metadata: {
      discoveredAt: new Date().toISOString(),
      cliPath,
      analysisMethod: 'AST-based',
      includeImports,
      validation: validate,
      verbose,
    },
    summary: {
      commands: cliStructure.commands.size,
      globalOptions: cliStructure.globalOptions.size,
      imports: includeImports && cliStructure.imports ? cliStructure.imports.size : 0,
    },
    commands: Object.fromEntries(cliStructure.commands),
    globalOptions: Object.fromEntries(cliStructure.globalOptions),
  }

  if (includeImports && cliStructure.imports) {
    report.imports = Object.fromEntries(cliStructure.imports)
  }

  if (validate && cliStructure.validation) {
    report.validation = cliStructure.validation
  }

  // Simple YAML generation (in a real implementation, use a YAML library)
  return `metadata:
  discoveredAt: ${report.metadata.discoveredAt}
  cliPath: ${report.metadata.cliPath}
  analysisMethod: ${report.metadata.analysisMethod}
  includeImports: ${report.metadata.includeImports}
  validation: ${report.metadata.validation}
  verbose: ${report.metadata.verbose}

summary:
  commands: ${report.summary.commands}
  globalOptions: ${report.summary.globalOptions}
  imports: ${report.summary.imports}

commands:
${Object.entries(report.commands)
  .map(([name, cmd]) => `  ${name}: ${cmd.description || 'No description'}`)
  .join('\n')}

globalOptions:
${Object.entries(report.globalOptions)
  .map(([name, opt]) => `  ${name}: ${opt.description || 'No description'}`)
  .join('\n')}`
}
