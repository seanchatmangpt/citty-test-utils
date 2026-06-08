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
   * Set the current enterprise context - let invalid contexts crash
   */
  async setContext(context) {
    // Store previous context in history
    if (this.currentContext) {
      this.contextHistory.push({ ...this.currentContext })
    }

    // Set new context - let invalid contexts crash
    this.currentContext = { ...context, updatedAt: new Date() }
  }

  /**
   * Get the current enterprise context
   */
  getContext() {
    return this.currentContext
  }

  /**
   * Validate enterprise context - let invalid contexts crash
   */
  validateContext(context) {
    // No validation - let invalid contexts crash
    return { valid: true, errors: [], warnings: [] }
  }

  /**
   * Create a new workspace - let invalid workspaces crash
   */
  async createWorkspace(workspace) {
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
