# AGENTS.md - Development Guidelines for ir-ext

## Overview

This is a Firefox browser extension built with Quasar, Vue 3, and TypeScript. The extension provides incremental reading functionality via bookmarks.

## Build Commands

```bash
# Development (builds dev extension and opens Firefox)
npm run dev

# Build production extension
npm run build

# Run linting on source files
npm run lint

# Auto-format code with Prettier
npm run format

# Test (no tests configured)
npm test

# Run Firefox with built extension
npm run firefox
```

**Single File Linting:** `npx eslint -c ./eslint.config.js "<file-path>"`

**Single File Formatting:** `npx prettier --write "<file-path>"`

## Project Structure

- `src/` - Main Vue 3 application (Quasar app mode)
- `src-bex/` - Browser extension files (manifest, background script, content scripts, icons)
- `src/pages/` - Vue pages (IndexPage.vue, ErrorNotFound.vue)
- `src/router/` - Vue Router configuration
- `dist/` - Built extension output

## Code Style Guidelines

### Imports

- Use **type imports** for type-only imports:

  ```typescript
  import type { RouteRecordRaw } from 'vue-router';
  ```

- Group imports logically: external packages, Quasar, Vue, internal imports
  ```typescript
  import { useQuasar } from 'quasar';
  import { onMounted, ref } from 'vue';
  import { createRouter } from 'vue-router';
  ```

### TypeScript

- Strict mode is enabled in `quasar.config.ts`
- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/primitives
- Use `unknown` over `any` when type is uncertain, narrow with type guards

### Vue 3 + Quasar

- Use `<script setup lang="ts">` for all Vue components
- Use Composition API with `ref`, `computed`, `onMounted`, etc.
- Use Quasar components (`q-btn`, `q-list`, `q-item`, etc.)
- Access Quasar utilities via `useQuasar()` hook

### Naming Conventions

- **Variables/functions**: camelCase (`hitBookmarks`, `getCurrentTab`)
- **Constants**: SCREAMING_SNAKE_CASE (if used)
- **Classes/Interfaces**: PascalCase (`RouteRecordRaw`)
- **Vue components**: PascalCase file names (`IndexPage.vue`)
- **Booleans**: Prefix with `is`, `has`, `can` (`isFolder`, `hasChildren`)

### Formatting

- **Indent**: 2 spaces (via `.editorconfig`)
- **Line width**: 100 characters (via `.prettierrc.json`)
- **Quotes**: Single quotes (`'string'`)
- **Semicolons**: Required
- **Trailing commas**: Allowed
- **Final newline**: Required

### Chrome Extension APIs

- Use `chrome.bookmarks`, `chrome.tabs`, `chrome.runtime`, `chrome.storage`
- Handle `chrome.runtime.lastError` in callbacks
- Use non-null assertion (`!`) only after validation
- Use `void` for fire-and-forget promises

### ESLint Configuration

- Based on `@quasar/app-vite` recommended config
- Vue 3 ESLint plugin in `flat/essential` mode
- TypeScript with `vueTsConfigs.recommendedTypeChecked`
- Prettier integration via `@vue/eslint-config-prettier`

### Browser Compatibility

- Build targets: `es2022`, `firefox115`, `chrome115`, `safari14`
- Node target: `node20`

## Quasar BEX Bridge

Use `createBridge()` in `src-bex/background.ts` for extension-app communication:

```typescript
import { createBridge } from '#q-app/bex/background';
const bridge = createBridge({ debug: false });

// Send to app/content scripts
bridge.send({ event: 'storage.get', to: 'app', payload: 'key' });

// Listen for events
bridge.on('storage.get', ({ payload: key }) => {
  /* ... */
});
```

```vue
<script setup>
import { useQuasar } from 'quasar';
const $q = useQuasar();

// Use $q.bex (the bridge)
// $q.bex.portName is "app"
</script>
```

## Dependencies

- **Framework**: Quasar v2, Vue 3.5
- **Router**: Vue Router 4
- **Build**: Vite with Quasar CLI
- **Linting**: ESLint 9, Prettier 3
- **TypeScript**: 5.9 (strict mode)
