import { readFileSync, writeFileSync } from 'node:fs'
import { parseModule, generateCode } from 'magicast'
import { createRegExp, exactly, anyOf } from 'magic-regexp'

/**
 * Automatically heals a test file by replacing a failed assertion value.
 * 
 * @param {string} filePath - Path to the test file to be healed
 * @param {Object} failedAssertion - Object containing failure details
 * @param {any} failedAssertion.expected - The expected value that caused the failure
 * @param {any} failedAssertion.actual - The actual value to replace with
 */
export function autoHealTest(filePath, failedAssertion) {
  const { expected, actual } = failedAssertion
  
  // Read and parse the test file
  const code = readFileSync(filePath, 'utf8')
  const mod = parseModule(code)
  
  // Define patterns for finding the assertion
  const assertionMethod = createRegExp(anyOf('toBe', 'toEqual', 'toStrictEqual'))
  const expectedPattern = createRegExp(exactly(String(expected)))

  let modified = false

  /**
   * Recursively walks the AST to find the assertion and update its value
   */
  const walk = (node) => {
    if (!node || typeof node !== 'object') return

    // Target CallExpressions like expect(...).toBe(expected)
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      node.callee.property?.type === 'Identifier' &&
      assertionMethod.test(node.callee.property.name)
    ) {
      const args = node.arguments
      if (args?.length > 0) {
        const arg = args[0]
        // Match Literal arguments that correspond to the expected value
        if (
          arg.type === 'Literal' && 
          expectedPattern.test(String(arg.value))
        ) {
          arg.value = actual
          // Ensure raw value is updated for correct stringification
          if (arg.raw) {
            arg.raw = typeof actual === 'string' ? `'${actual}'` : String(actual)
          }
          modified = true
          return
        }
      }
    }

    // Standard AST traversal
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const child = node[key]
        if (Array.isArray(child)) {
          for (const item of child) {
            walk(item)
          }
        } else if (child && typeof child === 'object') {
          walk(child)
        }
      }
    }
  }

  // Execute the walk on the module's AST
  walk(mod.$ast)

  if (modified) {
    const { code: newCode } = generateCode(mod)
    writeFileSync(filePath, newCode, 'utf8')
    return true
  }

  return false
}
