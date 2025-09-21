#!/usr/bin/env node
// src/core/utils/environment-detection.js - Environment detection utilities

import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

/**
 * Detects if the current process is running in a cleanroom (Docker) environment
 * @returns {boolean} True if running in cleanroom, false otherwise
 */
export function isCleanroomEnvironment() {
  // Check for cleanroom-specific environment variables
  if (process.env.CITTY_DISABLE_DOMAIN_DISCOVERY === 'true') {
    return true
  }

  // Check if we're in a container by looking at common container indicators
  if (process.env.CONTAINER === 'true') {
    return true
  }

  // Check if we're in a Docker container by looking at cgroup
  try {
    if (existsSync('/.dockerenv')) {
      return true
    }

    // Check cgroup for Docker indicators
    const cgroup = readFileSync('/proc/1/cgroup', 'utf8')
    if (cgroup.includes('docker') || cgroup.includes('containerd')) {
      return true
    }
  } catch (error) {
    // Ignore errors, not in container
  }

  return false
}

/**
 * Gets the appropriate working directory for file operations
 * @param {string} fallback - Fallback directory if not in cleanroom
 * @returns {string} Working directory path
 */
export function getWorkingDirectory(fallback = '.') {
  if (isCleanroomEnvironment()) {
    return '/app'
  }
  return fallback
}

/**
 * Gets the appropriate temporary directory for file operations
 * @param {string} fallback - Fallback temp directory if not in cleanroom
 * @returns {string} Temporary directory path
 */
export function getTempDirectory(fallback = null) {
  if (isCleanroomEnvironment()) {
    return '/tmp'
  }

  if (fallback) {
    return fallback
  }

  // Use Node.js temp directory for local environment
  return tmpdir()
}

/**
 * Gets the appropriate output directory for generated files
 * @param {string} output - User-specified output directory
 * @returns {string} Output directory path
 */
export function getOutputDirectory(output = '.') {
  if (isCleanroomEnvironment()) {
    // In cleanroom, always use /app as the base
    if (output === '.' || output === './') {
      return '/app'
    }
    // If output is relative, make it relative to /app
    if (!output.startsWith('/')) {
      return `/app/${output}`
    }
    return output
  }

  // In local environment, use the specified output or current directory
  return output === '.' ? process.cwd() : output
}

/**
 * Creates a safe temporary directory name that won't conflict
 * @param {string} prefix - Prefix for the temporary directory
 * @returns {string} Safe temporary directory name
 */
export function createSafeTempDirName(prefix = 'citty-test') {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Gets environment-specific file paths
 * @param {Object} options - Path options
 * @returns {Object} Environment-specific paths
 */
export function getEnvironmentPaths(options = {}) {
  const { output = '.', tempPrefix = 'citty-test', filename = 'generated-file' } = options

  const isCleanroom = isCleanroomEnvironment()
  const workingDir = getWorkingDirectory()
  const tempDir = getTempDirectory()
  const outputDir = getOutputDirectory(output)

  // Create safe temporary directory name
  const tempDirName = createSafeTempDirName(tempPrefix)
  const fullTempDir = `${tempDir}/${tempDirName}`

  return {
    isCleanroom,
    workingDir,
    tempDir,
    outputDir,
    fullTempDir,
    filename,
    // Full paths
    tempPath: `${fullTempDir}/${filename}`,
    outputPath: `${outputDir}/${filename}`,
    // Environment info
    environment: isCleanroom ? 'cleanroom' : 'local',
  }
}
