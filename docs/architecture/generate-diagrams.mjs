#!/usr/bin/env node
/**
 * @fileoverview PlantUML Diagram Generator for CTU Analysis Verbs Architecture
 * @description Generates all innovative architecture diagrams from PlantUML source files
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'

const ARCHITECTURE_DIR = 'docs/architecture'
const OUTPUT_DIR = 'docs/architecture/generated'

/**
 * Check if PlantUML is installed
 * @returns {boolean} True if PlantUML is available
 */
function checkPlantUML() {
  try {
    execSync('plantuml -version', { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Install PlantUML via npm
 */
function installPlantUML() {
  console.log('📦 Installing PlantUML...')
  try {
    execSync('npm install -g plantuml', { stdio: 'inherit' })
    console.log('✅ PlantUML installed successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to install PlantUML:', error.message)
    return false
  }
}

/**
 * Generate diagrams from PlantUML source files
 * @param {string} format - Output format (png, svg, pdf)
 */
function generateDiagrams(format = 'png') {
  if (!existsSync(ARCHITECTURE_DIR)) {
    console.error(`❌ Architecture directory not found: ${ARCHITECTURE_DIR}`)
    return
  }

  const pumlFiles = readdirSync(ARCHITECTURE_DIR)
    .filter((file) => extname(file) === '.puml')
    .map((file) => join(ARCHITECTURE_DIR, file))

  if (pumlFiles.length === 0) {
    console.log('ℹ️  No PlantUML files found')
    return
  }

  console.log(`🚀 Generating ${format.toUpperCase()} diagrams from ${pumlFiles.length} files...`)

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    execSync(`mkdir -p ${OUTPUT_DIR}`, { stdio: 'pipe' })
  }

  for (const pumlFile of pumlFiles) {
    const fileName = basename(pumlFile, '.puml')
    const outputFile = join(OUTPUT_DIR, `${fileName}.${format}`)

    try {
      console.log(`📊 Generating: ${fileName}.${format}`)
      execSync(`plantuml -t${format} -o ${OUTPUT_DIR} ${pumlFile}`, { stdio: 'pipe' })
      console.log(`✅ Generated: ${outputFile}`)
    } catch (error) {
      console.error(`❌ Failed to generate ${fileName}:`, error.message)
    }
  }

  console.log(`🎉 Diagram generation complete! Check ${OUTPUT_DIR}/`)
}

/**
 * List available PlantUML files
 */
function listDiagrams() {
  if (!existsSync(ARCHITECTURE_DIR)) {
    console.log('❌ Architecture directory not found')
    return
  }

  const pumlFiles = readdirSync(ARCHITECTURE_DIR)
    .filter((file) => extname(file) === '.puml')
    .map((file) => basename(file, '.puml'))

  if (pumlFiles.length === 0) {
    console.log('ℹ️  No PlantUML files found')
    return
  }

  console.log('📋 Available PlantUML Diagrams:')
  pumlFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`)
  })
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'generate'
  const format = args[1] || 'png'

  console.log('🚀 CTU Analysis Verbs - Innovative Architecture Diagram Generator')
  console.log('='.repeat(60))

  switch (command) {
    case 'list':
      listDiagrams()
      break

    case 'install':
      if (checkPlantUML()) {
        console.log('✅ PlantUML is already installed')
      } else {
        installPlantUML()
      }
      break

    case 'generate':
    default:
      if (!checkPlantUML()) {
        console.log('❌ PlantUML not found. Please install it first:')
        console.log('   npm install -g plantuml')
        console.log('   or run: node generate-diagrams.mjs install')
        return
      }

      if (!['png', 'svg', 'pdf'].includes(format)) {
        console.error('❌ Invalid format. Use: png, svg, or pdf')
        return
      }

      generateDiagrams(format)
      break
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { checkPlantUML, generateDiagrams, listDiagrams }
