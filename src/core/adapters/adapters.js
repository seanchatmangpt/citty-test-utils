#!/usr/bin/env node
/**
 * @fileoverview Cross-Language CLI Adapters
 * @description Adapters for different CLI frameworks and languages
 */

import { ExecEnv } from '../contract/universal-contract.js'

/**
 * Node.js CLI adapter
 * @param {string} [entry='src/cli.mjs'] - Entry point file
 * @returns {Function} Adapter function that takes args and returns command array
 */
function nodeAdapter(entry = 'src/cli.mjs') {
  return (args = []) => ['node', entry, ...args]
}

/**
 * Python CLI adapter (Click/Typer)
 * @param {string} [module='cli'] - Python module name
 * @returns {Function} Adapter function that takes args and returns command array
 */
function pythonAdapter(module = 'cli') {
  return (args = []) => ['python', '-m', module, ...args]
}

/**
 * Go CLI adapter (Cobra)
 * @param {string} [bin='./dist/app'] - Binary path
 * @returns {Function} Adapter function that takes args and returns command array
 */
function goAdapter(bin = './dist/app') {
  return (args = []) => [bin, ...args]
}

/**
 * Rust CLI adapter (Clap)
 * @param {string} [bin='./target/release/app'] - Binary path
 * @param {boolean} [useCargo=false] - Whether to use cargo run
 * @returns {Function} Adapter function that takes args and returns command array
 */
function rustAdapter(bin = './target/release/app', useCargo = false) {
  if (useCargo) {
    return (args = []) => ['cargo', 'run', '--', ...args]
  }
  return (args = []) => [bin, ...args]
}

/**
 * Deno CLI adapter
 * @param {string} [file='cli.ts'] - Deno script file
 * @param {string[]} [permissions=[]] - Deno permissions
 * @returns {Function} Adapter function that takes args and returns command array
 */
function denoAdapter(file = 'cli.ts', permissions = []) {
  const permFlags = permissions.length > 0 ? permissions.map((p) => `--allow-${p}`) : ['-A']
  return (args = []) => ['deno', 'run', ...permFlags, file, ...args]
}

/**
 * Java CLI adapter
 * @param {string} [jar='./target/app.jar'] - JAR file path
 * @param {string} [mainClass] - Main class name
 * @returns {Function} Adapter function that takes args and returns command array
 */
function javaAdapter(jar = './target/app.jar', mainClass = null) {
  if (mainClass) {
    return (args = []) => ['java', '-cp', jar, mainClass, ...args]
  }
  return (args = []) => ['java', '-jar', jar, ...args]
}

/**
 * C# CLI adapter (.NET)
 * @param {string} [dll='./bin/Release/app.dll'] - DLL file path
 * @returns {Function} Adapter function that takes args and returns command array
 */
function csharpAdapter(dll = './bin/Release/app.dll') {
  return (args = []) => ['dotnet', dll, ...args]
}

/**
 * PHP CLI adapter
 * @param {string} [script='cli.php'] - PHP script file
 * @returns {Function} Adapter function that takes args and returns command array
 */
function phpAdapter(script = 'cli.php') {
  return (args = []) => ['php', script, ...args]
}

/**
 * Ruby CLI adapter
 * @param {string} [script='cli.rb'] - Ruby script file
 * @returns {Function} Adapter function that takes args and returns command array
 */
function rubyAdapter(script = 'cli.rb') {
  return (args = []) => ['ruby', script, ...args]
}

/**
 * Shell script adapter
 * @param {string} [script='cli.sh'] - Shell script file
 * @param {string} [shell='bash'] - Shell to use
 * @returns {Function} Adapter function that takes args and returns command array
 */
function shellAdapter(script = 'cli.sh', shell = 'bash') {
  return (args = []) => [shell, script, ...args]
}

/**
 * PowerShell adapter
 * @param {string} [script='cli.ps1'] - PowerShell script file
 * @returns {Function} Adapter function that takes args and returns command array
 */
function powershellAdapter(script = 'cli.ps1') {
  return (args = []) => ['powershell', '-File', script, ...args]
}

/**
 * Collection of all adapters
 */
export const adapters = {
  node: nodeAdapter,
  python: pythonAdapter,
  go: goAdapter,
  rust: rustAdapter,
  deno: denoAdapter,
  java: javaAdapter,
  csharp: csharpAdapter,
  php: phpAdapter,
  ruby: rubyAdapter,
  shell: shellAdapter,
  powershell: powershellAdapter,
}

/**
 * Auto-detect CLI framework and return appropriate adapter
 * @param {string} projectPath - Path to project
 * @returns {Function|null} Detected adapter function or null
 */
function detectAdapter(projectPath) {
  const fs = require('fs')
  const path = require('path')

  try {
    // Check for package.json (Node.js)
    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'))
      if (pkg.bin || pkg.main) {
        return nodeAdapter(pkg.main || 'src/cli.mjs')
      }
    }

    // Check for requirements.txt or pyproject.toml (Python)
    if (
      fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
      fs.existsSync(path.join(projectPath, 'pyproject.toml'))
    ) {
      return pythonAdapter()
    }

    // Check for go.mod (Go)
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      return goAdapter()
    }

    // Check for Cargo.toml (Rust)
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      return rustAdapter()
    }

    // Check for deno.json (Deno)
    if (fs.existsSync(path.join(projectPath, 'deno.json'))) {
      return denoAdapter()
    }

    // Check for pom.xml (Java)
    if (fs.existsSync(path.join(projectPath, 'pom.xml'))) {
      return javaAdapter()
    }

    // Check for *.csproj (C#)
    if (fs.existsSync(path.join(projectPath, '*.csproj'))) {
      return csharpAdapter()
    }

    // Check for composer.json (PHP)
    if (fs.existsSync(path.join(projectPath, 'composer.json'))) {
      return phpAdapter()
    }

    // Check for Gemfile (Ruby)
    if (fs.existsSync(path.join(projectPath, 'Gemfile'))) {
      return rubyAdapter()
    }

    // Check for shell scripts
    if (fs.existsSync(path.join(projectPath, 'cli.sh'))) {
      return shellAdapter()
    }

    // Check for PowerShell scripts
    if (fs.existsSync(path.join(projectPath, 'cli.ps1'))) {
      return powershellAdapter()
    }
  } catch (error) {
    console.warn('Failed to detect CLI framework:', error.message)
  }

  return null
}

/**
 * Create a universal CLI runner that works with any adapter
 * @param {Function} adapter - Adapter function
 * @param {Runner} runner - Base runner instance
 * @returns {Object} Universal CLI runner
 */
function createUniversalRunner(adapter, runner) {
  return {
    /**
     * Run CLI command with adapter
     * @param {string[]} args - CLI arguments
     * @param {ExecOptions} [options] - Execution options
     * @returns {Promise<ExecResult>} Execution result
     */
    async run(args = [], options = {}) {
      const command = adapter(args)
      return await runner.exec(command, options)
    },

    /**
     * Run CLI command with PTY support
     * @param {string[]} args - CLI arguments
     * @param {string} script - PTY interaction script
     * @param {ExecOptions} [options] - Execution options
     * @returns {Promise<ExecResult>} Execution result
     */
    async runPty(args = [], script, options = {}) {
      const command = adapter(args)
      return await runner.execPty(command, script, options)
    },

    /**
     * Get the underlying runner
     * @returns {Runner} Base runner instance
     */
    getRunner() {
      return runner
    },

    /**
     * Get the adapter function
     * @returns {Function} Adapter function
     */
    getAdapter() {
      return adapter
    },
  }
}

// Export all adapters and utilities
export {
  nodeAdapter,
  pythonAdapter,
  goAdapter,
  rustAdapter,
  denoAdapter,
  javaAdapter,
  csharpAdapter,
  phpAdapter,
  rubyAdapter,
  shellAdapter,
  powershellAdapter,
  detectAdapter,
  createUniversalRunner,
}
