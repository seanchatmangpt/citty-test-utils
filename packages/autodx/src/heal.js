import { consola } from '@un-test/core'
import { execSync } from 'node:child_process'
import { readFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { loadFile, writeFile as writeMagicastFile, builders } from 'magicast'
import { resolve } from 'pathe'

/**
 * Hyper Advanced Auto-Heal
 * Automatically corrects failing test assertions (toBe, toEqual, toMatchInlineSnapshot)
 * using AST rewriting via magicast and confirms correctness by rerunning tests.
 */
export async function autoHeal({ cwd = process.cwd(), args = [] } = {}) {
  consola.info('🩹 AutoDX Heal initialized. Analyzing failing tests...')

  const reportPath = resolve(cwd, 'test-results-heal.json')

  const exampleConfigPath = resolve(cwd, 'vitest.config.example.js')

  // 1. Run vitest with JSON reporter to capture failures
  try {
    consola.start('Running vitest to gather failure report...')
    const vitestArgs = args.length > 0 ? args.join(' ') : ''
    const cleanEnv = { ...process.env, FORCE_COLOR: '0' }
    if (cleanEnv.NODE_ENV === 'test') cleanEnv.NODE_ENV = 'development'
    delete cleanEnv.VITEST
    delete cleanEnv.JEST_WORKER_ID
    delete cleanEnv.TEST
    delete cleanEnv.NODE_OPTIONS

    execSync(`npx vitest run ${vitestArgs} --config="${exampleConfigPath}" --reporter=json --outputFile="${reportPath}"`, {
      cwd,
      stdio: 'pipe',
      env: cleanEnv,
    })
    consola.success('✅ All tests passed. No healing needed!')
    await cleanupReport(reportPath)
    return
  } catch (err) {
    // Expected to fail if there are failing tests
  }

  if (!existsSync(reportPath)) {
    consola.error('❌ Could not generate vitest failure report.')
    return
  }

  const reportRaw = await readFile(reportPath, 'utf8')
  let report = JSON.parse(reportRaw)

  // 2. Process failures and apply AST updates
  let healedCount = 0
  const testResults = report.testResults || []

  for (const suite of testResults) {
    const filePath = suite.name
    if (!filePath || !existsSync(filePath)) continue

    const assertionResults = suite.assertionResults || []
    const failedAssertions = assertionResults.filter((res) => res.status === 'failed')

    if (failedAssertions.length === 0) continue

    // Load the test file using magicast
    consola.start(`Parsing test file: ${filePath}`)
    const mod = await loadFile(filePath)
    let fileUpdated = false

    for (const assertion of failedAssertions) {
      const failureMessage = assertion.failureMessages?.[0] || ''
      const { expectedValue, receivedValue } = parseFailureMessage(failureMessage)

      if (receivedValue === undefined) {
        consola.warn(
          `⚠️ Could not parse actual value from failure message: "${failureMessage.slice(0, 100)}..."`
        )
        continue
      }

      // Search the AST for the test block matching this assertion
      const testPath = [...(assertion.ancestorTitles || []), assertion.title]
      const testBlockNode = findTargetTestBlock(mod.$ast, testPath)

      if (!testBlockNode) {
        consola.warn(`⚠️ Could not locate test block in AST: "${testPath.join(' > ')}"`)
        continue
      }

      const expectCalls = findExpectCalls(testBlockNode)
      const failureLine = assertion.location?.line
      const matchingExpect = findMatchingExpect(expectCalls, expectedValue, failureLine)

      if (!matchingExpect) {
        consola.warn(`⚠️ Could not locate matching expect() assertion inside test block`)
        continue
      }

      // Update the expect argument with the received value using magicast builders
      const literalNode = builders.literal(receivedValue)
      if (matchingExpect.matcher === 'toMatchInlineSnapshot') {
        if (matchingExpect.node.arguments.length === 0) {
          matchingExpect.node.arguments.push(literalNode)
        } else {
          matchingExpect.node.arguments[0] = literalNode
        }
      } else {
        // toBe or toEqual
        matchingExpect.node.arguments[0] = literalNode
      }

      consola.success(`✏️ Corrected assertion in "${testPath.join(' > ')}" to:`, receivedValue)
      fileUpdated = true
      healedCount++
    }

    if (fileUpdated) {
      await writeMagicastFile(mod, filePath)
      consola.success(`💾 Saved changes to: ${filePath}`)
    }
  }

  await cleanupReport(reportPath)

  if (healedCount > 0) {
    consola.success(`🩹 Successfully healed ${healedCount} assertions!`)
    // 3. Re-run tests to verify healing
    consola.start('Rerunning vitest to verify all tests now pass...')
    const vitestArgs = args.length > 0 ? args.join(' ') : ''
    const cleanEnv = { ...process.env }
    if (cleanEnv.NODE_ENV === 'test') cleanEnv.NODE_ENV = 'development'
    delete cleanEnv.VITEST
    delete cleanEnv.JEST_WORKER_ID
    delete cleanEnv.TEST
    delete cleanEnv.NODE_OPTIONS

    execSync(`npx vitest run ${vitestArgs} --config="${exampleConfigPath}"`, {
      cwd,
      stdio: 'inherit',
      env: cleanEnv,
    })
    consola.success('✅ Verification successful! All tests are passing!')
  } else {
    consola.info('No assertions could be automatically healed.')
  }
}

async function cleanupReport(reportPath) {
  try {
    if (existsSync(reportPath)) {
      await unlink(reportPath)
    }
  } catch (err) {
    // Ignore cleanup error
  }
}

function parseFailureMessage(msg) {
  if (!msg) return {}

  let expectedValue
  let receivedValue

  // Clean Vitest's ANSI color codes
  const cleanMsg = msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-m]/g, '')

  // Pattern 1:
  // - Expected / - Snapshot
  // + Received
  // ...
  // - "expected"
  // + "received"
  const lines = cleanMsg.split('\n')
  const expectedIdx = lines.findIndex((l) => l.includes('- Expected') || l.includes('- Snapshot'))
  const receivedIdx = lines.findIndex((l) => l.includes('+ Received') || l.includes('+ Actual'))

  if (expectedIdx !== -1 && receivedIdx !== -1) {
    const startScan = Math.max(expectedIdx, receivedIdx) + 1
    const expectedLines = []
    const receivedLines = []
    let foundDiff = false

    for (let i = startScan; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('- ')) {
        foundDiff = true
        expectedLines.push(line.slice(2))
      } else if (line.startsWith('+ ')) {
        foundDiff = true
        receivedLines.push(line.slice(2))
      } else if (
        foundDiff &&
        !line.startsWith(' ') &&
        !line.startsWith('-') &&
        !line.startsWith('+')
      ) {
        break
      }
    }

    if (expectedLines.length > 0) {
      expectedValue = cleanValue(expectedLines.join('\n'))
    }
    if (receivedLines.length > 0) {
      receivedValue = cleanValue(receivedLines.join('\n'))
    }
  }

  // Pattern 2: expected [actual] to be [expected]
  if (receivedValue === undefined || expectedValue === undefined) {
    const toBeMatch = cleanMsg.match(/expected\s+(.*?)\s+to\s+(?:be|equal|contain)\s+(.*)/is)
    if (toBeMatch) {
      receivedValue = cleanValue(toBeMatch[1])
      expectedValue = cleanValue(toBeMatch[2])
    }
  }

  return { expectedValue, receivedValue }
}

function cleanValue(val) {
  if (typeof val !== 'string') return val
  const trimmed = val.trim()

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed === 'undefined') return undefined
  if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed)

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`'))
  ) {
    try {
      return new Function(`return ${trimmed}`)()
    } catch {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

function findTargetTestBlock(ast, testPath) {
  const cleanTestPath = testPath.filter((t) => t && t.trim() !== '')
  let targetBlock = null

  function traverse(node, currentPath) {
    if (!node || typeof node !== 'object') return
    if (targetBlock) return // stop early if found

    let nextPath = currentPath
    let isMatch = false

    if (node.type === 'CallExpression' && node.callee) {
      const calleeName = node.callee.name || (node.callee.property && node.callee.property.name)
      if (['describe', 'suite', 'it', 'test'].includes(calleeName)) {
        const titleArg = node.arguments[0]
        if (titleArg && (titleArg.type === 'StringLiteral' || titleArg.type === 'Literal')) {
          const titleVal = titleArg.value
          nextPath = [...currentPath, titleVal]

          const cleanNext = nextPath.filter((t) => t && t.trim() !== '')
          if (
            cleanNext.length === cleanTestPath.length &&
            cleanNext.every((val, idx) => val === cleanTestPath[idx])
          ) {
            isMatch = true
            targetBlock = node
          }
        }
      }
    }

    if (isMatch) return

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const child = node[key]
        if (Array.isArray(child)) {
          for (const item of child) {
            traverse(item, nextPath)
          }
        } else if (child && typeof child === 'object' && typeof child.type === 'string') {
          traverse(child, nextPath)
        }
      }
    }
  }

  traverse(ast, [])
  return targetBlock
}

function findExpectCalls(testBlockNode) {
  const expectCalls = []

  function traverse(node) {
    if (!node || typeof node !== 'object') return

    if (node.type === 'CallExpression') {
      if (node.callee && node.callee.type === 'MemberExpression') {
        const propertyName = node.callee.property.name
        if (['toBe', 'toEqual', 'toMatchInlineSnapshot'].includes(propertyName)) {
          const expectCall = node.callee.object
          if (
            expectCall &&
            expectCall.type === 'CallExpression' &&
            expectCall.callee &&
            expectCall.callee.name === 'expect'
          ) {
            expectCalls.push({
              node,
              matcher: propertyName,
              args: node.arguments,
            })
          }
        }
      }
    }

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const child = node[key]
        if (Array.isArray(child)) {
          for (const item of child) {
            traverse(item)
          }
        } else if (child && typeof child === 'object' && typeof child.type === 'string') {
          traverse(child)
        }
      }
    }
  }

  traverse(testBlockNode)
  return expectCalls
}

function findMatchingExpect(expectCalls, expectedValue, failureLine) {
  if (expectCalls.length === 0) return null
  if (expectCalls.length === 1) return expectCalls[0]

  if (failureLine) {
    const match = expectCalls.find((c) => c.node.loc && c.node.loc.start.line === failureLine)
    if (match) return match
  }

  if (expectedValue !== undefined) {
    const match = expectCalls.find((c) => {
      const arg = c.args[0]
      if (!arg) return false
      if (arg.type === 'Literal' || arg.type === 'StringLiteral') {
        return arg.value === expectedValue
      }
      return false
    })
    if (match) return match
  }

  return expectCalls[0]
}
