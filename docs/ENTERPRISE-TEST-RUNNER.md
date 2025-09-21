# Enterprise Test Runner Documentation

## 🚀 Overview

The Enterprise Test Runner is a comprehensive testing framework that wraps Vitest with enterprise-specific features for testing noun-verb CLI applications. It provides context-aware testing, domain organization, compliance validation, performance monitoring, and cross-domain workflow testing.

## 📦 Installation

```bash
npm install citty-test-utils
```

## 🏗️ Architecture

### Core Components

1. **EnterpriseTestRunner** - Core enterprise test runner with context management
2. **EnterpriseComplianceTestRunner** - Compliance testing (SOX, GDPR, HIPAA, PCI-DSS)
3. **EnterprisePerformanceTestRunner** - Performance monitoring and benchmarking
4. **EnterpriseIntegrationTestRunner** - Cross-domain workflow testing

### Enterprise Features

- **Context-Aware Testing** - Tests inherit enterprise context automatically
- **Domain Organization** - Tests organized by enterprise domains
- **Compliance Testing** - Automated regulatory compliance validation
- **Performance Monitoring** - Built-in performance measurement
- **Cross-Domain Workflows** - Complex enterprise workflow testing
- **Resource Management** - Enterprise resource lifecycle management

## 🚀 Quick Start

### Basic Enterprise Testing

```javascript
import { 
  EnterpriseTestRunner,
  createEnterpriseTestRunner 
} from 'citty-test-utils'

// Create enterprise test runner
const enterpriseRunner = createEnterpriseTestRunner({
  defaultTimeout: 30000,
  enableContext: true,
  enableAudit: true,
})

// Setup enterprise context
await enterpriseRunner.setupEnterpriseContext({
  environment: 'production',
  compliance: 'SOX',
  region: 'us-east-1',
})

// Domain-specific testing
const domainTest = enterpriseRunner.describeDomain('infra', async () => {
  const context = enterpriseRunner.getCurrentContext()
  expect(context.domain).toBe('infra')
  expect(context.environment).toBe('production')
  expect(context.compliance).toBe('SOX')
})

await domainTest()
```

### Domain Organization

```javascript
// Domain-specific test organization
enterpriseRunner.describeDomain('infra', () => {
  enterpriseRunner.describeResource('server', () => {
    enterpriseRunner.describeAction('create', () => {
      it('should create server with compliance validation', async () => {
        // Test server creation with enterprise context
        const context = enterpriseRunner.getCurrentContext()
        expect(context.domain).toBe('infra')
        expect(context.resource).toBe('server')
        expect(context.action).toBe('create')
      })
    })
  })
})
```

## 📋 Compliance Testing

### SOX Compliance Testing

```javascript
import { EnterpriseComplianceTestRunner } from 'citty-test-utils'

const complianceRunner = new EnterpriseComplianceTestRunner()

// SOX compliance testing
complianceRunner.sox(async () => {
  it('should validate financial data integrity', async () => {
    // Test financial data integrity
    const result = await enterpriseRunner.executeCommand('infra server create --type=financial')
    expect(result.success).toBe(true)
  })
  
  it('should audit user access controls', async () => {
    // Test access control auditing
    const result = await enterpriseRunner.executeCommand('security user audit --scope=financial')
    expect(result.success).toBe(true)
  })
})
```

### GDPR Compliance Testing

```javascript
// GDPR compliance testing
complianceRunner.gdpr(async () => {
  it('should protect personal data', async () => {
    // Test data protection
    const result = await enterpriseRunner.executeCommand('security data protect --type=personal')
    expect(result.success).toBe(true)
  })
  
  it('should manage consent', async () => {
    // Test consent management
    const result = await enterpriseRunner.executeCommand('security consent manage --action=collect')
    expect(result.success).toBe(true)
  })
})
```

### HIPAA Compliance Testing

```javascript
// HIPAA compliance testing
complianceRunner.hipaa(async () => {
  it('should protect PHI data', async () => {
    // Test PHI protection
    const result = await enterpriseRunner.executeCommand('security data protect --type=phi')
    expect(result.success).toBe(true)
  })
  
  it('should encrypt sensitive data', async () => {
    // Test encryption
    const result = await enterpriseRunner.executeCommand('security data encrypt --type=sensitive')
    expect(result.success).toBe(true)
  })
})
```

### PCI-DSS Compliance Testing

```javascript
// PCI-DSS compliance testing
complianceRunner.pciDss(async () => {
  it('should protect cardholder data', async () => {
    // Test cardholder data protection
    const result = await enterpriseRunner.executeCommand('security data protect --type=cardholder')
    expect(result.success).toBe(true)
  })
  
  it('should maintain secure networks', async () => {
    // Test secure network configuration
    const result = await enterpriseRunner.executeCommand('infra network configure --security=high')
    expect(result.success).toBe(true)
  })
})
```

## ⚡ Performance Testing

### Performance Monitoring

```javascript
import { EnterprisePerformanceTestRunner } from 'citty-test-utils'

const performanceRunner = new EnterprisePerformanceTestRunner()

// Performance testing
performanceRunner.performance(async () => {
  it('should execute commands under 100ms', async () => {
    const start = performance.now()
    await enterpriseRunner.executeCommand('infra server list')
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })
})
```

### Benchmarking

```javascript
// Benchmarking
performanceRunner.benchmark('server-list-performance', async () => {
  it('should benchmark server listing performance', async () => {
    await enterpriseRunner.executeCommand('infra server list')
  })
})

// Get benchmark results
const benchmarks = performanceRunner.getBenchmarks()
console.log('Benchmark results:', benchmarks)
```

### Load Testing

```javascript
// Load testing
performanceRunner.load(async () => {
  it('should handle concurrent server operations', async () => {
    await enterpriseRunner.executeCommand('infra server create --name=load-test-server')
  })
})

// Get load test results
const loadTests = performanceRunner.getLoadTestResults()
console.log('Load test results:', loadTests)
```

## 🔄 Cross-Domain Workflow Testing

### Workflow Testing

```javascript
import { EnterpriseIntegrationTestRunner } from 'citty-test-utils'

const integrationRunner = new EnterpriseIntegrationTestRunner()

// Cross-domain workflow testing
integrationRunner.workflow('disaster-recovery', async () => {
  it('should backup infrastructure and restore in different region', async () => {
    // Backup infrastructure
    await enterpriseRunner.executeCommand('infra backup create --region=us-east-1')
    
    // Restore in different region
    await enterpriseRunner.executeCommand('infra backup restore --region=eu-west-1')
  })
})
```

### Resource Lifecycle Testing

```javascript
// Resource lifecycle testing
integrationRunner.resourceLifecycle('infra', 'server', async () => {
  it('should manage server lifecycle', async () => {
    // Create server
    await enterpriseRunner.executeCommand('infra server create --name=lifecycle-test')
    
    // Update server
    await enterpriseRunner.executeCommand('infra server update --name=lifecycle-test --size=large')
    
    // Delete server
    await enterpriseRunner.executeCommand('infra server delete --name=lifecycle-test')
  })
})
```

### Enterprise Integration Testing

```javascript
// Enterprise integration testing
integrationRunner.integration(async () => {
  it('should integrate across domains', async () => {
    // Create infrastructure
    await enterpriseRunner.executeCommand('infra server create --name=integration-test')
    
    // Create development project
    await enterpriseRunner.executeCommand('dev project create --name=integration-project')
    
    // Deploy application
    await enterpriseRunner.executeCommand('dev project deploy --name=integration-project')
  })
})
```

## 📊 Enterprise Reporting

### Generate Reports

```javascript
// Generate enterprise reports
const enterpriseReport = enterpriseRunner.generateEnterpriseReports(results)
const complianceReport = complianceRunner.generateComplianceReport(results)
const performanceReport = performanceRunner.generatePerformanceReport(results)
const integrationReport = integrationRunner.generateIntegrationReport(results)

// Reports include:
// - Test execution summary
// - Performance metrics
// - Compliance validation
// - Cross-domain workflow results
// - Recommendations
```

### Report Structure

```javascript
{
  timestamp: '2024-01-01T00:00:00.000Z',
  context: {
    environment: 'production',
    compliance: 'SOX',
    region: 'us-east-1'
  },
  performance: {
    total_execution_time: 15000,
    average_suite_time: 5000,
    slowest_suite: 'infrastructure-tests',
    fastest_suite: 'unit-tests'
  },
  compliance: {
    sox: { status: 'compliant', tests: { total: 10, passed: 10, failed: 0 } },
    gdpr: { status: 'compliant', tests: { total: 8, passed: 8, failed: 0 } },
    hipaa: { status: 'compliant', tests: { total: 6, passed: 6, failed: 0 } },
    pciDss: { status: 'compliant', tests: { total: 12, passed: 12, failed: 0 } }
  },
  summary: {
    total: 100,
    passed: 95,
    failed: 5,
    skipped: 0,
    suites: 10,
    domains: ['infra', 'dev', 'security'],
    resources: ['server', 'project', 'user'],
    actions: ['create', 'list', 'update', 'delete']
  },
  recommendations: [
    {
      type: 'performance',
      priority: 'medium',
      message: 'Consider optimizing slow test suites',
      action: 'Review and optimize slow tests'
    }
  ]
}
```

## 🎯 Advanced Usage

### Custom Enterprise Context

```javascript
// Custom enterprise context
await enterpriseRunner.setupEnterpriseContext({
  environment: 'production',
  compliance: 'SOX',
  region: 'us-east-1',
  user: 'admin',
  role: 'administrator',
  workspace: 'production-workspace',
  tenant: 'enterprise-tenant',
  metadata: {
    project: 'enterprise-cli',
    version: '1.0.0',
    team: 'platform-team'
  }
})
```

### Performance Thresholds

```javascript
// Set performance thresholds
performanceRunner.setPerformanceThresholds({
  commandExecution: 50,    // 50ms
  testSuite: 5000,         // 5 seconds
  totalExecution: 30000,  // 30 seconds
})

// Check if performance meets thresholds
const meetsThresholds = performanceRunner.meetsPerformanceThresholds()
```

### Workflow Dependencies

```javascript
// Add workflow dependencies
integrationRunner.addWorkflowDependency('disaster-recovery', {
  type: 'resource',
  domain: 'infra',
  resource: 'backup',
  config: { name: 'backup-storage' }
})

integrationRunner.addWorkflowDependency('disaster-recovery', {
  type: 'context',
  config: { region: 'us-east-1' }
})
```

## 🔧 Configuration

### Enterprise Test Runner Configuration

```javascript
const enterpriseRunner = createEnterpriseTestRunner({
  defaultTimeout: 30000,
  defaultEnvironment: 'local',
  enableContext: true,
  enableAudit: true,
  enablePerformance: true,
  enableCompliance: true,
})
```

### Vitest Configuration

```javascript
// vitest.config.mjs
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    timeout: 30000,
    
    // Enterprise-specific test patterns
    include: [
      'test/**/*.test.mjs',
      'test/enterprise/**/*.test.mjs',
      'test/compliance/**/*.test.mjs',
      'test/performance/**/*.test.mjs',
      'test/integration/**/*.test.mjs',
    ],
    
    // Enterprise setup files
    setupFiles: ['./src/enterprise-test-setup.js'],
    globalSetup: ['./src/enterprise-global-setup.js'],
    globalTeardown: ['./src/enterprise-global-teardown.js'],
    
    // Enterprise reporter
    reporter: ['verbose', 'json', './src/enterprise-reporter.js'],
  },
})
```

## 📈 Best Practices

### 1. Context Management

```javascript
// Always setup enterprise context before testing
beforeEach(async () => {
  await enterpriseRunner.setupEnterpriseContext({
    environment: 'test',
    compliance: 'SOC2',
    region: 'us-east-1',
  })
})

afterEach(async () => {
  await enterpriseRunner.clearContext()
})
```

### 2. Domain Organization

```javascript
// Organize tests by enterprise domains
describe('Infrastructure Domain', () => {
  enterpriseRunner.describeDomain('infra', () => {
    enterpriseRunner.describeResource('server', () => {
      enterpriseRunner.describeAction('create', () => {
        it('should create server with enterprise validation')
      })
    })
  })
})
```

### 3. Compliance Testing

```javascript
// Test compliance requirements
describe('Compliance Testing', () => {
  complianceRunner.sox(() => {
    it('should validate financial data integrity')
    it('should audit user access controls')
  })
  
  complianceRunner.gdpr(() => {
    it('should protect personal data')
    it('should manage consent')
  })
})
```

### 4. Performance Testing

```javascript
// Monitor performance
describe('Performance Testing', () => {
  performanceRunner.performance(() => {
    it('should execute commands under threshold')
  })
  
  performanceRunner.benchmark('critical-path', () => {
    it('should benchmark critical operations')
  })
})
```

### 5. Cross-Domain Workflows

```javascript
// Test enterprise workflows
describe('Enterprise Workflows', () => {
  integrationRunner.workflow('disaster-recovery', () => {
    it('should backup and restore infrastructure')
  })
  
  integrationRunner.resourceLifecycle('infra', 'server', () => {
    it('should manage server lifecycle')
  })
})
```

## 🚨 Troubleshooting

### Common Issues

1. **Context Not Inherited**
   ```javascript
   // Ensure context is set before testing
   await enterpriseRunner.setupEnterpriseContext({ environment: 'test' })
   ```

2. **Performance Thresholds Not Met**
   ```javascript
   // Adjust performance thresholds
   performanceRunner.setPerformanceThresholds({
     commandExecution: 100, // Increase threshold
   })
   ```

3. **Compliance Tests Failing**
   ```javascript
   // Check compliance context
   const context = complianceRunner.getCurrentContext()
   expect(context.compliance).toBe('SOX')
   ```

4. **Workflow Dependencies Not Resolved**
   ```javascript
   // Add workflow dependencies
   integrationRunner.addWorkflowDependency('workflow-name', {
     type: 'resource',
     domain: 'infra',
     resource: 'server',
   })
   ```

## 📚 API Reference

### EnterpriseTestRunner

- `setupEnterpriseContext(contextData)` - Setup enterprise context
- `describeDomain(domainName, testFn)` - Domain-specific testing
- `describeResource(domainName, resourceName, testFn)` - Resource-specific testing
- `describeAction(domainName, resourceName, actionName, testFn)` - Action-specific testing
- `generateEnterpriseReports(results)` - Generate enterprise reports
- `getCurrentContext()` - Get current enterprise context
- `getPerformanceMetrics()` - Get performance metrics
- `getAuditLog()` - Get audit log

### EnterpriseComplianceTestRunner

- `sox(testFn)` - SOX compliance testing
- `gdpr(testFn)` - GDPR compliance testing
- `hipaa(testFn)` - HIPAA compliance testing
- `pciDss(testFn)` - PCI-DSS compliance testing
- `generateComplianceReport(results)` - Generate compliance report
- `getComplianceResults()` - Get compliance results
- `getComplianceStatus()` - Get compliance status

### EnterprisePerformanceTestRunner

- `performance(testFn)` - Performance monitoring
- `benchmark(name, testFn)` - Performance benchmarking
- `load(testFn)` - Load testing
- `generatePerformanceReport(results)` - Generate performance report
- `getBenchmarks()` - Get benchmark results
- `getLoadTestResults()` - Get load test results
- `setPerformanceThresholds(thresholds)` - Set performance thresholds

### EnterpriseIntegrationTestRunner

- `workflow(name, testFn)` - Cross-domain workflow testing
- `resourceLifecycle(domain, resource, testFn)` - Resource lifecycle testing
- `integration(testFn)` - Enterprise integration testing
- `generateIntegrationReport(results)` - Generate integration report
- `getIntegrationResults()` - Get integration results
- `addWorkflowDependency(workflowName, dependency)` - Add workflow dependency

## 🎯 Conclusion

The Enterprise Test Runner provides comprehensive testing capabilities for enterprise noun-verb CLI applications. It combines the power of Vitest with enterprise-specific features like context management, compliance testing, performance monitoring, and cross-domain workflow testing.

Key benefits:
- **Context-Aware Testing** - Automatic enterprise context inheritance
- **Domain Organization** - Natural test organization matching enterprise CLI structure
- **Compliance Validation** - Automated regulatory compliance testing
- **Performance Monitoring** - Built-in performance measurement and benchmarking
- **Cross-Domain Workflows** - Complex enterprise workflow testing
- **Enterprise Reporting** - Comprehensive enterprise test reports

The framework is designed to scale with enterprise needs while maintaining the simplicity and performance of Vitest.