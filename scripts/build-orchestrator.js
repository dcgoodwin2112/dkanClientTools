#!/usr/bin/env node

/**
 * Build Orchestrator
 *
 * Automates the complete build and deployment workflow for DKAN Client Tools:
 * 1. Build all packages (core, react, vue)
 * 2. Copy built files to Drupal base modules
 * 3. Build standalone demo apps
 * 4. Build Drupal demo modules
 */

import { execSync } from 'child_process'
import { copyFileSync, existsSync, statSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import {
  deployments,
  packageBuildOrder,
  exampleApps,
  drupalDemoModules,
  resolvePath
} from './build-config.js'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Track overall success/failure
let hasErrors = false

/**
 * Print formatted header
 */
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`)
}

/**
 * Print formatted step
 */
function printStep(number, total, text) {
  console.log(`${colors.bright}${colors.blue}[${number}/${total}]${colors.reset} ${text}`)
}

/**
 * Print success message
 */
function printSuccess(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`)
}

/**
 * Print error message
 */
function printError(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`)
  hasErrors = true
}

/**
 * Print warning message
 */
function printWarning(text) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`)
}

/**
 * Print info message
 */
function printInfo(text) {
  console.log(`${colors.dim}  ${text}${colors.reset}`)
}

/**
 * Execute a command and handle errors
 */
function exec(command, cwd, options = {}) {
  try {
    const result = execSync(command, {
      cwd,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    })
    return { success: true, output: result }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr
    }
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check if a file size is within expected range
 */
function checkFileSize(filePath, expectedSize) {
  const stats = statSync(filePath)
  const size = stats.size

  if (size < expectedSize.min) {
    printWarning(`File is smaller than expected: ${formatSize(size)} < ${formatSize(expectedSize.min)}`)
    return false
  }

  if (size > expectedSize.max) {
    printWarning(`File is larger than expected: ${formatSize(size)} > ${formatSize(expectedSize.max)}`)
    return false
  }

  return true
}

/**
 * Phase 1: Build all packages
 */
function buildPackages() {
  printHeader('Phase 1: Building Packages')

  let step = 1
  const total = packageBuildOrder.length

  for (const pkg of packageBuildOrder) {
    printStep(step++, total, `Building ${pkg.name}`)

    const pkgPath = resolvePath(pkg.path)

    if (!existsSync(pkgPath)) {
      printError(`Package directory not found: ${pkg.path}`)
      return false
    }

    printInfo(`Running: npm run build`)
    const result = exec('npm run build', pkgPath)

    if (!result.success) {
      printError(`Failed to build ${pkg.name}`)
      printError(result.error)
      return false
    }

    printSuccess(`${pkg.name} built successfully`)
  }

  return true
}

/**
 * Phase 2: Deploy to Drupal modules
 */
function deployToDrupal() {
  printHeader('Phase 2: Deploying to Drupal Base Modules')

  let step = 1
  const total = Object.keys(deployments).length

  for (const [key, deployment] of Object.entries(deployments)) {
    printStep(step++, total, `Deploying ${deployment.name}`)

    const sourcePath = resolvePath(deployment.source)
    const destPath = resolvePath(deployment.dest)

    // Check if source file exists
    if (!existsSync(sourcePath)) {
      printError(`Source file not found: ${deployment.source}`)
      printInfo('Did the package build succeed?')
      return false
    }

    // Check file size
    const sizeOk = checkFileSize(sourcePath, deployment.expectedSize)
    const stats = statSync(sourcePath)
    printInfo(`Source size: ${formatSize(stats.size)}`)

    // Ensure destination directory exists
    const destDir = dirname(destPath)
    if (!existsSync(destDir)) {
      printInfo(`Creating destination directory: ${destDir}`)
      mkdirSync(destDir, { recursive: true })
    }

    // Copy file
    try {
      copyFileSync(sourcePath, destPath)
      printSuccess(`Deployed to ${deployment.dest}`)

      if (!sizeOk) {
        printWarning('File size outside expected range (see warning above)')
      }
    } catch (error) {
      printError(`Failed to copy file: ${error.message}`)
      return false
    }
  }

  return true
}

/**
 * Phase 3: Build standalone example apps
 */
function buildExamples() {
  printHeader('Phase 3: Building Standalone Example Apps')

  let step = 1
  const total = exampleApps.length

  for (const app of exampleApps) {
    printStep(step++, total, `Building ${app.name}`)

    const appPath = resolvePath(app.path)

    if (!existsSync(appPath)) {
      printError(`Example app directory not found: ${app.path}`)
      return false
    }

    printInfo(`Running: npm run build`)
    const result = exec('npm run build', appPath)

    if (!result.success) {
      printError(`Failed to build ${app.name}`)
      printError(result.error)
      return false
    }

    printSuccess(`${app.name} built successfully`)
  }

  return true
}

/**
 * Phase 4: Build Drupal demo modules
 */
function buildDrupalModules() {
  printHeader('Phase 4: Building Drupal Demo Modules')

  let step = 1
  const total = drupalDemoModules.length

  for (const module of drupalDemoModules) {
    printStep(step++, total, `Building ${module.name}`)

    const modulePath = resolvePath(module.path)

    if (!existsSync(modulePath)) {
      printError(`Module directory not found: ${module.path}`)
      return false
    }

    // Check if node_modules exists, if not run npm install
    const nodeModulesPath = resolvePath(`${module.path}/node_modules`)
    if (!existsSync(nodeModulesPath)) {
      printInfo(`Running: npm install`)
      const installResult = exec('npm install', modulePath)

      if (!installResult.success) {
        printError(`Failed to install dependencies for ${module.name}`)
        printError(installResult.error)
        return false
      }
    }

    printInfo(`Running: npm run build`)
    const result = exec('npm run build', modulePath)

    if (!result.success) {
      printError(`Failed to build ${module.name}`)
      printError(result.error)
      return false
    }

    printSuccess(`${module.name} built successfully`)
  }

  return true
}

/**
 * Main orchestrator
 */
async function main() {
  const args = process.argv.slice(2)
  const phase = args[0]

  console.log(`${colors.bright}${colors.magenta}`)
  console.log('╔════════════════════════════════════════════════════════════════════════════╗')
  console.log('║                    DKAN Client Tools Build Orchestrator                    ║')
  console.log('╚════════════════════════════════════════════════════════════════════════════╝')
  console.log(colors.reset)

  let success = true

  // Allow running individual phases
  switch (phase) {
    case 'packages':
      success = buildPackages()
      break

    case 'deploy':
      success = deployToDrupal()
      break

    case 'examples':
      success = buildExamples()
      break

    case 'drupal':
      success = buildDrupalModules()
      break

    default:
      // Run complete workflow
      success = buildPackages()
      if (!success) {
        printError('Package build failed. Stopping.')
        process.exit(1)
      }

      success = deployToDrupal()
      if (!success) {
        printError('Deployment failed. Stopping.')
        process.exit(1)
      }

      success = buildExamples()
      if (!success) {
        printError('Example build failed. Stopping.')
        process.exit(1)
      }

      success = buildDrupalModules()
      if (!success) {
        printError('Drupal module build failed. Stopping.')
        process.exit(1)
      }
  }

  // Print final summary
  console.log()
  if (success && !hasErrors) {
    console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`)
    console.log(`${colors.bright}${colors.green}✓ Build completed successfully!${colors.reset}`)
    console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`)
    console.log()

    if (phase !== 'packages' && phase !== 'examples') {
      printInfo('Next steps:')
      printInfo('  - Run "ddev drush cr" to clear Drupal cache')
      printInfo('  - Test your changes in the browser')
    }

    process.exit(0)
  } else {
    console.log(`${colors.bright}${colors.red}${'='.repeat(80)}${colors.reset}`)
    console.log(`${colors.bright}${colors.red}✗ Build completed with errors${colors.reset}`)
    console.log(`${colors.bright}${colors.red}${'='.repeat(80)}${colors.reset}`)
    process.exit(1)
  }
}

// Run orchestrator
main().catch(error => {
  printError(`Unexpected error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
