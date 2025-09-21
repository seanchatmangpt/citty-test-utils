#!/usr/bin/env node
// src/core/utils/80-20-environment-detection.js - Focused 80/20 edge case handling

import { existsSync, readFileSync, accessSync, constants } from 'node:fs'
import { tmpdir } from 'node:os'

/**
 * 80/20 Environment Detection - Focuses on the 20% of edge cases that solve 80% of problems
 * 
 * Priority Edge Cases:
 * 1. Container Runtime Detection (Podman, Kubernetes, LXC)
 * 2. False Positive Prevention (Development/CI detection)
 * 3. Filename Sanitization (Basic character replacement)
 * 4. File System Permission Validation (Access checks)
 * 5. Resource Constraint Detection (Memory limits)
 */

/**
 * Enhanced cleanroom environment detection focusing on 80/20 edge cases
 * @returns {Object} Detection result with confidence level and details
 */
export function detectCleanroomEnvironment() {
  const detection = {
    isCleanroom: false,
    confidence: 0,
    runtime: null,
    indicators: [],
    warnings: [],
  }

  // 1. Check environment variables (with false positive prevention)
  if (process.env.CITTY_DISABLE_DOMAIN_DISCOVERY === 'true') {
    detection.indicators.push('CITTY_DISABLE_DOMAIN_DISCOVERY=true')
    detection.confidence += 30
    
    // 80/20 Fix: Prevent false positives in development/CI
    if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
      detection.warnings.push('Environment variable detected in development/CI - may be false positive')
      detection.confidence -= 10
    }
  }

  // 2. Check container-specific environment variables
  const containerVars = ['CONTAINER', 'DOCKER_CONTAINER', 'KUBERNETES_SERVICE_HOST', 'PODMAN_CONTAINER']
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
  ]

  for (const indicator of fsIndicators) {
    try {
      if (existsSync(indicator.path)) {
        detection.indicators.push(`File exists: ${indicator.path}`)
        detection.confidence += indicator.confidence
        detection.runtime = indicator.runtime
      }
    } catch (error) {
      // Ignore filesystem errors
    }
  }

  // 4. Check cgroup information (80/20: Focus on most common runtimes)
  try {
    const cgroup = readFileSync('/proc/1/cgroup', 'utf8')
    const cgroupLower = cgroup.toLowerCase()
    
    // 80/20: Only check the most common container runtimes
    const runtimePatterns = [
      { pattern: 'docker', runtime: 'docker', confidence: 35 },
      { pattern: 'containerd', runtime: 'containerd', confidence: 35 },
      { pattern: 'podman', runtime: 'podman', confidence: 35 },      // ← 80/20 ADD
      { pattern: 'kubepods', runtime: 'kubernetes', confidence: 30 }, // ← 80/20 ADD
      { pattern: 'lxc', runtime: 'lxc', confidence: 30 },           // ← 80/20 ADD
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

  // 5. 80/20: Basic resource constraint detection (memory only)
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

  // 6. Determine final result
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
 * 80/20: Enhanced working directory detection with basic permission validation
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
    
    // 80/20: Basic permission validation
    try {
      accessSync('/app', constants.W_OK)
    } catch (error) {
      result.warnings.push('Cleanroom path /app is not writable')
      result.path = '/tmp' // Simple fallback
    }
  } else {
    // 80/20: Basic local path validation
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
 * 80/20: Enhanced temporary directory detection with basic validation
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
    
    // 80/20: Basic temp directory validation
    try {
      accessSync('/tmp', constants.W_OK)
    } catch (error) {
      result.warnings.push('Cleanroom /tmp is not writable')
      result.path = '/var/tmp' // Simple fallback
    }
  } else {
    // 80/20: Basic local temp validation
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
 * 80/20: Enhanced environment paths with focused edge case handling
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
  
  // 80/20: Basic filename sanitization
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
 * 80/20: Basic filename sanitization focusing on most common issues
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'generated-file'
  }
  
  // 80/20: Focus on most common problematic characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
  
  // 80/20: Basic length limiting
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
 * 80/20: Basic container health validation focusing on critical paths
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
  
  // 80/20: Check only critical paths
  const criticalPaths = ['/app', '/tmp']
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
  
  return health
}
