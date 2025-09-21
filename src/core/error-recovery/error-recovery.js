// src/core/error-recovery/error-recovery.js
// Comprehensive error recovery and retry mechanisms for cleanroom operations

export class ErrorRecoveryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.exponentialBackoff = options.exponentialBackoff || true
    this.retryableErrors = new Set([
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'PERMISSION_ERROR',
      'DISK_SPACE_ERROR',
      'MEMORY_ERROR'
    ])
    this.recoveryStrategies = new Map()
    this.setupRecoveryStrategies()
  }

  setupRecoveryStrategies() {
    // Network error recovery
    this.recoveryStrategies.set('NETWORK_ERROR', {
      retryable: true,
      maxRetries: 5,
      delay: 2000,
      action: async (error, context) => {
        console.log('Attempting network error recovery...')
        // Could implement network connectivity check here
        return true
      }
    })

    // Timeout error recovery
    this.recoveryStrategies.set('TIMEOUT_ERROR', {
      retryable: true,
      maxRetries: 3,
      delay: 1000,
      action: async (error, context) => {
        console.log('Attempting timeout error recovery...')
        // Could implement resource cleanup here
        return true
      }
    })

    // Permission error recovery
    this.recoveryStrategies.set('PERMISSION_ERROR', {
      retryable: false,
      action: async (error, context) => {
        console.log('Permission error - attempting graceful degradation...')
        // Could fallback to local execution
        return false
      }
    })

    // Disk space error recovery
    this.recoveryStrategies.set('DISK_SPACE_ERROR', {
      retryable: true,
      maxRetries: 2,
      delay: 5000,
      action: async (error, context) => {
        console.log('Attempting disk space error recovery...')
        // Could implement cleanup of temporary files
        return true
      }
    })

    // Memory error recovery
    this.recoveryStrategies.set('MEMORY_ERROR', {
      retryable: true,
      maxRetries: 2,
      delay: 3000,
      action: async (error, context) => {
        console.log('Attempting memory error recovery...')
        // Could implement garbage collection
        if (global.gc) {
          global.gc()
        }
        return true
      }
    })
  }

  async executeWithRecovery(operation, context = {}) {
    let lastError
    let attempt = 0

    while (attempt <= this.maxRetries) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        attempt++

        const errorType = this.categorizeError(error)
        const strategy = this.recoveryStrategies.get(errorType)

        if (!strategy || !strategy.retryable || attempt > this.maxRetries) {
          // Try graceful degradation
          return await this.attemptGracefulDegradation(error, context)
        }

        console.log(`Attempt ${attempt} failed with ${errorType}, retrying...`)
        
        // Execute recovery action
        const recovered = await strategy.action(error, context)
        if (!recovered) {
          break
        }

        // Wait before retry
        const delay = this.exponentialBackoff 
          ? this.retryDelay * Math.pow(2, attempt - 1)
          : this.retryDelay
        
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  categorizeError(error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR'
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT_ERROR'
    }
    if (message.includes('permission') || message.includes('denied')) {
      return 'PERMISSION_ERROR'
    }
    if (message.includes('space') || message.includes('disk')) {
      return 'DISK_SPACE_ERROR'
    }
    if (message.includes('memory') || message.includes('oom')) {
      return 'MEMORY_ERROR'
    }
    
    return 'UNKNOWN_ERROR'
  }

  async attemptGracefulDegradation(error, context) {
    console.log('Attempting graceful degradation...')
    
    // Try to fallback to local execution if cleanroom fails
    if (context.operation === 'cleanroom') {
      console.log('Falling back to local execution...')
      try {
        const { runLocalCitty } = await import('../runners/legacy-compatibility.js')
        return await runLocalCitty(context.args, context.options)
      } catch (fallbackError) {
        console.error('Graceful degradation failed:', fallbackError.message)
      }
    }

    // Return a minimal result to prevent complete failure
    return {
      exitCode: 1,
      stdout: '',
      stderr: `Operation failed: ${error.message}`,
      args: context.args || [],
      cwd: context.cwd || '/app',
      durationMs: 0,
      json: undefined,
      errorType: this.categorizeError(error),
      degraded: true
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Resource cleanup
  async cleanupResources() {
    console.log('Cleaning up resources...')
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    // Clear any cached data
    // Could implement more specific cleanup here
  }

  // Health check
  async performHealthCheck() {
    try {
      // Check system resources
      const memUsage = process.memoryUsage()
      const isHealthy = memUsage.heapUsed < 500 * 1024 * 1024 // 500MB threshold
      
      if (!isHealthy) {
        console.warn(`System health check failed: High memory usage (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB)`)
        await this.cleanupResources()
      }
      
      return isHealthy
    } catch (error) {
      console.error('Health check failed:', error.message)
      return false
    }
  }
}

// Singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager()

// Utility functions
export async function withErrorRecovery(operation, context = {}) {
  return await errorRecoveryManager.executeWithRecovery(operation, context)
}

export async function performHealthCheck() {
  return await errorRecoveryManager.performHealthCheck()
}

export async function cleanupResources() {
  return await errorRecoveryManager.cleanupResources()
}

