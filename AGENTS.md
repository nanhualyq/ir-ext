# AI Agent Instructions

## Project Overview
WXT + React browser extension project using Bun as the package manager.

## Architecture
- **Framework**: [WXT](https://wxt.dev/) - Modern Web Extension Tools
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin
- **Testing**: `bun:test` (built-in, no extra dependency)
- **Package Manager**: Bun

## Project Structure
```
├── entrypoints/                    # Extension entry points
│   ├── background.ts               # Service worker / background script
│   ├── content.ts                  # Content scripts (runs on web pages)
│   └── popup/                      # Browser action popup
│       ├── App.tsx                 # Main React component (early return pattern)
│       ├── main.tsx                # React entry point (createRoot + StrictMode)
│       ├── index.html              # Popup HTML template
│       ├── style.css               # Tailwind entry: @import 'tailwindcss'
│       └── lib/                    # Business logic (pure functions)
│           ├── matchBookmarks.ts   # Bookmark matching engine
│           └── __tests__/
│               └── matchBookmarks.test.ts
├── public/icon/                    # Extension icons (16/32/48/96/128px)
├── wxt.config.ts                   # WXT config (permissions, Vite plugins)
├── tsconfig.json                   # TS config (extends .wxt/tsconfig.json)
└── package.json
```

## Common Commands
```bash
# Development
bun run dev              # Start dev server (Chrome)
bun run dev:firefox      # Start dev server (Firefox)

# Build
bun run build            # Build for Chrome
bun run build:firefox    # Build for Firefox

# Package
bun run zip              # Create zip for Chrome
bun run zip:firefox      # Create zip for Firefox

# Type checking
bun run compile          # Run TypeScript compiler (no emit)

# Testing
bun test                 # Run all tests
bun test <pattern>       # Run tests matching pattern
```

## Key Conventions

### Tailwind CSS
- Entry: `@import 'tailwindcss'` in `style.css` (Tailwind v4 syntax, NOT `@tailwind` directives)
- Popup uses fixed width `w-[360px]` and min height `min-h-[400px]`
- No component library — pure Tailwind utility classes
- Vite plugin configured in `wxt.config.ts`: `vite: () => ({ plugins: [tailwindcss()] })`

### Entry Point APIs
WXT provides global functions for extension entry points:
- `defineBackground()` - Background script registration
- `defineContentScript()` - Content script registration
- `defineUnlistedScript()` - Non-listed scripts

### Browser APIs
- Access via global `browser` object (NOT `chrome`), provided by WXT
- `browser.tabs.query({ active: true, currentWindow: true })` — get current tab
- `browser.bookmarks.search(query)` — search bookmarks

### Popup Component Pattern
- Use **early return** for loading/empty states (keep main JSX clean)
- Each state (loading, empty, list) returns its own complete `<div>` wrapper
- `useEffect` for async data fetching, `useState` for local state

### TypeScript
- Strict mode enabled
- JSX: `react-jsx` (automatic runtime)
- Uses ESM modules (`"type": "module"`)
- Test files excluded from compilation via `tsconfig.json`: `"exclude": ["**/*.test.ts"]`

### Testing
- Framework: `bun:test` (`describe`, `test`, `expect`)
- Test location: `__tests__/` directories adjacent to source files
- Use helper functions for fixtures (e.g., `bk(id, url, title)` in bookmark tests)
- Run `bun test` before committing

## Important Notes
- Do NOT modify `.wxt/` directory (auto-generated)
- Output directory `.output/` is also auto-generated
- Use `wxt prepare` to regenerate types (runs automatically via postinstall)
- Manifest permissions (`tabs`, `bookmarks`) declared in `wxt.config.ts` under `manifest.permissions`
