/**
 * Enterprise Context Management System
 *
 * Provides enterprise context and workspace management for CLI testing
 * Supports multi-tenant, multi-environment, and compliance-aware testing
 */

/**
 * Enterprise Context for CLI command execution
 */
export class EnterpriseContext {
  constructor(contextData = {}) {
    this._domain = contextData.domain || null
    this._project = contextData.project || null
    this._environment = contextData.environment || 'development'
    this._region = contextData.region || 'us-east-1'
    this._compliance = contextData.compliance || null
    this._user = contextData.user || 'test-user'
    this._role = contextData.role || 'admin'
    this._workspace = contextData.workspace || 'default'
    this._tenant = contextData.tenant || null
    this._resource = contextData.resource || null
    this._action = contextData.action || null
    this._workflow = contextData.workflow || null
    this._integration = contextData.integration || false
    this._crossDomain = contextData.crossDomain || false
    this._requiresCleanup = contextData.requiresCleanup || false
    this._lifecycle = contextData.lifecycle || false
    this._auditRequired = contextData.auditRequired || false
    this._encryptionRequired = contextData.encryptionRequired || false
    this._metadata = contextData.metadata || {}
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // Getters
  get domain() {
    return this._domain
  }
  get project() {
    return this._project
  }
  get environment() {
    return this._environment
  }
  get region() {
    return this._region
  }
  get compliance() {
    return this._compliance
  }
  get user() {
    return this._user
  }
  get role() {
    return this._role
  }
  get workspace() {
    return this._workspace
  }
  get tenant() {
    return this._tenant
  }
  get resource() {
    return this._resource
  }
  get action() {
    return this._action
  }
  get workflow() {
    return this._workflow
  }
  get integration() {
    return this._integration
  }
  get crossDomain() {
    return this._crossDomain
  }
  get requiresCleanup() {
    return this._requiresCleanup
  }
  get lifecycle() {
    return this._lifecycle
  }
  get auditRequired() {
    return this._auditRequired
  }
  get encryptionRequired() {
    return this._encryptionRequired
  }
  get metadata() {
    return { ...this._metadata }
  }
  get createdAt() {
    return this._createdAt
  }
  get updatedAt() {
    return this._updatedAt
  }

  // Setters
  setDomain(domain) {
    this._domain = domain
    this._updatedAt = new Date()
    return this
  }

  setProject(project) {
    this._project = project
    this._updatedAt = new Date()
    return this
  }

  setEnvironment(environment) {
    this._environment = environment
    this._updatedAt = new Date()
    return this
  }

  setRegion(region) {
    this._region = region
    this._updatedAt = new Date()
    return this
  }

  setCompliance(compliance) {
    this._compliance = compliance
    this._updatedAt = new Date()
    return this
  }

  setUser(user) {
    this._user = user
    this._updatedAt = new Date()
    return this
  }

  setRole(role) {
    this._role = role
    this._updatedAt = new Date()
    return this
  }

  setWorkspace(workspace) {
    this._workspace = workspace
    this._updatedAt = new Date()
    return this
  }

  setTenant(tenant) {
    this._tenant = tenant
    this._updatedAt = new Date()
    return this
  }

  setResource(resource) {
    this._resource = resource
    this._updatedAt = new Date()
    return this
  }

  setAction(action) {
    this._action = action
    this._updatedAt = new Date()
    return this
  }

  setWorkflow(workflow) {
    this._workflow = workflow
    this._updatedAt = new Date()
    return this
  }

  setIntegration(integration) {
    this._integration = integration
    this._updatedAt = new Date()
    return this
  }

  setCrossDomain(crossDomain) {
    this._crossDomain = crossDomain
    this._updatedAt = new Date()
    return this
  }

  setRequiresCleanup(requiresCleanup) {
    this._requiresCleanup = requiresCleanup
    this._updatedAt = new Date()
    return this
  }

  setLifecycle(lifecycle) {
    this._lifecycle = lifecycle
    this._updatedAt = new Date()
    return this
  }

  setAuditRequired(auditRequired) {
    this._auditRequired = auditRequired
    this._updatedAt = new Date()
    return this
  }

  setEncryptionRequired(encryptionRequired) {
    this._encryptionRequired = encryptionRequired
    this._updatedAt = new Date()
    return this
  }

  setMetadata(metadata) {
    this._metadata = { ...this._metadata, ...metadata }
    this._updatedAt = new Date()
    return this
  }

  /**
   * Clone context with optional overrides
   */
  clone(overrides = {}) {
    return new EnterpriseContext({
      domain: overrides.domain || this._domain,
      project: overrides.project || this._project,
      environment: overrides.environment || this._environment,
      region: overrides.region || this._region,
      compliance: overrides.compliance || this._compliance,
      user: overrides.user || this._user,
      role: overrides.role || this._role,
      workspace: overrides.workspace || this._workspace,
      tenant: overrides.tenant || this._tenant,
      resource: overrides.resource || this._resource,
      action: overrides.action || this._action,
      workflow: overrides.workflow || this._workflow,
      integration: overrides.integration || this._integration,
      crossDomain: overrides.crossDomain || this._crossDomain,
      requiresCleanup: overrides.requiresCleanup || this._requiresCleanup,
      lifecycle: overrides.lifecycle || this._lifecycle,
      auditRequired: overrides.auditRequired || this._auditRequired,
      encryptionRequired: overrides.encryptionRequired || this._encryptionRequired,
      metadata: { ...this._metadata, ...overrides.metadata },
    })
  }

  /**
   * Convert to command arguments
   */
  toCommandArgs() {
    const args = []

    if (this._project) args.push('--project', this._project)
    if (this._environment && this._environment !== 'development')
      args.push('--environment', this._environment)
    if (this._region && this._region !== 'us-east-1') args.push('--region', this._region)
    if (this._compliance) args.push('--compliance', this._compliance)
    if (this._user && this._user !== 'test-user') args.push('--user', this._user)
    if (this._role && this._role !== 'admin') args.push('--role', this._role)
    if (this._workspace && this._workspace !== 'default') args.push('--workspace', this._workspace)
    if (this._tenant) args.push('--tenant', this._tenant)

    return args
  }

  /**
   * Convert to environment variables
   */
  toEnvVars() {
    return {
      ENTERPRISE_DOMAIN: this._domain,
      ENTERPRISE_PROJECT: this._project,
      ENTERPRISE_ENVIRONMENT: this._environment,
      ENTERPRISE_REGION: this._region,
      ENTERPRISE_COMPLIANCE: this._compliance,
      ENTERPRISE_USER: this._user,
      ENTERPRISE_ROLE: this._role,
      ENTERPRISE_WORKSPACE: this._workspace,
      ENTERPRISE_TENANT: this._tenant,
      ...this._metadata,
    }
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      domain: this._domain,
      project: this._project,
      environment: this._environment,
      region: this._region,
      compliance: this._compliance,
      user: this._user,
      role: this._role,
      workspace: this._workspace,
      tenant: this._tenant,
      resource: this._resource,
      action: this._action,
      workflow: this._workflow,
      integration: this._integration,
      crossDomain: this._crossDomain,
      requiresCleanup: this._requiresCleanup,
      lifecycle: this._lifecycle,
      auditRequired: this._auditRequired,
      encryptionRequired: this._encryptionRequired,
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new EnterpriseContext(json)
  }
}

/**
 * Enterprise Workspace for organizing resources and permissions
 */
export class EnterpriseWorkspace {
  constructor(config) {
    this._id = config.id || `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this._name = config.name
    this._description = config.description || ''
    this._domains = new Set(config.domains || [])
    this._resources = new Set(config.resources || [])
    this._permissions = config.permissions || []
    this._context = config.context || new EnterpriseContext()
    this._metadata = config.metadata || {}
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // Getters
  get id() {
    return this._id
  }
  get name() {
    return this._name
  }
  get description() {
    return this._description
  }
  get domains() {
    return Array.from(this._domains)
  }
  get resources() {
    return Array.from(this._resources)
  }
  get permissions() {
    return [...this._permissions]
  }
  get context() {
    return this._context
  }
  get metadata() {
    return { ...this._metadata }
  }
  get createdAt() {
    return this._createdAt
  }
  get updatedAt() {
    return this._updatedAt
  }

  /**
   * Add domain to workspace
   */
  addDomain(domain) {
    this._domains.add(domain)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Remove domain from workspace
   */
  removeDomain(domain) {
    this._domains.delete(domain)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Add resource to workspace
   */
  addResource(resource) {
    this._resources.add(resource)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Remove resource from workspace
   */
  removeResource(resource) {
    this._resources.delete(resource)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Add permission to workspace
   */
  addPermission(permission) {
    this._permissions.push(permission)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Remove permission from workspace
   */
  removePermission(permission) {
    this._permissions = this._permissions.filter((p) => p !== permission)
    this._updatedAt = new Date()
    return this
  }

  /**
   * Check if workspace has permission for resource and action
   */
  hasPermission(resource, action) {
    return this._permissions.some((p) => p.resource === resource && p.actions.includes(action))
  }

  /**
   * Update workspace context
   */
  updateContext(contextUpdates) {
    Object.entries(contextUpdates).forEach(([key, value]) => {
      if (typeof this._context[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] === 'function') {
        this._context[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](value)
      }
    })
    this._updatedAt = new Date()
    return this
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domains: this.domains,
      resources: this.resources,
      permissions: this._permissions,
      context: this._context.toJSON(),
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}

/**
 * Enterprise Context Manager
 */
export class EnterpriseContextManager {
  constructor() {
    this._currentContext = new EnterpriseContext()
    this._workspaces = new Map()
    this._contextHistory = []
    this._maxHistorySize = 100
  }

  /**
   * Get current context
   */
  getCurrentContext() {
    return this._currentContext
  }

  /**
   * Set current context
   */
  setContext(contextData) {
    // Save to history
    this._contextHistory.push(this._currentContext.clone())
    if (this._contextHistory.length > this._maxHistorySize) {
      this._contextHistory.shift()
    }

    // Update current context
    if (contextData instanceof EnterpriseContext) {
      this._currentContext = contextData
    } else {
      this._currentContext = new EnterpriseContext(contextData)
    }

    return this._currentContext
  }

  /**
   * Update current context
   */
  updateContext(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (
        typeof this._currentContext[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] ===
        'function'
      ) {
        this._currentContext[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](value)
      }
    })
    return this._currentContext
  }

  /**
   * Clear current context
   */
  clearContext() {
    this._currentContext = new EnterpriseContext()
    return this._currentContext
  }

  /**
   * Clear all workspaces and context history
   */
  clearAll() {
    this._workspaces.clear()
    this._contextHistory = []
    this._currentContext = new EnterpriseContext()
    return this
  }

  /**
   * Create workspace
   */
  createWorkspace(name, config = {}) {
    const workspace = new EnterpriseWorkspace({
      name,
      ...config,
    })

    this._workspaces.set(workspace.id, workspace)
    return workspace
  }

  /**
   * Get workspace by ID or name
   */
  getWorkspace(identifier) {
    // Try by ID first
    if (this._workspaces.has(identifier)) {
      return this._workspaces.get(identifier)
    }

    // Try by name
    for (const workspace of this._workspaces.values()) {
      if (workspace.name === identifier) {
        return workspace
      }
    }

    return null
  }

  /**
   * List all workspaces
   */
  listWorkspaces() {
    return Array.from(this._workspaces.values())
  }

  /**
   * Switch to workspace
   */
  switchWorkspace(identifier) {
    const workspace = this.getWorkspace(identifier)
    if (!workspace) {
      throw new Error(`Workspace '${identifier}' not found`)
    }

    this._currentContext = workspace.context.clone()
    return this._currentContext
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(identifier) {
    const workspace = this.getWorkspace(identifier)
    if (!workspace) {
      throw new Error(`Workspace '${identifier}' not found`)
    }

    this._workspaces.delete(workspace.id)
    return true
  }

  /**
   * Get context history
   */
  getContextHistory() {
    return [...this._contextHistory]
  }

  /**
   * Restore context from history
   */
  restoreContext(index) {
    if (index < 0 || index >= this._contextHistory.length) {
      throw new Error('Invalid context history index')
    }

    this._currentContext = this._contextHistory[index].clone()
    return this._currentContext
  }

  /**
   * Export all contexts and workspaces
   */
  export() {
    return {
      currentContext: this._currentContext.toJSON(),
      workspaces: Array.from(this._workspaces.values()).map((w) => w.toJSON()),
      contextHistory: this._contextHistory.map((c) => c.toJSON()),
    }
  }

  /**
   * Import contexts and workspaces
   */
  import(data) {
    if (data.currentContext) {
      this._currentContext = EnterpriseContext.fromJSON(data.currentContext)
    }

    if (data.workspaces) {
      this._workspaces.clear()
      data.workspaces.forEach((workspaceData) => {
        const workspace = new EnterpriseWorkspace(workspaceData)
        this._workspaces.set(workspace.id, workspace)
      })
    }

    if (data.contextHistory) {
      this._contextHistory = data.contextHistory.map((c) => EnterpriseContext.fromJSON(c))
    }

    return this
  }
}

/**
 * Global context manager instance
 */
export const globalContextManager = new EnterpriseContextManager()

/**
 * Convenience functions for context management
 */
export const contextUtils = {
  /**
   * Set enterprise context
   */
  async setContext(contextData) {
    return globalContextManager.setContext(contextData)
  },

  /**
   * Get current context
   */
  getCurrentContext() {
    return globalContextManager.getCurrentContext()
  },

  /**
   * Update current context
   */
  updateContext(updates) {
    return globalContextManager.updateContext(updates)
  },

  /**
   * Clear current context
   */
  clearContext() {
    return globalContextManager.clearContext()
  },

  /**
   * Create workspace
   */
  createWorkspace(name, config = {}) {
    return globalContextManager.createWorkspace(name, config)
  },

  /**
   * Get workspace
   */
  getWorkspace(identifier) {
    return globalContextManager.getWorkspace(identifier)
  },

  /**
   * List workspaces
   */
  listWorkspaces() {
    return globalContextManager.listWorkspaces()
  },

  /**
   * Switch workspace
   */
  switchWorkspace(identifier) {
    return globalContextManager.switchWorkspace(identifier)
  },

  /**
   * Delete workspace
   */
  deleteWorkspace(identifier) {
    return globalContextManager.deleteWorkspace(identifier)
  },
}

export default EnterpriseContextManager
