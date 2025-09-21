/**
 * Enterprise Context Management System
 *
 * Provides enterprise context and workspace management for CLI testing.
 * Supports context inheritance, validation, and workspace isolation.
 */

/**
 * Enterprise Context Manager implementation
 */
export class EnterpriseContextManager {
  constructor() {
    this.currentContext = null
    this.workspaces = new Map()
    this.contextHistory = []
  }

  /**
   * Set the current enterprise context
   */
  async setContext(context) {
    // Validate context
    const validation = this.validateContext(context)
    if (!validation.valid) {
      throw new Error(`Invalid context: ${validation.errors.join(', ')}`)
    }

    // Store previous context in history
    if (this.currentContext) {
      this.contextHistory.push({ ...this.currentContext })
    }

    // Set new context
    this.currentContext = { ...context, updatedAt: new Date() }
  }

  /**
   * Get the current enterprise context
   */
  getContext() {
    return this.currentContext
  }

  /**
   * Validate enterprise context
   */
  validateContext(context) {
    const errors = []
    const warnings = []

    if (!context || typeof context !== 'object') {
      errors.push('Context must be an object')
      return { valid: false, errors, warnings }
    }

    if (!context.id || typeof context.id !== 'string') {
      errors.push('Context must have a valid id')
    }

    if (context.domain && typeof context.domain !== 'string') {
      errors.push('Domain must be a string')
    }

    if (context.project && typeof context.project !== 'string') {
      errors.push('Project must be a string')
    }

    if (context.environment && typeof context.environment !== 'string') {
      errors.push('Environment must be a string')
    }

    if (context.region && typeof context.region !== 'string') {
      errors.push('Region must be a string')
    }

    if (context.compliance && typeof context.compliance !== 'string') {
      errors.push('Compliance must be a string')
    }

    if (context.user && typeof context.user !== 'string') {
      errors.push('User must be a string')
    }

    if (context.role && typeof context.role !== 'string') {
      errors.push('Role must be a string')
    }

    if (context.workspace && typeof context.workspace !== 'string') {
      errors.push('Workspace must be a string')
    }

    if (context.permissions && !Array.isArray(context.permissions)) {
      errors.push('Permissions must be an array')
    }

    if (context.metadata && typeof context.metadata !== 'object') {
      errors.push('Metadata must be an object')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(workspace) {
    if (!workspace || typeof workspace !== 'object') {
      throw new Error('Workspace must be an object')
    }

    if (!workspace.id || typeof workspace.id !== 'string') {
      throw new Error('Workspace must have a valid id')
    }

    if (this.workspaces.has(workspace.id)) {
      throw new Error(`Workspace ${workspace.id} already exists`)
    }

    const newWorkspace = {
      ...workspace,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.workspaces.set(workspace.id, newWorkspace)
    return newWorkspace
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id) {
    return this.workspaces.get(id)
  }

  /**
   * List all workspaces
   */
  listWorkspaces() {
    return Array.from(this.workspaces.values())
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id) {
    if (!this.workspaces.has(id)) {
      throw new Error(`Workspace ${id} not found`)
    }

    this.workspaces.delete(id)
  }

  /**
   * Get context history
   */
  getContextHistory() {
    return [...this.contextHistory]
  }

  /**
   * Clear context history
   */
  clearContextHistory() {
    this.contextHistory = []
  }

  /**
   * Reset to default state
   */
  reset() {
    this.currentContext = null
    this.workspaces.clear()
    this.contextHistory = []
  }
}

/**
 * Enterprise Contexts
 */
export const EnterpriseContexts = {
  /**
   * Create a basic enterprise context
   */
  createBasic(id, domain, project) {
    return {
      id,
      domain,
      project,
      environment: 'development',
      region: 'us-east-1',
      compliance: 'standard',
      user: 'system',
      role: 'admin',
      workspace: 'default',
      permissions: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  /**
   * Create a production context
   */
  createProduction(id, domain, project, region = 'us-east-1') {
    return {
      id,
      domain,
      project,
      environment: 'production',
      region,
      compliance: 'strict',
      user: 'system',
      role: 'admin',
      workspace: 'production',
      permissions: [],
      metadata: { production: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  /**
   * Create a development context
   */
  createDevelopment(id, domain, project) {
    return {
      id,
      domain,
      project,
      environment: 'development',
      region: 'us-east-1',
      compliance: 'relaxed',
      user: 'developer',
      role: 'developer',
      workspace: 'development',
      permissions: [],
      metadata: { development: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
}

/**
 * Enterprise Workspaces
 */
export const EnterpriseWorkspaces = {
  /**
   * Create a default workspace
   */
  createDefault(id, name, description) {
    return {
      id,
      name,
      description,
      domains: [],
      resources: [],
      permissions: [],
      context: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  /**
   * Create a domain-specific workspace
   */
  createDomainWorkspace(id, name, description, domain) {
    return {
      id,
      name,
      description,
      domains: [domain],
      resources: [],
      permissions: [],
      context: null,
      metadata: { domain },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
}

/**
 * Default context manager instance
 */
export const contextManager = new EnterpriseContextManager()

/**
 * Initialize enterprise context
 */
export function initializeEnterpriseContext() {
  const defaultContext = EnterpriseContexts.createBasic('default', 'default', 'default')
  return contextManager.setContext(defaultContext)
}

/**
 * Default export
 */
export default {
  EnterpriseContextManager,
  EnterpriseContexts,
  EnterpriseWorkspaces,
  contextManager,
  initializeEnterpriseContext,
}
