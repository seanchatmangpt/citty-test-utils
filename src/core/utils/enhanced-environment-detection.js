#!/usr/bin/env node
// src/core/utils/enhanced-environment-detection.js - Enhanced environment detection with edge case handling

import { existsSync, readFileSync, accessSync, constants } from 'node:fs'
import { tmpdir, platform, arch } from 'node:os'
import { execSync } from 'node:child_process'

/**
 * Enhanced cleanroom environment detection with comprehensive edge case handling
 * @returns {Object} Detection result with confidence level and details
 */
export function detectCleanroomEnvironment() {
  const detection = {
    isCleanroom: false,
    confidence: 0,
    runtime: null,
    indicators: [],
    warnings: [],
    platform: platform(),
    architecture: arch(),
  }

  // 1. Check environment variables (with validation)
  if (process.env.CITTY_DISABLE_DOMAIN_DISCOVERY === 'true') {
    detection.indicators.push('CITTY_DISABLE_DOMAIN_DISCOVERY=true')
    detection.confidence += 30

    // Check if this might be a false positive
    if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
      detection.warnings.push(
        'Environment variable detected in development/CI - may be false positive'
      )
      detection.confidence -= 10
    }
  }

  // 2. Check container-specific environment variables
  const containerVars = [
    'CONTAINER',
    'DOCKER_CONTAINER',
    'KUBERNETES_SERVICE_HOST',
    'PODMAN_CONTAINER',
    'LXC_CONTAINER',
  ]

  for (const varName of containerVars) {
    if (process.env[varName]) {
      detection.indicators.push(`${varName}=${process.env[varName]}`)
      detection.confidence += 20
    }
  }

  // 3. Check filesystem indicators
  const fsIndicators = [
    { path: '/.dockerenv', runtime: 'docker', confidence: 40 },
    { path: '/.containerenv', runtime: 'podman', confidence: 40 },
    { path: '/run/.containerenv', runtime: 'podman', confidence: 40 },
    { path: '/proc/1/environ', runtime: 'generic', confidence: 10 },
  ]

  for (const indicator of fsIndicators) {
    try {
      if (existsSync(indicator.path)) {
        detection.indicators.push(`File exists: ${indicator.path}`)
        detection.confidence += indicator.confidence
        if (indicator.runtime !== 'generic') {
          detection.runtime = indicator.runtime
        }
      }
    } catch (error) {
      // Ignore filesystem errors
    }
  }

  // 4. Check cgroup information (comprehensive)
  try {
    const cgroup = readFileSync('/proc/1/cgroup', 'utf8')
    const cgroupLower = cgroup.toLowerCase()

    const runtimePatterns = [
      { pattern: 'docker', runtime: 'docker', confidence: 35 },
      { pattern: 'containerd', runtime: 'containerd', confidence: 35 },
      { pattern: 'podman', runtime: 'podman', confidence: 35 },
      { pattern: 'kubepods', runtime: 'kubernetes', confidence: 30 },
      { pattern: 'lxc', runtime: 'lxc', confidence: 30 },
      { pattern: 'systemd', runtime: 'systemd-nspawn', confidence: 25 },
      { pattern: 'crio', runtime: 'cri-o', confidence: 30 },
    ]

    for (const { pattern, runtime, confidence } of runtimePatterns) {
      if (cgroupLower.includes(pattern)) {
        detection.indicators.push(`Cgroup contains: ${pattern}`)
        detection.confidence += confidence
        if (!detection.runtime) {
          detection.runtime = runtime
        }
      }
    }
  } catch (error) {
    detection.warnings.push('Could not read cgroup information')
  }

  // 5. Check process tree (container processes typically have PID 1 as parent)
  try {
    const stat = readFileSync('/proc/1/stat', 'utf8')
    const fields = stat.split(' ')
    const parentPid = fields[3]

    // In containers, init process often has parent PID 0 or unusual values
    if (parentPid === '0' || parseInt(parentPid) < 2) {
      detection.indicators.push(`Unusual parent PID: ${parentPid}`)
      detection.confidence += 15
    }
  } catch (error) {
    // Ignore process tree errors
  }

  // 6. Check for container-specific mounts
  try {
    const mounts = readFileSync('/proc/mounts', 'utf8')
    const mountIndicators = ['overlay', 'tmpfs', 'devtmpfs', 'proc', 'sysfs', 'cgroup']

    let mountScore = 0
    for (const indicator of mountIndicators) {
      if (mounts.includes(indicator)) {
        mountScore += 5
      }
    }

    if (mountScore > 20) {
      detection.indicators.push(`Container-like mounts detected (score: ${mountScore})`)
      detection.confidence += Math.min(mountScore, 25)
    }
  } catch (error) {
    detection.warnings.push('Could not read mount information')
  }

  // 7. Check for resource constraints (containers often have limits)
  try {
    const meminfo = readFileSync('/proc/meminfo', 'utf8')
    const memTotalMatch = meminfo.match(/MemTotal:\s+(\d+)/)

    if (memTotalMatch) {
      const memTotalKB = parseInt(memTotalMatch[1])
      const memTotalGB = memTotalKB / 1024 / 1024

      // Containers often have limited memory
      if (memTotalGB < 2) {
        detection.indicators.push(`Limited memory: ${memTotalGB.toFixed(1)}GB`)
        detection.confidence += 10
      }
    }
  } catch (error) {
    // Ignore memory info errors
  }

  // 8. Platform-specific checks
  if (detection.platform === 'win32') {
    // Windows containers
    try {
      const result = execSync('docker version --format "{{.Server.Version}}"', {
        encoding: 'utf8',
        timeout: 5000,
      })
      if (result.trim()) {
        detection.indicators.push('Docker available on Windows')
        detection.confidence += 20
      }
    } catch (error) {
      // Docker not available or not accessible
    }
  }

  // 9. Determine final result
  detection.isCleanroom = detection.confidence >= 50

  // Add confidence-based warnings
  if (detection.confidence >= 30 && detection.confidence < 50) {
    detection.warnings.push('Low confidence detection - may be false positive')
  }

  if (detection.confidence >= 80) {
    detection.warnings.push('High confidence detection - likely in container')
  }

  return detection
}

/**
 * Legacy function for backward compatibility
 * @returns {boolean} True if running in cleanroom, false otherwise
 */
export function isCleanroomEnvironment() {
  const detection = detectCleanroomEnvironment()
  return detection.isCleanroom
}

/**
 * Enhanced working directory detection with edge case handling
 * @param {string} fallback - Fallback directory if not in cleanroom
 * @returns {Object} Working directory info with validation
 */
export function getWorkingDirectoryInfo(fallback = '.') {
  const detection = detectCleanroomEnvironment()

  const result = {
    path: fallback,
    isCleanroom: detection.isCleanroom,
    confidence: detection.confidence,
    runtime: detection.runtime,
    warnings: detection.warnings,
  }

  if (detection.isCleanroom) {
    result.path = '/app'

    // Validate the path exists and is writable
    try {
      accessSync('/app', constants.W_OK)
    } catch (error) {
      result.warnings.push('Cleanroom path /app is not writable')
      result.path = '/tmp' // Fallback to /tmp
    }
  } else {
    // Validate local path
    try {
      accessSync(fallback, constants.W_OK)
    } catch (error) {
      result.warnings.push(`Local path ${fallback} is not writable`)
      result.path = tmpdir() // Fallback to system temp
    }
  }

  return result
}

/**
 * Enhanced temporary directory detection with edge case handling
 * @param {string} fallback - Fallback temp directory if not in cleanroom
 * @returns {Object} Temp directory info with validation
 */
export function getTempDirectoryInfo(fallback = null) {
  const detection = detectCleanroomEnvironment()

  const result = {
    path: fallback || tmpdir(),
    isCleanroom: detection.isCleanroom,
    confidence: detection.confidence,
    runtime: detection.runtime,
    warnings: detection.warnings,
  }

  if (detection.isCleanroom) {
    result.path = '/tmp'

    // Validate /tmp is writable
    try {
      accessSync('/tmp', constants.W_OK)
    } catch (error) {
      result.warnings.push('Cleanroom /tmp is not writable')
      result.path = '/var/tmp' // Alternative temp location

      try {
        accessSync('/var/tmp', constants.W_OK)
      } catch (error2) {
        result.warnings.push('Cleanroom /var/tmp is also not writable')
        result.path = '/app' // Last resort
      }
    }
  } else {
    // Validate local temp directory
    const tempPath = fallback || tmpdir()
    try {
      accessSync(tempPath, constants.W_OK)
      result.path = tempPath
    } catch (error) {
      result.warnings.push(`Local temp path ${tempPath} is not writable`)
      result.path = tmpdir() // Use system default
    }
  }

  return result
}

/**
 * Enhanced environment paths with comprehensive edge case handling
 * @param {Object} options - Path options
 * @returns {Object} Environment-specific paths with validation
 */
export function getEnvironmentPaths(options = {}) {
  const { output = '.', tempPrefix = 'citty-test', filename = 'generated-file' } = options

  const detection = detectCleanroomEnvironment()
  const workingDirInfo = getWorkingDirectoryInfo()
  const tempDirInfo = getTempDirectoryInfo()

  // Create safe temporary directory name with collision avoidance
  const tempDirName = createSafeTempDirName(tempPrefix)
  const fullTempDir = `${tempDirInfo.path}/${tempDirName}`

  // Validate filename for special characters and length
  const sanitizedFilename = sanitizeFilename(filename)

  const result = {
    isCleanroom: detection.isCleanroom,
    workingDir: workingDirInfo.path,
    tempDir: tempDirInfo.path,
    outputDir: getOutputDirectory(output, detection),
    fullTempDir,
    filename: sanitizedFilename,
    // Full paths
    tempPath: `${fullTempDir}/${sanitizedFilename}`,
    outputPath: `${getOutputDirectory(output, detection)}/${sanitizedFilename}`,
    // Environment info
    environment: detection.isCleanroom ? 'cleanroom' : 'local',
    // Detection details
    detection,
    workingDirInfo,
    tempDirInfo,
    // Warnings and validation
    warnings: [...detection.warnings, ...workingDirInfo.warnings, ...tempDirInfo.warnings],
  }

  return result
}

/**
 * Sanitize filename to handle edge cases
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'generated-file'
  }

  // Remove or replace problematic characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes

  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.split('.').pop()
    const base = sanitized.substring(0, 200 - ext.length - 1)
    sanitized = `${base}.${ext}`
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'generated-file'
  }

  return sanitized
}

/**
 * Enhanced output directory detection
 * @param {string} output - User-specified output directory
 * @param {Object} detection - Environment detection result
 * @returns {string} Output directory path
 */
function getOutputDirectory(output, detection) {
  if (detection.isCleanroom) {
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
  const pid = process.pid
  return `${prefix}-${timestamp}-${pid}-${random}`
}

/**
 * Validate container health and accessibility
 * @returns {Object} Container health status
 */
export function validateContainerHealth() {
  const detection = detectCleanroomEnvironment()

  if (!detection.isCleanroom) {
    return {
      healthy: true,
      message: 'Not in container environment',
      warnings: [],
    }
  }

  const health = {
    healthy: true,
    message: 'Container appears healthy',
    warnings: [],
    runtime: detection.runtime,
  }

  // Check critical paths
  const criticalPaths = ['/app', '/tmp', '/proc', '/sys']
  for (const path of criticalPaths) {
    try {
      accessSync(path, constants.R_OK)
    } catch (error) {
      health.warnings.push(`Cannot access critical path: ${path}`)
      if (path === '/app' || path === '/tmp') {
        health.healthy = false
        health.message = `Critical path ${path} is not accessible`
      }
    }
  }

  // Check for resource constraints
  try {
    const meminfo = readFileSync('/proc/meminfo', 'utf8')
    const memAvailableMatch = meminfo.match(/MemAvailable:\s+(\d+)/)

    if (memAvailableMatch) {
      const memAvailableKB = parseInt(memAvailableMatch[1])
      const memAvailableMB = memAvailableKB / 1024

      if (memAvailableMB < 100) {
        health.warnings.push(`Low memory available: ${memAvailableMB.toFixed(1)}MB`)
      }
    }
  } catch (error) {
    health.warnings.push('Could not check memory status')
  }

  return health
}

