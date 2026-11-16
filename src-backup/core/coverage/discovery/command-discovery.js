import { consola } from '../utils/logging.js'
/**
 * @fileoverview Command Discovery Module
 * @description Discovers CLI commands and their subcommands by parsing help output
 */

import { execSync } from 'child_process'
import { HelpParser } from '../parsers/help-parser.js'

/**
 * Command Discovery Module
 * Handles discovery of CLI commands and subcommands
 */
export class CommandDiscovery {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      ...options,
    }
    this.helpParser = new HelpParser({ verbose: this.options.verbose })
    this.commands = new Map()
  }

  /**
   * Discover all commands by parsing CLI help output
   * @param {Object} options - Discovery options
   */
  async discoverCommands(options) {
    if (options.verbose) {
      console.log('📋 Discovering CLI commands...')
    }

    try {
      // Get main help output by running the specific CLI file
      const cliPath = options.cliPath || 'src/cli.mjs'
      const env = { ...process.env }
      if (options.useTestCli) {
        env.TEST_CLI = 'true'
      }

      if (options.verbose) {
        console.log(`🔍 Running CLI: ${cliPath}`)
      }

      const helpText = execSync(`node ${cliPath} --help`, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        timeout: 10000,
      })

      if (options.verbose) {
        console.log('🔍 CLI execution successful, stdout length:', helpText.length)
      }
      const parsed = this.helpParser.parseHelpOutput(helpText)

      // Store commands and global options
      this.commands = parsed.commands
      this.globalOptions = parsed.globalOptions

      // Get help for each discovered command to find subcommands and arguments
      for (const [commandName, command] of this.commands) {
        if (options.verbose) {
          console.log(`🔍 Processing command: ${commandName}`)
        }

        if (command.hasSubcommands) {
          await this.discoverSubcommands(commandName, options)
        }
        await this.discoverCommandDetails(commandName, options)
      }

      if (options.verbose) {
        console.log(`📋 Discovered ${this.commands.size} commands`)
      }
    } catch (error) {
      throw new Error(`Command discovery failed: ${error.message}`)
    }
  }

  /**
   * Discover subcommands for a specific command
   * @param {string} commandName - Name of the command
   * @param {Object} options - Discovery options
   */
  async discoverSubcommands(commandName, options) {
    try {
      const cliPath = options.cliPath || 'src/cli.mjs'
      const env = { ...process.env }
      if (options.useTestCli) {
        env.TEST_CLI = 'true'
      }

      const helpText = execSync(`node ${cliPath} ${commandName} --help`, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        timeout: 10000,
      })

      const parsed = this.helpParser.parseHelpOutput(helpText)

      const command = this.commands.get(commandName)
      if (command) {
        command.hasSubcommands = parsed.commands.size > 0
        command.subcommands = parsed.commands

        // Also store global options for this command
        command.globalOptions = parsed.globalOptions

        if (options.verbose) {
          console.log(`📋 Found ${parsed.commands.size} subcommands for ${commandName}`)
        }
      }
    } catch (error) {
      if (options.verbose) {
        console.log(`⚠️ Failed to discover subcommands for ${commandName}: ${error.message}`)
      }
    }
  }

  /**
   * Discover detailed information about a command (arguments, flags, options)
   * @param {string} commandName - Name of the command
   * @param {Object} options - Discovery options
   */
  async discoverCommandDetails(commandName, options) {
    try {
      const cliPath = options.cliPath || 'src/cli.mjs'
      const env = { ...process.env }
      if (options.useTestCli) {
        env.TEST_CLI = 'true'
      }

      if (options.verbose) {
        console.log(`🔍 Getting help for command: ${commandName}`)
      }

      const helpText = execSync(`node ${cliPath} ${commandName} --help`, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        timeout: 10000,
      })

      if (options.verbose) {
        console.log(`🔍 Help text length: ${helpText.length}`)
        console.log(`🔍 Help text preview: ${helpText.substring(0, 200)}...`)
      }

      const parsed = this.helpParser.parseCommandHelp(commandName, helpText)

      const command = this.commands.get(commandName)
      if (command) {
        command.arguments = parsed.arguments
        command.flags = parsed.flags
        command.options = parsed.options

        if (options.verbose) {
          console.log(
            `📋 Found ${parsed.arguments.size} arguments, ${parsed.flags.size} flags, ${parsed.options.size} options for ${commandName}`
          )
        }
      }
    } catch (error) {
      if (options.verbose) {
        console.log(`⚠️ Failed to discover details for ${commandName}: ${error.message}`)
      }
    }
  }

  /**
   * Get discovered commands
   * @returns {Map} Map of discovered commands
   */
  getCommands() {
    return this.commands
  }

  /**
   * Get global options
   * @returns {Map} Map of global options
   */
  getGlobalOptions() {
    return this.globalOptions || new Map()
  }

  /**
   * Get all commands and subcommands as a flat list
   * @returns {Array} Array of all commands and subcommands
   */
  getAllCommands() {
    const allCommands = []

    for (const [name, command] of this.commands) {
      allCommands.push({
        name,
        type: 'main',
        ...command,
      })

      // Add subcommands
      for (const [subName, subCommand] of command.subcommands) {
        allCommands.push({
          name: `${name} ${subName}`,
          type: 'subcommand',
          parent: name,
          ...subCommand,
        })
      }
    }

    return allCommands
  }

  /**
   * Get all arguments, flags, and options across all commands
   * @returns {Object} Object containing all arguments, flags, and options
   */
  getAllArguments() {
    const allArguments = {
      global: {
        flags: this.getGlobalOptions(),
        options: new Map(),
      },
      commands: new Map(),
    }

    for (const [name, command] of this.commands) {
      allArguments.commands.set(name, {
        arguments: command.arguments,
        flags: command.flags,
        options: command.options,
      })
    }

    return allArguments
  }
}
