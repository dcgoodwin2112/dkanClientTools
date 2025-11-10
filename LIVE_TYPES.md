# Live Types Setup

This monorepo is configured with **live types** - changes to TypeScript source files in one package are immediately reflected in dependent packages without requiring a rebuild.

## How It Works

The monorepo uses **custom export conditions** to point to TypeScript source files during development:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",  // ← Source files in dev
      "types": "./dist/index.d.ts",      // ← Built types in prod
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

When TypeScript and Vite see the `"development"` condition, they resolve imports to source `.ts` files instead of built `.js` files.

## Configuration

### 1. Package.json (All Packages)

Each package exports a `"development"` condition pointing to source:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 2. TypeScript (All Packages)

TypeScript is configured to use the development condition:

```json
{
  "compilerOptions": {
    "customConditions": ["development"]
  }
}
```

### 3. Vite (Example Apps & Tests)

Vite/Vitest configs use the development condition:

```typescript
export default defineConfig({
  resolve: {
    conditions: ['development'],
  },
  // ... other config
})
```

## Benefits

### ✅ Instant Type Updates

When you change a type in `@dkan-client-tools/core`:

```typescript
// packages/dkan-client-tools-core/src/types/dataset.ts
export interface DkanDataset {
  identifier: string
  title: string
  newField: string  // ← Add this
}
```

The change is **immediately visible** in React and Vue packages without rebuilding:

```typescript
// packages/dkan-client-tools-react/src/useDataset.ts
// TypeScript instantly knows about 'newField'
const dataset = useDataset({ identifier: 'abc' })
dataset.data?.newField  // ← Auto-complete works immediately!
```

### ✅ Faster Development

- **No rebuilds needed** when working across packages
- **Instant feedback** in your IDE
- **Faster tests** - no waiting for builds between changes

### ✅ Better Debugging

- Source maps point to actual TypeScript source
- "Go to Definition" jumps to source `.ts` files
- Easier to trace issues across packages

## Production Builds

The `"development"` condition is **only used during development**. Production builds automatically use the built artifacts:

```bash
npm run build        # Builds all packages to dist/
npm run build:types  # Builds TypeScript declarations with project references
```

In production, the following conditions are used (in order):
1. `"types"` → `./dist/index.d.ts`
2. `"import"` → `./dist/index.js`
3. `"require"` → `./dist/index.cjs`

## Development Workflow

### Working on Core Package

```bash
cd packages/dkan-client-tools-core

# Edit source files
vim src/client/dkanClient.ts

# No build needed! Changes are instantly visible in:
# - packages/dkan-client-tools-react
# - packages/dkan-client-tools-vue
# - examples/react-demo-app
# - examples/vue-demo-app
```

### Running Tests

Tests use source files automatically:

```bash
npm test                    # Run all tests (uses source files)
npm run test:watch          # Watch mode (instant updates)
cd packages/dkan-client-tools-react && npm test  # Single package
```

### Running Example Apps

Example apps use source files automatically:

```bash
cd examples/react-demo-app
npm run dev                 # Uses source files from packages/

# Make changes to packages/dkan-client-tools-react/src/
# Vite will hot-reload with your changes instantly!
```

### TypeScript Checking

TypeScript uses source files for checking:

```bash
npm run typecheck           # Check all packages (uses source)
npm run build:types         # Build type declarations (for production)
```

## Troubleshooting

### "Cannot find module" Errors

If you see import errors, ensure:

1. **Dependencies are installed**:
   ```bash
   npm install
   ```

2. **TypeScript config has customConditions**:
   ```json
   {
     "compilerOptions": {
       "customConditions": ["development"]
     }
   }
   ```

3. **Vite config has conditions**:
   ```typescript
   export default defineConfig({
     resolve: {
       conditions: ['development'],
     }
   })
   ```

### Types Not Updating

If changes aren't reflected:

1. **Restart TypeScript server** in your IDE
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - Or reload window: `Cmd+Shift+P` → "Developer: Reload Window"

2. **Check you're in the right mode**:
   ```bash
   # Should show customConditions: ["development"]
   npx tsc --showConfig | grep -A 2 customConditions
   ```

3. **Clear Vite cache** (for example apps):
   ```bash
   rm -rf node_modules/.vite
   ```

### Production Build Issues

If production builds fail:

1. **Build packages first**:
   ```bash
   npm run build              # Build all packages
   ```

2. **Check dist/ exists**:
   ```bash
   ls packages/dkan-client-tools-core/dist/
   ls packages/dkan-client-tools-react/dist/
   ls packages/dkan-client-tools-vue/dist/
   ```

3. **Clear and rebuild**:
   ```bash
   npm run clean
   npm run build
   ```

## Technical Details

### Export Condition Resolution

When TypeScript or Vite resolves `@dkan-client-tools/core`, they check conditions in order:

1. `"development"` → If customConditions includes "development", use `./src/index.ts`
2. `"types"` → Otherwise, use `./dist/index.d.ts` for types
3. `"import"` → Use `./dist/index.js` for ESM
4. `"require"` → Use `./dist/index.cjs` for CommonJS

### Why This Works

- **TypeScript** (5.0+) supports `customConditions` in tsconfig
- **Vite/Vitest** support `resolve.conditions` in config
- **Node.js** (16.9+) supports custom conditions natively
- **Package exports** use conditional exports standard (Node 12.7+)

### Source File Structure

The monorepo is set up so source files are always in `src/` and built files in `dist/`:

```
packages/
  dkan-client-tools-core/
    src/              ← TypeScript source
    dist/             ← Built artifacts (git-ignored)
  dkan-client-tools-react/
    src/              ← TypeScript source
    dist/             ← Built artifacts (git-ignored)
  dkan-client-tools-vue/
    src/              ← TypeScript source
    dist/             ← Built artifacts (git-ignored)
```

The `"src"` directory is included in `package.json` files array so source is available in node_modules.

## References

- [TypeScript: customConditions](https://www.typescriptlang.org/tsconfig#customConditions)
- [Vite: resolve.conditions](https://vitejs.dev/config/shared-options.html#resolve-conditions)
- [Node.js: Package Exports](https://nodejs.org/api/packages.html#conditional-exports)
- [Live Types in a TypeScript Monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) by Colin McDonnell (Zod creator)
