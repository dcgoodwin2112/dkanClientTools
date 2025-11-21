/**
 * Build Configuration
 *
 * Defines the deployment mappings and build order for the DKAN Client Tools monorepo.
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

/**
 * Deployment mappings from package build outputs to Drupal module locations
 */
export const deployments = {
  core: {
    name: 'Core',
    source: 'packages/dkan-client-tools-core/dist/index.global.min.js',
    dest: 'dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js',
    expectedSize: { min: 35 * 1024, max: 50 * 1024 }, // 35-50KB
    global: 'DkanClientTools'
  },
  react: {
    name: 'React',
    source: 'packages/dkan-client-tools-react/dist/index.global.min.js',
    dest: 'dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/dkan-client-tools-react.min.js',
    expectedSize: { min: 200 * 1024, max: 220 * 1024 }, // 200-220KB
    global: 'DkanClientToolsReact'
  },
  vueFull: {
    name: 'Vue (Full)',
    source: 'packages/dkan-client-tools-vue/dist/index.global.full.min.js',
    dest: 'dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue.min.js',
    expectedSize: { min: 230 * 1024, max: 260 * 1024 }, // 230-260KB
    global: 'DkanClientToolsVue'
  },
  vueRuntime: {
    name: 'Vue (Runtime)',
    source: 'packages/dkan-client-tools-vue/dist/index-runtime.global.runtime.min.js',
    dest: 'dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js',
    expectedSize: { min: 165 * 1024, max: 185 * 1024 }, // 165-185KB
    global: 'DkanClientToolsVue'
  }
}

/**
 * Build order for packages (respects dependencies)
 */
export const packageBuildOrder = [
  {
    name: 'Core Package',
    path: 'packages/dkan-client-tools-core',
    deps: []
  },
  {
    name: 'React Package',
    path: 'packages/dkan-client-tools-react',
    deps: ['core']
  },
  {
    name: 'Vue Package',
    path: 'packages/dkan-client-tools-vue',
    deps: ['core']
  }
]

/**
 * Standalone example apps
 */
export const exampleApps = [
  {
    name: 'Vanilla Demo App',
    path: 'examples/vanilla-demo-app',
    deps: ['core']
  },
  {
    name: 'React Demo App',
    path: 'examples/react-demo-app',
    deps: ['react']
  },
  {
    name: 'React Catalog App',
    path: 'examples/react-catalog-app',
    deps: ['react']
  },
  {
    name: 'Vue Demo App',
    path: 'examples/vue-demo-app',
    deps: ['vue']
  }
]

/**
 * Drupal demo modules that need building
 */
export const drupalDemoModules = [
  {
    name: 'React Demo Module',
    path: 'dkan/docroot/modules/custom/dkan_client_demo_react',
    deps: ['react']
  },
  {
    name: 'Vue Demo Module',
    path: 'dkan/docroot/modules/custom/dkan_client_demo_vue',
    deps: ['vue']
  }
  // Note: vanilla demo module has no build process (plain JS)
]

/**
 * Helper to resolve paths from root
 */
export function resolvePath(relativePath) {
  return join(rootDir, relativePath)
}

export { rootDir }
